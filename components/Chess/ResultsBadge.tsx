// ─── Result badge ─────────────────────────────────────────────────────────────
export function ResultBadge({ result }: { result: string | null }) {
    if (!result)
        return <span className="text-zinc-400 font-mono text-xs">*</span>;
    const colors: Record<string, string> = {
        '1-0': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        '0-1': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        '1/2-1/2':
            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    };
    return (
        <span
            className={`font-mono text-xs px-2 py-0.5 rounded-md ${colors[result] ?? 'text-zinc-400'}`}
        >
            {result}
        </span>
    );
}
