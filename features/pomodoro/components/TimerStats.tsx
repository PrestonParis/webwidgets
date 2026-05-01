import { TimerStatsProps } from '@/features/pomodoro/types/pomodoro';

export function TimerStats({ cycles }: TimerStatsProps) {
    return (
        <div className="text-sm text-muted-foreground">
            Completed focus sessions: {cycles}
        </div>
    );
}
