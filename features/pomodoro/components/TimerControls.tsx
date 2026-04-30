import { TimerControlsProps } from '@/types/pomodoro';

export function TimerControls({
    running,
    onToggle,
    onReset,
}: TimerControlsProps) {
    return (
        <div className="flex gap-4">
            <button
                onClick={onToggle}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
                {running ? 'Pause' : 'Start'}
            </button>
            <button
                onClick={onReset}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
                Reset
            </button>
        </div>
    );
}
