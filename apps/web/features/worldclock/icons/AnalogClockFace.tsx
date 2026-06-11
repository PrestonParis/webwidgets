interface AnalogClockFaceProps {
    size: number;
    hour: number;
    minute: number;
    second: number;
}

function handEnd(cx: number, cy: number, angleDeg: number, length: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

export function AnalogClockFace({
    size,
    hour,
    minute,
    second,
}: AnalogClockFaceProps) {
    const cx = size / 2;
    const radius = size / 2 - 2;

    const secondDegrees = (second / 60) * 360;
    const minuteDegrees = ((minute + second / 60) / 60) * 360;
    const hourDegrees = ((hour + minute / 60) / 12) * 360;

    const secondEnd = handEnd(cx, cx, secondDegrees, radius * 0.82);
    const minuteEnd = handEnd(cx, cx, minuteDegrees, radius * 0.72);
    const hourEnd = handEnd(cx, cx, hourDegrees, radius * 0.52);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
        >
            <circle
                cx={cx}
                cy={cx}
                r={radius}
                className="stroke-stone-200 dark:stroke-zinc-700"
                strokeWidth="1.5"
                fill="none"
            />
            {Array.from({ length: 12 }, (_, index) => {
                const rad = (index * 30 - 90) * (Math.PI / 180);
                const inner = index % 3 === 0 ? radius * 0.8 : radius * 0.88;
                return (
                    <line
                        key={index}
                        x1={cx + inner * Math.cos(rad)}
                        y1={cx + inner * Math.sin(rad)}
                        x2={cx + radius * 0.96 * Math.cos(rad)}
                        y2={cx + radius * 0.96 * Math.sin(rad)}
                        className="stroke-stone-300 dark:stroke-zinc-600"
                        strokeWidth={index % 3 === 0 ? 2 : 1}
                        strokeLinecap="round"
                    />
                );
            })}
            <line
                x1={cx}
                y1={cx}
                x2={hourEnd.x}
                y2={hourEnd.y}
                className="stroke-stone-800 dark:stroke-zinc-200"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <line
                x1={cx}
                y1={cx}
                x2={minuteEnd.x}
                y2={minuteEnd.y}
                className="stroke-stone-700 dark:stroke-zinc-300"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1={cx}
                y1={cx}
                x2={secondEnd.x}
                y2={secondEnd.y}
                className="stroke-red-500 dark:stroke-red-400"
                strokeWidth="1"
                strokeLinecap="round"
            />
            <circle
                cx={cx}
                cy={cx}
                r="2.5"
                className="fill-stone-800 dark:fill-zinc-200"
            />
        </svg>
    );
}
