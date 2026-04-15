import {
    useState,
    useRef,
    useEffect,
    useCallback,
    lazy,
    Suspense,
    type ReactNode,
} from 'react'
import {Pencil, MousePointer, Trash2, Eraser, CodeXml, PenTool} from 'lucide-react'
import {useEditorState} from "../../hooks/editorState/useEditorState.ts";
import {DraggablePanel} from "../dock/DraggablePanel.tsx";

const TldrawLayer = lazy(() => import('./tldrawLayer.tsx'))

const COLORS = [
    {value: '#ef4444', tlValue: 'red'},
    {value: '#f97316', tlValue: 'orange'},
    {value: '#eab308', tlValue: 'yellow'},
    {value: '#22c55e', tlValue: 'green'},
    {value: '#3b82f6', tlValue: 'blue'},
    {value: '#a855f7', tlValue: 'violet'},
] as const

const SIZES = [
    {value: 'S', tlValue: 's'},
    {value: 'M', tlValue: 'm'},
    {value: 'L', tlValue: 'l'},
    {value: 'XL', tlValue: 'xl'},
] as const

type Tool = 'draw' | 'eraser'
type SizeItem = (typeof SIZES)[number]
type ColorItem = (typeof COLORS)[number] | { value: string; tlValue: 'white' | 'black' }

export function Overlay({children}: { children: ReactNode }) {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)

    const dynamicLastColor: ColorItem = {value: '#ffffff', tlValue: 'white'}

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)')
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    const [isDrawing, setIsDrawing] = useState(() => {
        const stored = localStorage.getItem('drawing-state-enabled')
        return stored === 'true'
    })
    
    const {open: isIdeOpen, setOpen: setIsIdeOpen} = useEditorState()
    
    useEffect(() => {
        const stored = localStorage.getItem('ide-state-enabled')
        if (stored === 'true') {
            setIsIdeOpen(true)
        } else {
            setIsIdeOpen(false)
        }
    }, [setIsIdeOpen])

    const toggleIde = useCallback(() => {
        setIsIdeOpen((prev: boolean) => {
            const next = !prev
            localStorage.setItem('ide-state-enabled', String(next))
            return next
        })
    }, [setIsIdeOpen])

    const [everDrawing, setEverDrawing] = useState(isDrawing)
    const [activeTool, setActiveTool] = useState<Tool>('draw')
    const [displayTool, setDisplayTool] = useState<Tool>('draw')
    const [activeColor, setActiveColor] = useState<ColorItem>(dynamicLastColor)
    const [activeSize, setActiveSize] = useState<SizeItem>(SIZES[1])
    const [calligraphy, setCalligraphy] = useState<boolean>(false)

    const clearAllRef = useRef<(() => void) | null>(null)

    const toggleDrawing = useCallback(() => {
        setIsDrawing(prev => {
            const next = !prev
            if (next) setEverDrawing(true)
            localStorage.setItem('drawing-state-enabled', String(next))
            return next
        })
    }, [])

    const setTool = useCallback((tool: Tool) => {
        setActiveTool(tool)
        setDisplayTool(tool)
    }, [])

    const handleToolChange = useCallback((tool: Tool) => {
        setDisplayTool(tool)
    }, [])
    const applyColor = useCallback((c: ColorItem) => setActiveColor(c), [])
    const applySize = useCallback((s: SizeItem) => setActiveSize(s), [])
    const clearAll = useCallback(() => {
        clearAllRef.current?.()
    }, [])

    const tb = {
            divider: 'bg-zinc-700',
            colorBorder: 'border-zinc-800',
        }

    const btnActive = 'bg-zinc-700 text-white'
    const btnIdle = 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    const sizeActive = 'bg-zinc-600 text-white'
    const sizeIdle = 'text-zinc-500 hover:text-white hover:bg-zinc-800'
    const clearBtn = 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
    const toggleBtn = isDrawing
        ? btnIdle
        : 'bg-blue-500 text-white hover:bg-blue-600'
    const ideButton = !isIdeOpen
        ? btnIdle
        : 'bg-blue-500 text-white hover:bg-blue-600'

    const palette = [...COLORS, dynamicLastColor]

    return (
        <>
            <div style={{pointerEvents: isDesktop && isDrawing ? 'none' : undefined}} className="w-full h-full flex flex-col">
                {children}
            </div>

            {isDesktop && everDrawing && (
                <div style={{position: 'fixed', inset: 0, zIndex: 15, pointerEvents: isDrawing ? 'auto' : 'none'}}>
                    <Suspense fallback={null}>
                        <TldrawLayer
                            onReady={(h) => {
                                clearAllRef.current = h.clearAll
                            }}
                            onToolChange={handleToolChange}
                            isDark={true}
                            color={activeColor.tlValue}
                            size={activeSize.tlValue}
                            tool={activeTool}
                            calligraphy={calligraphy}
                            isDrawing={isDrawing}
                        />
                    </Suspense>
                </div>
            )}

            {isDesktop && (
                <DraggablePanel id="toolbar" isOpen={true} defaultPosition={{right: 180, top: 80}} className="select-none" useDocking={true} showHandle={true}>
                    <div className="flex items-center gap-1.5 pb-1.5" style={{whiteSpace: 'nowrap'}}>
                        <button
                            onClick={toggleDrawing}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${toggleBtn}`}
                        >
                            {isDrawing ? <MousePointer size={13}/> : <Pencil size={13}/>}
                            {isDrawing ? 'Интерфейс' : 'Рисование'}
                        </button>
                        {!isDrawing && (
                            <button
                                onClick={toggleIde}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${ideButton}`}
                            >
                                <CodeXml size={13}/>
                                Редактор кода
                            </button>
                        )}

                        {isDrawing && (
                            <>
                                <div className={`w-px h-5 shrink-0 ${tb.divider}`}/>
                                <button
                                    onClick={() => setTool('draw')}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${displayTool === 'draw' ? btnActive : btnIdle}`}
                                >
                                    <Pencil size={13}/> Карандаш
                                </button>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${displayTool === 'eraser' ? btnActive : btnIdle}`}
                                >
                                    <Eraser size={13}/> Ластик
                                </button>
                                <div className={`w-px h-5 shrink-0 ${tb.divider}`}/>
                                <button
                                    onClick={clearAll}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer shrink-0 ${clearBtn}`}
                                >
                                    <Trash2 size={13}/> Очистить
                                </button>
                            </>
                        )}
                    </div>

                    {isDrawing && activeTool === 'draw' && (
                        <div
                            className={`flex items-center gap-2 pt-1.5 border-t ${tb.colorBorder} w-full justify-center`}
                            style={{whiteSpace: 'nowrap'}}
                        >
                            <div className="flex items-center gap-1">
                                {palette.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => applyColor(c)}
                                        style={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            background: c.value,
                                            border: activeColor.value === c.value
                                                ? '2px solid #3b82f6'
                                                : `1px solid ${'#3f3f46'}`,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    />
                                ))}
                            </div>
                            <div className={`w-px h-4 shrink-0 ${tb.divider}`}/>
                            <div className="flex items-center gap-1">
                                {SIZES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => applySize(s)}
                                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${activeSize.value === s.value ? sizeActive : sizeIdle}`}
                                    >
                                        {s.value}
                                    </button>
                                ))}
                            </div>
                            <div className={`w-px h-4 shrink-0 ${tb.divider}`}/>
                            <div className="flex items-center">
                                <button
                                    onClick={() => {setCalligraphy(!calligraphy);}}
                                    className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${calligraphy ? sizeActive : sizeIdle}`}
                                >
                                    <PenTool size={13} strokeWidth="2.5"/>
                                </button>
                            </div>
                        </div>
                    )}
                </DraggablePanel>
            )}
        </>
    )
}
