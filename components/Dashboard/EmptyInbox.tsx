import Link from 'next/link';
import MailIcon from '../Icons/MailIcon';

export default function EmptyInbox() {
    return (
        <div className="group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-blue-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Header with Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <MailIcon size="sm" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
                        Gmail
                    </h3>
                </div>

                <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    Not Connected
                </div>
            </div>

            {/* Content Area - Centered Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <MailIcon
                        size="lg"
                        className="text-blue-600 dark:text-blue-400"
                    />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-base">
                        Connect Gmail
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Sync your notifications to see them here.
                    </p>
                </div>
                <Link
                    href="/settings"
                    className="px-6 py-2.5 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] transition-all shadow-sm hover:shadow-md"
                >
                    Go to Settings
                </Link>
            </div>
        </div>
    );
}
