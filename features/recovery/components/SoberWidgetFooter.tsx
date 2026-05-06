import Link from 'next/link';
import { TRIGGER_TAGS, type TriggerTag } from '../hooks/useUrgeForm';

interface UrgeFormProps {
    trigger: string;
    replacement: string;
    selectedTags: TriggerTag[];
    intensity: number;
    isSaving: boolean;
    canSave: boolean;
    onTriggerChange: (value: string) => void;
    onReplacementChange: (value: string) => void;
    onToggleTag: (tag: TriggerTag) => void;
    onIntensityChange: (value: number) => void;
    onLogUrge: () => void;
    onCancelUrge: () => void;
}

function UrgeForm({
    trigger,
    replacement,
    selectedTags,
    intensity,
    isSaving,
    canSave,
    onTriggerChange,
    onReplacementChange,
    onToggleTag,
    onIntensityChange,
    onLogUrge,
    onCancelUrge,
}: UrgeFormProps) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {TRIGGER_TAGS.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => onToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">
                    Intensity
                </span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            onClick={() => onIntensityChange(n)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${intensity === n ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
            <textarea
                placeholder="What triggered it? (optional)"
                value={trigger}
                onChange={(e) => onTriggerChange(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-12"
            />
            <textarea
                placeholder="What did you do instead? (optional)"
                value={replacement}
                onChange={(e) => onReplacementChange(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-12"
            />
            <div className="flex gap-2">
                <button
                    onClick={onLogUrge}
                    disabled={isSaving || !canSave}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onCancelUrge}
                    className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

interface WidgetFooterProps extends UrgeFormProps {
    showUrgeForm: boolean;
    showLink?: boolean;
    linkHref?: string;
    onShowUrgeForm: () => void;
    onReset: () => void;
}

export default function SoberWidgetFooter({
    showUrgeForm,
    showLink = true,
    linkHref = '/recovery',
    onShowUrgeForm,
    onReset,
    ...urgeProps
}: WidgetFooterProps) {
    if (showUrgeForm) return <UrgeForm {...urgeProps} />;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <button
                    onClick={onShowUrgeForm}
                    className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                    Log urge
                </button>
                <button
                    onClick={onReset}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    Reset Streak
                </button>
            </div>
            {showLink && (
                <Link
                    href={linkHref}
                    className="block text-center text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors pt-1"
                >
                    View full page →
                </Link>
            )}
        </div>
    );
}
