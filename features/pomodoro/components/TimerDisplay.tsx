import { TimerIcon } from '@/icons/TimerIcon';
import { TimerDisplayProps } from '@/types/pomodoro';

export function TimerDisplay({
    mins,
    secs,
    mode,
    cycles,
    radius,
    circumference,
    strokeDashoffset,
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
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono font-bold tabular-nums">
                    {mins}:{secs}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                    {label}
                </div>
            </div>
        </div>
    );
}
