'use client';

interface DurationFieldsProps {
    seconds: number;
    disabled?: boolean;
    compact?: boolean;
    onChange: (seconds: number) => void;
}

function partsFromSeconds(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
}

function toNumber(value: string): number {
    return Number(value || 0);
}

export function DurationFields({
    seconds,
    disabled = false,
    compact = false,
    onChange,
}: DurationFieldsProps) {
    const parts = partsFromSeconds(seconds);
    const inputClass = compact
        ? 'h-7 w-8 rounded-md border border-transparent bg-transparent text-center font-mono text-xs text-stone-800 outline-none focus:border-sky-300 disabled:opacity-60 dark:text-zinc-100'
        : 'h-7 w-10 rounded-md border border-stone-200 bg-white text-center font-mono text-xs text-stone-800 outline-none focus:border-sky-300 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
    const labelClass =
        'flex items-center gap-0.5 text-[10px] text-stone-400 dark:text-zinc-500';

    return (
        <div className="flex items-center justify-center gap-1">
            <label className={labelClass}>
                <input
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    value={parts.hours}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(
                            toNumber(event.target.value) * 3600 +
                                parts.minutes * 60 +
                                parts.seconds,
                        )
                    }
                    className={inputClass}
                />
                h
            </label>
            <label className={labelClass}>
                <input
                    type="number"
                    min={0}
                    max={59}
                    step={1}
                    value={parts.minutes}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(
                            parts.hours * 3600 +
                                toNumber(event.target.value) * 60 +
                                parts.seconds,
                        )
                    }
                    className={inputClass}
                />
                m
            </label>
            <label className={labelClass}>
                <input
                    type="number"
                    min={0}
                    max={59}
                    step={1}
                    value={parts.seconds}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(
                            parts.hours * 3600 +
                                parts.minutes * 60 +
                                toNumber(event.target.value),
                        )
                    }
                    className={inputClass}
                />
                s
            </label>
        </div>
    );
}
