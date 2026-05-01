import { EMOJI_OPTIONS } from '../constants';
import { EmojiPickerProps } from '@/features/countdown/types/countdown';

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
    return (
        <div className="flex flex-wrap gap-1">
            {EMOJI_OPTIONS.map((e) => (
                <button
                    key={e}
                    type="button"
                    onClick={() => onChange(e)}
                    className={`text-base w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        value === e
                            ? 'bg-sky-100 dark:bg-sky-900/30'
                            : 'hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                >
                    {e}
                </button>
            ))}
        </div>
    );
}
