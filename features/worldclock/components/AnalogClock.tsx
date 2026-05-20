'use client';

interface Props {
    tz: string;
    now: Date;
    size?: number;
}

function getTimeParts(
    tz: string,
    now: Date,
): { h: number; m: number; s: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(now);
    const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
    return { h: get('hour') % 12, m: get('minute'), s: get('second') };
}

function handEnd(cx: number, cy: number, angleDeg: number, length: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

export function AnalogClock({ tz, now, size = 80 }: Props) {
    const { h, m, s } = getTimeParts(tz, now);
    const cx = size / 2;
    const r = size / 2 - 2;

    const sDeg = (s / 60) * 360;
    const mDeg = ((m + s / 60) / 60) * 360;
    const hDeg = ((h + m / 60) / 12) * 360;

    const secEnd = handEnd(cx, cx, sDeg, r * 0.82);
    const minEnd = handEnd(cx, cx, mDeg, r * 0.72);
    const hourEnd = handEnd(cx, cx, hDeg, r * 0.52);

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
                r={r}
                className="stroke-stone-200 dark:stroke-zinc-700"
                strokeWidth="1.5"
                fill="none"
            />
            {Array.from({ length: 12 }, (_, i) => {
                const rad = (i * 30 - 90) * (Math.PI / 180);
                const inner = i % 3 === 0 ? r * 0.8 : r * 0.88;
                return (
                    <line
                        key={i}
                        x1={cx + inner * Math.cos(rad)}
                        y1={cx + inner * Math.sin(rad)}
                        x2={cx + r * 0.96 * Math.cos(rad)}
                        y2={cx + r * 0.96 * Math.sin(rad)}
                        className="stroke-stone-300 dark:stroke-zinc-600"
                        strokeWidth={i % 3 === 0 ? 2 : 1}
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
                x2={minEnd.x}
                y2={minEnd.y}
                className="stroke-stone-700 dark:stroke-zinc-300"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1={cx}
                y1={cx}
                x2={secEnd.x}
                y2={secEnd.y}
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
