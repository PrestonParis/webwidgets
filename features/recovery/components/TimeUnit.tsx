export default function TimeUnit({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <div className="flex flex-col items-baseline">
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black tracking-tighter text-gray-900 dark:text-zinc-100 tabular-nums min-w-[2ch] text-right">
                    {value}
                </span>
                <span className="text-sm font-bold text-gray-400 lowercase">
                    {label}
                </span>
            </div>
        </div>
    );
}
