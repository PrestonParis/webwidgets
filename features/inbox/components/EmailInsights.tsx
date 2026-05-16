import { Email } from '@/features/inbox/types/inbox';

export function EmailInsights({
    emails,
    extractingAll,
    onExtractAll,
}: {
    emails: Email[];
    extractingAll: boolean;
    onExtractAll: () => void;
}) {
    const senderCounts = emails.reduce((acc: Record<string, number>, mail) => {
        const sender = mail.sender
            ? (mail.sender.split('<')[0] ?? mail.sender).trim()
            : 'Unknown Sender';

        acc[sender] = (acc[sender] || 0) + 1;
        return acc;
    }, {});

    const topSenders = Object.entries(senderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (!topSenders.length) return null;

    return (
        <div className="p-5 bg-linear-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-zinc-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                    Top Senders
                </h3>
                <button
                    onClick={onExtractAll}
                    disabled={extractingAll}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                    {extractingAll ? 'Extracting…' : 'Extract all actions'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {topSenders.map(([sender, count]) => (
                    <div
                        key={sender}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full"
                    >
                        <span className="text-xs font-semibold">{sender}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
