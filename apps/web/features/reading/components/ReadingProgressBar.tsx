'use client';

interface ReadingProgressBarProps {
    percent: number; // 0–100
    label?: string;
}

export function ReadingProgressBar({
    percent,
    label,
}: ReadingProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, percent));
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#4f6ef7] rounded-full transition-all duration-300"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            {label !== undefined && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                    {label}
                </span>
            )}
        </div>
    );
}
