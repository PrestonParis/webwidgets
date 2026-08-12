'use client';

import {
    BUILT_IN_CATEGORIES,
    getCategoryLabel,
} from '@/features/tracking/constants';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import { TrackingIcon } from './TrackingIcon';
import { getTrackingCategoryConfig } from '@/features/tracking/lib/categoryConfig';

interface CategoryFilterProps {
    active: string;
    onChange: (c: string) => void;
    customCategories?: CustomCategoryDef[];
    onManageCustom?: () => void;
}

export function CategoryFilter({
    active,
    onChange,
    customCategories = [],
    onManageCustom,
}: CategoryFilterProps) {
    const allCategories = [
        ...BUILT_IN_CATEGORIES.map((id) => ({
            id,
            label: getCategoryLabel(id),
            icon: getTrackingCategoryConfig(id).icon,
        })),
        ...customCategories.map((d) => ({
            id: d.id,
            label: d.label,
            icon: 'Shapes',
        })),
    ];

    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            {allCategories.map((c) => (
                <button
                    key={c.id}
                    onClick={() => onChange(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active === c.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                >
                    <TrackingIcon name={c.icon} className="h-3.5 w-3.5" />
                    <span>{c.label}</span>
                </button>
            ))}
            {onManageCustom && (
                <button
                    onClick={onManageCustom}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                    <span>+</span>
                    <span>Custom</span>
                </button>
            )}
        </div>
    );
}
