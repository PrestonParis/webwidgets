import { Mode, ModeSelectorProps } from '@/features/pomodoro/types/pomodoro';
import { LABELS } from '@/features/pomodoro/constants';

export function ModeSelector({ mode, onSwitch }: ModeSelectorProps) {
    return (
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['focus', 'short', 'long'] as Mode[]).map((m) => (
                <button
                    key={m}
                    onClick={() => onSwitch(m)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mode === m
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {LABELS[m]}
                </button>
            ))}
        </div>
    );
}
