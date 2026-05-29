interface AdminStatusBadgeProps {
    status: string;
}

const PRESETS: Record<string, string> = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    enabled:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    success:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    running: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    pending:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    waiting:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    disabled: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400',
    inactive: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    banned: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    admin: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    owner: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    moderator:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    support: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    viewer: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400',
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
    const cls =
        PRESETS[status.toLowerCase()] ??
        'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400';
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}
        >
            {status}
        </span>
    );
}
