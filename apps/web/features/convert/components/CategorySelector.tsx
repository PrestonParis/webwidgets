'use client';

import { categories } from '@/features/convert/constants';
import { getCategories } from '@/features/convert/types/unitconvert';
import { CategorySelectorProps } from '@/features/convert/types/unitconvert';

export default function CategorySelector({
    selected,
    onSelect,
}: CategorySelectorProps) {
    // Static-only full page — exclude live (async) categories like Currency
    const staticCategories = getCategories().filter(
        (cat) => !categories[cat]?.live,
    );

    return (
        <label className="mx-auto grid w-full max-w-sm gap-2 text-sm font-semibold text-muted-foreground">
            General Units
            <select
                value={selected}
                onChange={(event) => onSelect(event.target.value)}
                className="h-11 rounded-xl border bg-card px-3 text-base text-card-foreground outline-none transition-colors focus:border-primary"
            >
                {staticCategories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
        </label>
    );
}
