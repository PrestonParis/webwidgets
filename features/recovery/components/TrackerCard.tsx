import { useEffect, useState } from 'react';
import { Tracker } from '@/types/recovery';
import { fetchRelapses } from '../lib/relapses';
import { useUrgeForm } from '../hooks/useUrgeForm';
import { useSecondsClean } from '../hooks/useSecondsClean';
import { useRecoveryActions } from '../hooks/useRecoveryActions';
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
    const [startTime, setStartTime] = useState(tracker.start_time);
    const [editingStart, setEditingStart] = useState(false);
    const [relapses, setRelapses] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchRelapses(tracker.id).then(setRelapses);
    }, [tracker.id]);

    const secondsClean = useSecondsClean(startTime);
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
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        {expanded ? 'collapse ↑' : 'expand ↓'}
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                        CURRENT STREAK
                    </p>

                    {editingStart ? (
                        <StartTimeEditor
                            trackerId={tracker.id}
                            startTime={startTime}
                            onUpdate={(iso) => {
                                setStartTime(iso);
                                onUpdateStart(tracker.id, iso);
                                setEditingStart(false);
                            }}
                            onCancel={() => setEditingStart(false)}
                        />
                    ) : (
                        <p
                            onClick={() => setEditingStart(true)}
                            className="text-sm text-gray-500 dark:text-zinc-400 italic cursor-pointer hover:text-purple-500 transition-colors"
                        >
                            Since {new Date(startTime).toLocaleDateString()} ·{' '}
                            {new Date(startTime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                            })}{' '}
                            · edit
                        </p>
                    )}

                    <MilestoneBadges secondsClean={secondsClean} />
                </div>

                <SoberWidgetFooter
                    showUrgeForm={urgeForm.showUrgeForm}
                    trigger={urgeForm.trigger}
                    isSaving={urgeForm.isSaving}
                    onTriggerChange={urgeForm.setTrigger}
                    onLogUrge={urgeForm.handleLogUrge}
                    onCancelUrge={urgeForm.handleCancel}
                    onShowUrgeForm={() => urgeForm.setShowUrgeForm(true)}
                    onReset={() =>
                        handleTrackerCardReset(
                            tracker.id,
                            setStartTime,
                            onReset,
                        )
                    }
                />
            </div>

            {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
                    <CalendarView startTime={startTime} relapses={relapses} />
                </div>
            )}
        </div>
    );
}
