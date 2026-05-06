'use client';

import { getExactTimeParts } from '@/lib/utils/time';
import { Tracker } from '@/features/recovery/types/recovery';
import { useUrgeForm } from '../hooks/useUrgeForm';
import { useRecoveryActions } from '../hooks/useRecoveryActions';
import { useTrackerCardState } from '../hooks/useTrackerCardState';
import { useReviewModal } from '../hooks/useReviewModal';
import {
    useTrackerTheme,
    THEMES,
    ThemeKey,
    TrackerSize,
} from '../hooks/useTrackerTheme';
import { useAutoReview } from '../hooks/useAutoReview';
import { Pencil, Minimize2, Maximize2 } from 'lucide-react';
import CalendarView from './CalendarView';
import MilestoneBadges from './MilestoneBadges';
import StartTimeEditor from './StartTimeEditor';
import SoberWidgetFooter from './SoberWidgetFooter';
import TimeUnit from './TimeUnit';
import ReviewModal from './ReviewModal';

function ColorPicker({
    theme,
    onPick,
}: {
    theme: ThemeKey;
    onPick: (k: ThemeKey) => void;
}) {
    return (
        <div className="flex gap-1.5 justify-center">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                    key={k}
                    onClick={() => onPick(k)}
                    title={k}
                    style={{ background: THEMES[k].fill }}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${theme === k ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-zinc-500' : ''}`}
                />
            ))}
        </div>
    );
}

function StreakTimer({
    secondsClean,
    startTime,
    compact,
}: {
    secondsClean: number;
    startTime: string | null;
    compact: boolean;
}) {
    const time = startTime ? getExactTimeParts(startTime) : null;
    if (!time) return null;
    return (
        <div
            className={`flex flex-wrap items-end justify-center ${compact ? 'gap-2' : 'gap-3'}`}
        >
            {time.years > 0 && <TimeUnit value={time.years} label="y" />}
            {time.months > 0 && <TimeUnit value={time.months} label="mo" />}
            <TimeUnit value={time.days} label="d" />
            <TimeUnit value={time.hours} label="h" />
            <TimeUnit value={time.minutes} label="m" />
            {!compact && <TimeUnit value={secondsClean % 60} label="s" />}
        </div>
    );
}

function SizeToggle({
    size,
    onToggle,
}: {
    size: TrackerSize;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title={size === 'compact' ? 'Expand' : 'Compact'}
        >
            {size === 'compact' ? (
                <Maximize2 className="w-3.5 h-3.5" />
            ) : (
                <Minimize2 className="w-3.5 h-3.5" />
            )}
        </button>
    );
}

export default function TrackerCard({
    tracker,
    onReset,
    onUpdateStart,
}: {
    tracker: Tracker;
    onReset: (id: string) => void;
    onUpdateStart: (id: string, newStart: string) => void;
}) {
    const card = useTrackerCardState(tracker);
    const urgeForm = useUrgeForm(tracker.id);
    const { handleTrackerCardReset } = useRecoveryActions(() => {});
    const review = useReviewModal(tracker.id, tracker.start_time);
    const { theme, setTheme, size, setSize, showPicker, setShowPicker } =
        useTrackerTheme(tracker.id);
    const t = THEMES[theme];
    const compact = size === 'compact';

    const lastReviewed = localStorage.getItem(
        `recovery_last_reviewed_${tracker.id}`,
    );
    const needsReview =
        !lastReviewed ||
        new Date(lastReviewed) < new Date(new Date().setHours(0, 0, 0, 0));
    const currentDays = Math.floor(card.secondsClean / 86400);
    const isPersonalBest =
        card.longestDays > 0 && currentDays >= card.longestDays;

    useAutoReview(review.open, needsReview);

    return (
        <>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div
                    className={`${compact ? 'p-4 space-y-3' : 'p-6 space-y-4'}`}
                >
                    <div className="flex justify-between items-start">
                        <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${t.pill}`}
                        >
                            {tracker.addiction}
                        </span>
                        <div className="flex items-center gap-2">
                            <SizeToggle
                                size={size}
                                onToggle={() =>
                                    setSize(compact ? 'default' : 'compact')
                                }
                            />
                            <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                title="Color"
                            >
                                🎨
                            </button>
                        </div>
                    </div>

                    {showPicker && (
                        <ColorPicker theme={theme} onPick={setTheme} />
                    )}

                    <div
                        className={`text-center ${compact ? 'space-y-2' : 'space-y-3'}`}
                    >
                        {!compact && (
                            <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                                CURRENT STREAK
                            </p>
                        )}
                        {card.editingStart ? (
                            <StartTimeEditor
                                trackerId={tracker.id}
                                startTime={card.startTime}
                                onUpdate={(iso) => {
                                    onUpdateStart(tracker.id, iso);
                                    card.setEditingStart(false);
                                }}
                                onCancel={() => card.setEditingStart(false)}
                            />
                        ) : (
                            <button
                                onClick={() => card.setEditingStart(true)}
                                className="flex items-center gap-1 mx-auto text-xs text-gray-400 dark:text-zinc-500 italic cursor-pointer hover:text-purple-500 transition-colors"
                            >
                                Since {card.startDateLabel.date} ·{' '}
                                {card.startDateLabel.time}
                                <Pencil className="w-3 h-3 shrink-0" />
                            </button>
                        )}
                        <StreakTimer
                            secondsClean={card.secondsClean}
                            startTime={card.startTime}
                            compact={compact}
                        />
                        {card.longestDays > 0 && (
                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                                Best:{' '}
                                <span
                                    className={`font-semibold ${isPersonalBest ? 'text-purple-500 dark:text-purple-400' : 'text-gray-600 dark:text-zinc-300'}`}
                                >
                                    {card.longestDays}d
                                    {isPersonalBest ? ' 🏆' : ''}
                                </span>
                            </p>
                        )}
                        {!compact && (
                            <MilestoneBadges secondsClean={card.secondsClean} />
                        )}
                    </div>

                    {!compact && (
                        <button
                            onClick={() => {
                                void review.open();
                            }}
                            className={`relative w-full py-1.5 text-xs rounded-xl border transition-colors font-medium ${needsReview ? 'border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                        >
                            Review days
                            {needsReview && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            )}
                        </button>
                    )}

                    <SoberWidgetFooter
                        showUrgeForm={urgeForm.showUrgeForm}
                        trigger={urgeForm.trigger}
                        replacement={urgeForm.replacement}
                        selectedTags={urgeForm.selectedTags}
                        intensity={urgeForm.intensity}
                        isSaving={urgeForm.isSaving}
                        canSave={urgeForm.canSave}
                        showLink={false}
                        onTriggerChange={urgeForm.setTrigger}
                        onReplacementChange={urgeForm.setReplacement}
                        onToggleTag={urgeForm.toggleTag}
                        onIntensityChange={urgeForm.setIntensity}
                        onLogUrge={() => {
                            void urgeForm.handleLogUrge();
                        }}
                        onCancelUrge={urgeForm.handleCancel}
                        onShowUrgeForm={() => urgeForm.setShowUrgeForm(true)}
                        onReset={() =>
                            handleTrackerCardReset(tracker.id, onReset)
                        }
                    />

                    {!compact && (
                        <button
                            onClick={() => card.setExpanded(!card.expanded)}
                            className="w-full py-1 text-xs text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors"
                        >
                            {card.expanded
                                ? '↑ Hide calendar'
                                : '↓ Show calendar'}
                        </button>
                    )}
                </div>

                {!compact && card.expanded && (
                    <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
                        <CalendarView
                            startTime={card.startTime}
                            relapses={card.relapses}
                        />
                    </div>
                )}
            </div>

            {review.isOpen && (
                <ReviewModal
                    days={review.days}
                    saving={review.saving}
                    onToggle={review.toggle}
                    onSetTime={review.setTime}
                    onSave={review.save}
                    onClose={review.close}
                />
            )}
        </>
    );
}
