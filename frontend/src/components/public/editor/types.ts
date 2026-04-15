export type ConsoleLine = {
    id: string;
    type: 'stdout' | 'stderr' | 'input-line' | 'separator';
    text: string;
    userInput?: string;
};