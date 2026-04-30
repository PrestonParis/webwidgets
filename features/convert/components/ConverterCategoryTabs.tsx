import { cn } from '@/lib/utils/utils';
import { ConverterCategoryTabsProps } from '@/types/unitconvert';

export function ConverterCategoryTabs({
    categories,
    active,
    onChange,
}: ConverterCategoryTabsProps) {
    return (
        <div className="flex gap-1 overflow-x-auto pb-4 mb-2 no-scrollbar">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onChange(cat)}
                    className={cn(
                        'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        active === cat
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800',
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
