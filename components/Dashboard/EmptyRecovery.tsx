import { MailTrayIcon } from '../Icons/MailTrayIcon';

export default function EmptyRecovery() {
    return (
        <div className="group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-purple-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Header with Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <MailTrayIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
                        Recovery Trackers
                    </h3>
                </div>

                <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    Empty
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <MailTrayIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    No recovery trackers yet.
                </p>
                <button
                    onClick={() => {
                        window.location.href = '/recovery';
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] transition-all shadow-sm hover:shadow-md"
                >
                    Create Your First Tracker
                </button>
            </div>
        </div>
    );
}
