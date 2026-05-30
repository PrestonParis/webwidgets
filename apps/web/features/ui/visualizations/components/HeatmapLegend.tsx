const ITEMS = [
    { color: '#86efac', label: 'Clean' },
    { color: '#fca5a5', label: 'Relapsed' },
    { color: '#e5e7eb', label: 'No data' },
] as const;

export function HeatmapLegend() {
    return (
        <div className="mt-2 flex items-center gap-3">
            {ITEMS.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                    <span
                        style={{ background: color, borderRadius: 2 }}
                        className="inline-block h-2.5 w-2.5"
                    />
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
