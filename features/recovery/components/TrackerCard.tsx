import { Tracker } from '@/features/recovery/types/recovery';
import { useUrgeForm } from '../hooks/useUrgeForm';
import { useRecoveryActions } from '../hooks/useRecoveryActions';
import { useTrackerCardState } from '../hooks/useTrackerCardState';
import CalendarView from './CalendarView';
import MilestoneBadges from './MilestoneBadges';
import StartTimeEditor from './StartTimeEditor';
import SoberWidgetFooter from './SoberWidgetFooter';

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
    const { handleTrackerCardReset } = useRecoveryActions(
        async () => {},
        () => {},
    );

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold px-3 py-1 rounded-full">
                        {tracker.addiction}
                    </span>
                    <button
                        onClick={() => card.setExpanded(!card.expanded)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        {card.expanded ? 'collapse ↑' : 'expand ↓'}
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                        CURRENT STREAK
                    </p>

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
                        <p
                            onClick={() => card.setEditingStart(true)}
                            className="text-sm text-gray-500 dark:text-zinc-400 italic cursor-pointer hover:text-purple-500 transition-colors"
                        >
                            Since {card.startDateLabel.date} ·{' '}
                            {card.startDateLabel.time} · edit
                        </p>
                    )}

                    <MilestoneBadges secondsClean={card.secondsClean} />
                </div>

                <SoberWidgetFooter
                    showUrgeForm={urgeForm.showUrgeForm}
                    trigger={urgeForm.trigger}
                    isSaving={urgeForm.isSaving}
                    onTriggerChange={urgeForm.setTrigger}
                    onLogUrge={urgeForm.handleLogUrge}
                    onCancelUrge={urgeForm.handleCancel}
                    onShowUrgeForm={() => urgeForm.setShowUrgeForm(true)}
                    onReset={() => handleTrackerCardReset(tracker.id, onReset)}
                />
            </div>

            {card.expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
                    <CalendarView
                        startTime={card.startTime}
                        relapses={card.relapses}
                    />
                </div>
            )}
        </div>
    );
}
