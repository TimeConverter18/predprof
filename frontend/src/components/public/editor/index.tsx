import Editor from "@monaco-editor/react"
import {useEffect, useRef, useState} from "react"
import {Controls} from "./controls.tsx"
import {Terminal} from "./terminal.tsx"
import type {ConsoleLine} from "./types.ts"
import init, {PositionEncoding, Workspace} from "@astral-sh/ruff-wasm-web"
import ruffWasmUrl from "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm?url"

type Monaco = typeof import("monaco-editor")
type MonacoEditor = import("monaco-editor").editor.IStandaloneCodeEditor
type MonacoModel = import("monaco-editor").editor.ITextModel

interface JediCompletion {
    label: string
    kind: string
    detail: string
    documentation: string
    insertText: string
}

interface RuffDiagnostic {
    code: string
    message: string
    start_location: { row: number; column: number }
    end_location: { row: number; column: number }
}

interface PasteEvent {
    range: {
        getStartPosition(): import("monaco-editor").Position
        getEndPosition(): import("monaco-editor").Position
    }
}

interface ContentChangeEvent {
    isUndoing: boolean
    isRedoing: boolean
    changes: Array<{ rangeOffset: number; rangeLength: number; text: string }>
}

interface WorkerMessage {
    type: string
    status?: string
    text?: string
    prompt?: string
    id?: string
    completions?: JediCompletion[]
}

interface ConsoleState {
    head: ConsoleLine[]
    tail: ConsoleLine[]
    hasEllipsis: boolean
    headLines: number
    tailLines: number
}

const HALF = 10000
const defaultCode = "for i in range(25000):\n    print(i)\n"
const pendingRequests = new Map<string, { resolve: (v: JediCompletion[]) => void }>()

const mapJediKind = (kind: string, monaco: Monaco) => {
    const K = monaco.languages.CompletionItemKind
    const map: Record<string, number> = {
        class: K.Class, module: K.Module,
        instance: K.Variable, variable: K.Variable, keyword: K.Keyword,
        statement: K.Snippet, property: K.Property, import: K.Module,
    }
    return map[kind] ?? K.Text
}

function countLines(item: ConsoleLine): number {
    const text = item.text ?? ""
    return (text.match(/\n/g) ?? []).length + (item.userInput ? 1 : 0)
}

function mergeInto(lines: ConsoleLine[], item: ConsoleLine): number {
    const last = lines[lines.length - 1]
    if (
        last &&
        last.type === item.type &&
        item.type !== 'input-line' &&
        last.type !== 'separator' &&
        !item.userInput &&
        !last.userInput
    ) {
        const added = countLines(item)
        last.text = (last.text ?? "") + (item.text ?? "")
        return added
    }
    lines.push({...item})
    return countLines(item)
}

function dropFromFront(lines: ConsoleLine[], toDrop: number): number {
    let dropped = 0
    while (lines.length > 0 && toDrop > 0) {
        const c = countLines(lines[0])
        if (c <= toDrop) {
            toDrop -= c
            dropped += c
            lines.shift()
        } else {
            const text = (lines[0].text ?? "").split('\n').slice(toDrop).join('\n')
            lines[0] = {...lines[0], text}
            dropped += toDrop
            toDrop = 0
        }
    }
    return dropped
}

function appendToState(prev: ConsoleState, item: ConsoleLine): ConsoleState {
    if (!prev.hasEllipsis) {
        const head = prev.head.map(l => ({...l}))
        const added = mergeInto(head, item)
        const headLines = prev.headLines + added

        if (headLines <= HALF * 2) {
            return {...prev, head, headLines}
        }

        const splitAt = Math.ceil(head.length / 2)
        const newHead = head.slice(0, splitAt)
        const newTail = head.slice(splitAt)

        let nh = 0
        for (const l of newHead) nh += countLines(l)
        let nt = 0
        for (const l of newTail) nt += countLines(l)

        return {head: newHead, tail: newTail, hasEllipsis: true, headLines: nh, tailLines: nt}
    }

    const tail = prev.tail.map(l => ({...l}))
    const added = mergeInto(tail, item)
    let tailLines = prev.tailLines + added

    if (tailLines > HALF) {
        const dropped = dropFromFront(tail, tailLines - HALF)
        tailLines -= dropped
    }

    return {...prev, tail, tailLines, head: prev.head, hasEllipsis: true, headLines: prev.headLines}
}

function stateToLines(s: ConsoleState): ConsoleLine[] {
    if (!s.hasEllipsis) return s.head
    const sep: ConsoleLine = {id: 'ellipsis-sep', type: 'separator', text: '\n...\n'}
    return [...s.head, sep, ...s.tail]
}

const emptyState = (): ConsoleState => ({head: [], tail: [], hasEllipsis: false, headLines: 0, tailLines: 0})

type PasteRange = { start: number; end: number }

function normalizeRanges(ranges: PasteRange[]): PasteRange[] {
    if (ranges.length === 0) return []
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    const res = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
        const last = res[res.length - 1]
        const curr = sorted[i]
        if (curr.start <= last.end) {
            last.end = Math.max(last.end, curr.end)
        } else {
            res.push(curr)
        }
    }
    return res
}

function applyChange(
    ranges: PasteRange[],
    change: { rangeOffset: number; rangeLength: number; text: string }
): PasteRange[] {
    const delStart = change.rangeOffset
    const delEnd = change.rangeOffset + change.rangeLength
    const insLen = change.text.length

    return ranges.flatMap(({start, end}): PasteRange[] => {
        if (start >= delStart && end <= delEnd) return []

        let newStart = start
        let newEnd = end

        if (start > delStart) newStart -= Math.min(start - delStart, change.rangeLength)
        if (end > delStart) newEnd -= Math.min(end - delStart, change.rangeLength)

        if (delStart <= newStart) {
            newStart += insLen
            newEnd += insLen
        } else if (delStart < newEnd) {
            const pieces: PasteRange[] = []
            if (delStart > newStart) pieces.push({start: newStart, end: delStart})
            if (newEnd > delStart) pieces.push({start: delStart + insLen, end: newEnd + insLen})
            return pieces
        }

        if (newEnd > newStart) return [{start: newStart, end: newEnd}]
        return []
    })
}

function getInputModes(totalLen: number, ranges: PasteRange[]) {
    const arr: number[] = []
    let curr = 0

    for (const r of ranges) {
        if (r.start >= curr) {
            if (r.start > curr || arr.length === 0) {
                arr.push(r.start - curr)
            }
            arr.push(r.end - r.start)
            curr = r.end
        }
    }

    if (curr < totalLen) {
        arr.push(totalLen - curr)
    }

    return arr
}

const isSabSupported = typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined'

export default function EditorComponent() {
    const [consoleState, setConsoleState] = useState<ConsoleState>(emptyState)
    const [isRunning, setIsRunning] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isWaiting, setIsWaiting] = useState(false)
    const [promptText, setPromptText] = useState("")

    const isRunningRef = useRef(false)
    const isLoadingRef = useRef(true)
    const workerRef = useRef<Worker | null>(null)
    const sabRef = useRef<SharedArrayBuffer | null>(
        isSabSupported ? new SharedArrayBuffer(10240) : null
    )
    const interruptSabRef = useRef<SharedArrayBuffer | null>(
        isSabSupported ? new SharedArrayBuffer(4) : null
    )
    const editorRef = useRef<MonacoEditor | null>(null)
    const ruffRef = useRef<boolean>(false)
    const triggerLintRef = useRef<() => void>(() => {})
    const codeRef = useRef(defaultCode)
    const decorationsCollRef = useRef<ReturnType<MonacoEditor["createDecorationsCollection"]> | null>(null)
    const pasteRangesRef = useRef<PasteRange[]>([])
    const snapshotsRef = useRef<Map<number, PasteRange[]>>(new Map())

    useEffect(() => {
        init(ruffWasmUrl).then(() => {
            ruffRef.current = true
            triggerLintRef.current()
        }).catch(console.error)
    }, [])

    useEffect(() => {
        const worker = new Worker('/py-worker.js?v=' + Date.now())
        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            const data = e.data
            if (data.type === 'status') {
                if (data.status === 'loading') {
                    setIsLoading(true)
                    isLoadingRef.current = true
                }
                if (data.status === 'ready') {
                    setIsLoading(false)
                    isLoadingRef.current = false
                }
                if (data.status === 'done') {
                    setIsRunning(false)
                    isRunningRef.current = false
                    setIsWaiting(false)
                    setPromptText("")
                }
            }
            if (data.type === 'stdout' || data.type === 'stderr') {
                const item: ConsoleLine = {
                    id: crypto.randomUUID(),
                    type: data.type as ConsoleLine["type"],
                    text: data.text ?? ""
                }
                setConsoleState(prev => appendToState(prev, item))
            }
            if (data.type === 'input_request') {
                setPromptText(data.prompt ?? "")
                setIsWaiting(true)
            }
            if (data.type === 'hints' && data.id) {
                const pending = pendingRequests.get(data.id)
                if (pending) {
                    pending.resolve(data.completions ?? [])
                    pendingRequests.delete(data.id)
                }
            }
        }
        workerRef.current = worker
        return () => worker.terminate()
    }, [])

    const handleEditorMount = (editor: MonacoEditor, monaco: Monaco) => {
        editorRef.current = editor
        const model = editor.getModel() as MonacoModel
        decorationsCollRef.current = editor.createDecorationsCollection([])

        snapshotsRef.current.set(model.getAlternativeVersionId(), [])

        const flushDecorations = () => {
            if (!decorationsCollRef.current) return
            decorationsCollRef.current.set(
                pasteRangesRef.current.map(({start, end}) => ({
                    range: monaco.Range.fromPositions(
                        model.getPositionAt(start),
                        model.getPositionAt(end),
                    ),
                    options: {
                        description: 'paste-marker',
                        className: 'paste-marker-bg',
                        inlineClassName: 'paste-marker-bg',
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    },
                }))
            )
            console.log(getInputModes(model.getValueLength(), pasteRangesRef.current))
        }

        editor.onDidPaste((e: PasteEvent) => {
            const start = model.getOffsetAt(e.range.getStartPosition())
            const end = model.getOffsetAt(e.range.getEndPosition())
            if (end > start) {
                pasteRangesRef.current.push({start, end})
                pasteRangesRef.current = normalizeRanges(pasteRangesRef.current)
                snapshotsRef.current.set(model.getAlternativeVersionId(), [...pasteRangesRef.current])
                flushDecorations()
            }
        })

        let lintTimer: ReturnType<typeof setTimeout> | null = null

        editor.onDidChangeModelContent((e: ContentChangeEvent) => {
            codeRef.current = model.getValue()

            if (e.isUndoing || e.isRedoing) {
                const v = model.getAlternativeVersionId()
                pasteRangesRef.current = [...(snapshotsRef.current.get(v) ?? [])]
            } else {
                for (const change of e.changes) {
                    pasteRangesRef.current = applyChange(pasteRangesRef.current, change)
                }
                pasteRangesRef.current = normalizeRanges(pasteRangesRef.current)

                const v = model.getAlternativeVersionId()
                snapshotsRef.current.set(v, [...pasteRangesRef.current])

                if (snapshotsRef.current.size > 1000) {
                    snapshotsRef.current.delete(Math.min(...snapshotsRef.current.keys()))
                }
            }

            flushDecorations()
            if (lintTimer) clearTimeout(lintTimer)
            lintTimer = setTimeout(runLint, 300)
        })

        const runLint = () => {
            if (!ruffRef.current || !model) return
            try {
                const workspace = new Workspace({
                    "line-length": 88, "indent-width": 4,
                    "lint": {
                        "select": ["E", "F", "W", "PL"],
                        "ignore": ["E501", "W191", "E101", "W291", "W292", "W293", "W391", "E303", "F401", "F403", "F405"],
                    },
                }, PositionEncoding.Utf16)
                monaco.editor.setModelMarkers(model, "ruff", workspace.check(model.getValue()).map((d: RuffDiagnostic) => ({
                    severity: (d.code.startsWith("E") || d.code.startsWith("F"))
                        ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                    message: `${d.code}: ${d.message}`,
                    startLineNumber: d.start_location.row,
                    startColumn: Math.max(1, d.start_location.column),
                    endLineNumber: d.end_location.row,
                    endColumn: Math.max(1, d.end_location.column),
                })))
            } catch { /* ignore */ }
        }
        triggerLintRef.current = runLint
        if (ruffRef.current) runLint()

        monaco.languages.registerCompletionItemProvider("python", {
            triggerCharacters: [".", "(", ","],
            provideCompletionItems: async (
                m: MonacoModel,
                position: import("monaco-editor").Position,
                context: import("monaco-editor").languages.CompletionContext
            ) => {
                if (isRunningRef.current || isLoadingRef.current || !workerRef.current) return {suggestions: []}
                const word = m.getWordUntilPosition(position)
                if (context.triggerKind === 0 && !word.word) return {suggestions: []}
                const range = {
                    startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                    startColumn: word.startColumn, endColumn: word.endColumn,
                }
                const id = crypto.randomUUID()
                const promise = new Promise<JediCompletion[]>((resolve) => {
                    pendingRequests.set(id, {resolve})
                    setTimeout(() => {
                        if (pendingRequests.has(id)) {
                            pendingRequests.get(id)!.resolve([])
                            pendingRequests.delete(id)
                        }
                    }, 5000)
                })
                workerRef.current.postMessage({
                    type: "get_hints",
                    id,
                    code: m.getValue(),
                    line: position.lineNumber,
                    column: position.column - 1
                })
                const completions = await promise
                return {
                    suggestions: completions.map((item: JediCompletion) => {
                        let insertText = item.insertText
                        let insertTextRules: import("monaco-editor").languages.CompletionItemInsertTextRule | undefined
                        if (item.kind === "function" || item.kind === "class") {
                            insertText = `${item.insertText}($1)`
                            insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        }
                        return {
                            label: item.label,
                            kind: mapJediKind(item.kind, monaco),
                            detail: item.detail,
                            documentation: item.documentation ? {value: item.documentation} : undefined,
                            insertText,
                            insertTextRules,
                            range
                        }
                    }),
                }
            },
        })

        monaco.languages.registerDocumentFormattingEditProvider("python", {
            provideDocumentFormattingEdits: (m: MonacoModel) => {
                if (!ruffRef.current) return []
                try {
                    const workspace = new Workspace({"line-length": 88, "indent-width": 4}, PositionEncoding.Utf16)
                    return [{range: m.getFullModelRange(), text: workspace.format(m.getValue())}]
                } catch {
                    return []
                }
            },
        })
    }

    const handleRun = () => {
        if (!isSabSupported || !workerRef.current || isRunningRef.current) return
        const int32 = new Int32Array(sabRef.current!)
        int32[0] = 0
        int32[1] = 0
        new Uint8Array(interruptSabRef.current!)[0] = 0
        setConsoleState(emptyState)
        setIsRunning(true)
        isRunningRef.current = true
        setIsWaiting(false)
        setPromptText("")
        workerRef.current.postMessage({
            type: "run",
            code: codeRef.current,
            sab: sabRef.current,
            interruptSab: interruptSabRef.current
        })
    }

    const handleStop = () => {
        if (!sabRef.current || !interruptSabRef.current) return
        new Uint8Array(interruptSabRef.current)[0] = 2
        const int32 = new Int32Array(sabRef.current)
        Atomics.store(int32, 0, 2)
        Atomics.notify(int32, 0, 1)
        setIsWaiting(false)
        setPromptText("")
    }

    const handleFormat = () => editorRef.current?.getAction('editor.action.formatDocument')?.run()

    const handleInputSubmit = (value: string) => {
        if (!sabRef.current) return
        const capturedPrompt = promptText
        const encoded = new TextEncoder().encode(value)
        const int32 = new Int32Array(sabRef.current)
        const uint8 = new Uint8Array(sabRef.current, 8)
        uint8.set(encoded)
        int32[1] = encoded.length
        Atomics.store(int32, 0, 1)
        Atomics.notify(int32, 0, 1)
        const item: ConsoleLine = {
            id: crypto.randomUUID(),
            type: 'input-line',
            text: capturedPrompt,
            userInput: value + '\n'
        }
        setConsoleState(prev => appendToState(prev, item))
        setIsWaiting(false)
        setPromptText("")
    }

    return (
        <div className="flex flex-col gap-4 w-[450px]">
            <style>{`
                .paste-marker-bg {

                }
            `}</style>
            <Controls isRunning={isRunning} isLoading={isLoading} isSabSupported={isSabSupported} onRun={handleRun}
                      onStop={handleStop} onFormat={handleFormat}/>
            <div className="rounded-xl overflow-hidden border bg-card">
                <Editor
                    height={300}
                    theme={`vs-dark`}
                    defaultLanguage="python"
                    defaultValue={defaultCode}
                    onMount={handleEditorMount}
                    options={{
                        scrollBeyondLastLine: false, scrollbar: {useShadows: false},
                        fontLigatures: true, fontSize: 16, fontWeight: "400",
                        cursorBlinking: "expand", smoothScrolling: true, minimap: {enabled: false},
                        quickSuggestions: {other: true, comments: false, strings: false},
                        suggestOnTriggerCharacters: true, wordBasedSuggestions: "off",
                        fixedOverflowWidgets: true, insertSpaces: true, autoClosingDelete: "always",
                        dragAndDrop: false,
                        dropIntoEditor: {enabled: false},
                        glyphMargin: false, lineNumbersMinChars: 3, lineDecorationsWidth: 3
                    }}
                />
            </div>
            <Terminal output={stateToLines(consoleState)} isRunning={isRunning} isWaiting={isWaiting}
                      promptText={promptText} onInputSubmit={handleInputSubmit}/>
        </div>
    )
}