import { cn } from '@/lib/utils/utils';
import type { TextEditorMode } from '@/features/texteditor/types/texteditor';
import { MODE_LABELS } from '@/features/texteditor/types/texteditor';

const MODES: TextEditorMode[] = ['document', 'journal', 'note'];

export function ModeSelector({
    mode,
    onChange,
    compact = false,
}: {
    mode: TextEditorMode;
    onChange: (m: TextEditorMode) => void;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'inline-flex rounded-xl bg-stone-100 dark:bg-zinc-800/60 p-0.5',
                compact ? 'gap-0' : 'gap-0',
            )}
        >
            {MODES.map((m) => (
                <button
                    key={m}
                    onClick={() => onChange(m)}
                    className={cn(
                        'rounded-[10px] font-medium transition-all',
                        compact
                            ? 'px-2.5 py-1 text-[11px]'
                            : 'px-3.5 py-1.5 text-xs',
                        m === mode
                            ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-sm'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                    )}
                >
                    {MODE_LABELS[m]}
                </button>
            ))}
        </div>
    );
}
