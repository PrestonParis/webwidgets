import { TimerIcon } from '@/icons/TimerIcon';
import { TimerDisplayProps } from '@/features/pomodoro/types/pomodoro';

export function TimerDisplay({
    mins,
    secs,
    mode,
    cycles,
    radius,
    circumference,
    strokeDashoffset,
    compact,
}: TimerDisplayProps) {
    const label =
        mode === 'focus'
            ? `Session ${cycles + 1}`
            : mode === 'long'
              ? 'Long Break'
              : 'Short Break';

    return (
        <div className="relative">
            <TimerIcon
                radius={radius}
                circumference={circumference}
                strokeDashoffset={strokeDashoffset}
                compact={compact ?? false}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                    className={`${compact ? 'text-3xl' : 'text-5xl'} font-mono font-bold tabular-nums`}
                >
                    {mins}:{secs}
                </div>
                <div
                    className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}
