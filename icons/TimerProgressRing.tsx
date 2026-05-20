interface TimerProgressRingProps {
    dim: number;
    center: number;
    r: number;
    circumference: number;
    dashOffset: number;
}

export function TimerProgressRing({
    dim,
    center,
    r,
    circumference,
    dashOffset,
}: TimerProgressRingProps) {
    return (
        <svg width={dim} height={dim} className="-rotate-90">
            <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                strokeWidth="2"
                className="stroke-stone-100 dark:stroke-zinc-800"
            />
            <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="stroke-stone-800 dark:stroke-zinc-200 transition-all duration-1000"
            />
        </svg>
    );
}
