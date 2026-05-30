import { HistoryItem } from '@/features/mood/types/mood';

export function MoodHistoryBar({ history }: { history: HistoryItem[] }) {
    return (
        <div className="flex gap-2 justify-between items-end h-12">
            {history.map(({ date, entry }) => (
                <div key={date} className="flex flex-col items-center gap-1">
                    <div
                        className={`w-6 rounded-sm ${entry ? 'bg-amber-500' : 'bg-zinc-800'}`}
                        style={{
                            height: entry
                                ? `${(entry.score / 5) * 100}%`
                                : '20%',
                        }}
                    />
                    <span className="text-[10px] text-zinc-500">
                        {date.split('-')[2]}
                    </span>
                </div>
            ))}
        </div>
    );
}
