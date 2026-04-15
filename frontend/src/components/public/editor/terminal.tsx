import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsoleLine } from "./types";

interface TerminalProps {
    output: ConsoleLine[];
    isRunning: boolean;
    isWaiting: boolean;
    promptText: string;
    onInputSubmit: (value: string) => void;
}

function mergeLines(output: ConsoleLine[]) {
    const merged: { id: string; type: ConsoleLine["type"]; text: string; userInput?: string }[] = [];
    for (const line of output) {
        const prev = merged[merged.length - 1];
        if (prev && prev.type === line.type && line.type !== "input-line") {
            prev.text += line.text;
        } else {
            merged.push({ ...line });
        }
    }
    return merged;
}

export function Terminal({ output, isRunning, isWaiting, promptText, onInputSubmit }: TerminalProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [output, isWaiting]);

    useEffect(() => {
        if (isWaiting) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isWaiting]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onInputSubmit(inputValue);
            setInputValue("");
        }
    };

    const handleCopy = async () => {
        if (output.length === 0) return;
        const fullText = output.map(line => line.text + (line.userInput || "")).join("");
        try {
            await navigator.clipboard.writeText(fullText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Не удалось скопировать текст:", err);
        }
    };

    const merged = mergeLines(output);

    return (
        <div
            className={`bg-card dark:bg-[#1e1e1e] text-card-foreground rounded-xl border flex flex-col p-3 h-[250px] w-full transition-colors ${isWaiting ? "cursor-text" : ""}`}
            onClick={() => isWaiting && inputRef.current?.focus()}
        >
            <div className="flex items-center gap-1.5 pb-2 border-b shrink-0 mb-2 cursor-default">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Terminal
                </span>
                {isRunning && <span className="w-2 h-2 rounded-full bg-[#28c840] animate-pulse" />}
                <div className="ml-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        disabled={output.length === 0}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Скопировать"
                    >
                        {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="text-start flex-1 overflow-auto font-mono text-[13px] flex flex-col pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
            >
                <div className="whitespace-pre-wrap flex-1">
                    {merged.map((line) => (
                        <span
                            key={line.id}
                            className={line.type === "stderr" ? "text-destructive" : "text-foreground"}
                        >
                            {line.text}
                            {line.type === "input-line" && (
                                <span className="text-green-600 dark:text-green-400">
                                    {line.userInput}
                                </span>
                            )}
                        </span>
                    ))}

                    {isWaiting && (
                        <div className="flex items-center mt-1">
                            <span className="text-foreground shrink-0 whitespace-pre-wrap">
                                {promptText}
                            </span>
                            <input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent outline-none ml-1 font-mono text-[13px] text-green-600 caret-green-600 dark:text-green-400 dark:caret-green-400"
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}