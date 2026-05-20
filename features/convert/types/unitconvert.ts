import { categories } from '@/features/convert/constants';
export type { Category } from '@/features/convert/constants';

export interface UnitConverterProps {
    category: string;
}

export function getCategories() {
    return Object.keys(categories);
}

export function getUnits(category: string) {
    return categories[category]?.units ?? [];
}

export interface ConverterCategoryTabsProps {
    categories: string[];
    active: string;
    onChange: (cat: string) => void;
}

export interface ConverterInputRowProps {
    value: string;
    unit: string;
    units: string[];
    onValueChange: (v: string) => void;
    onUnitChange: (u: string) => void;
    highlight?: boolean;
}

export interface ConverterSwapButtonProps {
    onSwap: () => void;
}

export interface ConverterRateSummaryProps {
    rate: string;
    fromUnit: string;
    toUnit: string;
    rateDate?: string | null;
    loading?: boolean;
}

export interface CategorySelectorProps {
    selected: string;
    onSelect: (cat: string) => void;
}

export interface UnitSelectorRowProps {
    units: string[];
    fromUnit: string;
    toUnit: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
    onSwap: () => void;
}
