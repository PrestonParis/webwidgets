'use client';

import { Tracker } from '@/features/recovery/types/recovery';
import { useUrgeForm } from '../hooks/useUrgeForm';
import { useRecoveryActions } from '../hooks/useRecoveryActions';
import { useTrackerCardState } from '../hooks/useTrackerCardState';
import { useReviewModal } from '../hooks/useReviewModal';
import { useTrackerTheme, THEMES } from '../hooks/useTrackerTheme';
import { useAutoReview } from '../hooks/useAutoReview';
import CalendarView from './CalendarView';
import ReviewModal from './ReviewModal';
import {
    ColorPicker,
    StreakSection,
    TrackerBottomSection,
    TrackerHeaderRow,
} from './TrackerCardParts';

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
    const compact = size === 'compact';
    const currentDays = Math.floor(card.secondsClean / 86400);
    const isPersonalBest =
        card.longestDays > 0 && currentDays >= card.longestDays;
    const needsReview = needsTrackerReview(tracker.id);

    useAutoReview(review.open, needsReview);

    return (
        <>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div
                    className={`${compact ? 'p-4 space-y-3' : 'p-6 space-y-4'}`}
                >
                    <TrackerHeaderRow
                        tracker={tracker}
                        t={THEMES[theme]}
                        size={size}
                        compact={compact}
                        showPicker={showPicker}
                        setShowPicker={setShowPicker}
                        setSize={setSize}
                    />
                    {showPicker && (
                        <ColorPicker theme={theme} onPick={setTheme} />
                    )}
                    <StreakSection
                        tracker={tracker}
                        card={card}
                        compact={compact}
                        isPersonalBest={isPersonalBest}
                        onUpdateStart={onUpdateStart}
                    />
                    <TrackerBottomSection
                        compact={compact}
                        needsReview={needsReview}
                        review={review}
                        urgeForm={urgeForm}
                        tracker={tracker}
                        card={card}
                        onReset={onReset}
                        handleTrackerCardReset={handleTrackerCardReset}
                    />
                </div>
                {!compact && card.expanded && (
                    <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
                        <CalendarView
                            createdAt={tracker.created_at}
                            relapses={card.relapses}
                        />
                    </div>
                )}
            </div>
            {review.isOpen && (
                <ReviewModal
                    addiction={tracker.addiction}
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

function needsTrackerReview(trackerId: string): boolean {
    const lastReviewed = localStorage.getItem(
        `recovery_last_reviewed_${trackerId}`,
    );
    return (
        !lastReviewed ||
        new Date(lastReviewed) < new Date(new Date().setHours(0, 0, 0, 0))
    );
}
