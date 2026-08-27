import { Check, Link2, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import type {
    BriefingFeedbackRating,
    BriefingItem,
} from '@/lib/briefings/types';

const feedbackOptions: Array<{
    value: BriefingFeedbackRating;
    label: string;
    icon: typeof Check;
}> = [
    { value: 'useful', label: 'Useful', icon: ThumbsUp },
    { value: 'not_useful', label: 'Not useful', icon: ThumbsDown },
    { value: 'incorrect', label: 'Incorrect', icon: XCircle },
];

export function BriefingItemCard({
    item,
    disabled,
    onFeedback,
}: {
    item: BriefingItem;
    disabled: boolean;
    onFeedback: (rating: BriefingFeedbackRating) => void;
}) {
    return (
        <article className="border-t border-zinc-200 py-4 first:border-t-0 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {item.section}
            </p>
            <h4 className="mt-1 font-semibold text-zinc-950 dark:text-zinc-50">
                {item.title}
            </h4>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {item.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                {item.evidence.map((evidence) => (
                    <a
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs hover:underline dark:bg-zinc-800"
                        href={`#timeline-${evidence.eventId}`}
                        key={evidence.eventId}
                    >
                        <Link2 aria-hidden size={11} /> {evidence.title}
                    </a>
                ))}
            </div>
            <div
                className="mt-3 flex flex-wrap gap-1"
                aria-label="Briefing item feedback"
            >
                {feedbackOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = item.feedback === option.value;
                    return (
                        <button
                            aria-pressed={selected}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-60 dark:hover:bg-zinc-800"
                            disabled={disabled}
                            key={option.value}
                            onClick={() => onFeedback(option.value)}
                            type="button"
                        >
                            {selected ? (
                                <Check aria-hidden size={11} />
                            ) : (
                                <Icon aria-hidden size={11} />
                            )}
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </article>
    );
}
