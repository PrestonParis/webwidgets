import { TimerIconProps } from '@/features/pomodoro/types/timer';

export function TimerIcon({
    radius,
    circumference,
    strokeDashoffset,
}: TimerIconProps) {
    return (
        <svg className="w-64 h-64 transform -rotate-90">
            <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
            />
            <circle
                cx="128"
                cy="128"
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
