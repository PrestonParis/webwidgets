import Link from 'next/link';

interface EmptyWidgetProps {
    color: string;
    icon: React.ReactNode;
    largeIcon: React.ReactNode;
    title: string;
    badge: string;
    description: string;
    ctaLabel: string;
    ctaHref?: string;
    ctaOnClick?: () => void;
}

export default function EmptyWidget({
    color,
    icon,
    largeIcon,
    title,
    badge,
    description,
    ctaLabel,
    ctaHref,
    ctaOnClick,
}: EmptyWidgetProps) {
    const ctaClass =
        'px-6 py-2.5 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] transition-all shadow-sm hover:shadow-md';

    return (
        <div
            className={`group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-${color}-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}
                    >
                        {icon}
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
                        {title}
                    </h3>
                </div>
                <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    {badge}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
                <div
                    className={`w-16 h-16 rounded-full bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center`}
                >
                    {largeIcon}
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
                    {description}
                </p>
                {ctaHref ? (
                    <Link href={ctaHref} className={ctaClass}>
                        {ctaLabel}
                    </Link>
                ) : (
                    <button onClick={ctaOnClick} className={ctaClass}>
                        {ctaLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
