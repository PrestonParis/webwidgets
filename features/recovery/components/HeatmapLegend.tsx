const LEGEND_ITEMS = [
    { bg: 'bg-green-300', label: 'Clean' },
    { bg: 'bg-red-300', label: 'Relapse' },
    { bg: 'bg-gray-200 dark:bg-zinc-700', label: 'Before start' },
] as const;

export function HeatmapLegend() {
    return (
        <div className="flex items-center gap-3 mt-2">
            {LEGEND_ITEMS.map(({ bg, label }) => (
                <div key={label} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-xs ${bg}`} />
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
