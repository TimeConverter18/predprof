import { Button } from "@/components/ui/button";

interface ControlsProps {
    isRunning: boolean;
    isLoading: boolean;
    isSabSupported: boolean;
    onRun: () => void;
    onStop: () => void;
    onFormat: () => void;
}

export function Controls({ isRunning, isLoading, isSabSupported, onRun, onStop, onFormat }: ControlsProps) {
    return (
        <div className="flex flex-row gap-2">
            {isRunning ? (
                <Button variant="destructive" onClick={onStop} className="min-w-[140px]">
                    Остановить
                </Button>
            ) : (
                <Button disabled={isLoading || ! isSabSupported} onClick={onRun} className="min-w-[140px]">
                    {isLoading ? "Загрузка Python..." : "Запустить код"}
                </Button>
            )}

            <Button variant="secondary" onClick={onFormat} disabled={isRunning || isLoading}>
                Отформатировать
            </Button>
        </div>
    );
}