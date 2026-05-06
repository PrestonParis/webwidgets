import { TimerIconProps } from '@/features/pomodoro/types/timer';

export function TimerIcon({
    radius,
    circumference,
    strokeDashoffset,
    compact,
}: TimerIconProps) {
    const size = compact ? 136 : 256;
    const center = size / 2;
    return (
        <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            style={{ width: size, height: size }}
        >
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-1000 ease-linear"
                strokeLinecap="round"
            />
        </svg>
    );
}
