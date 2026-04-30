import { categories } from '@/features/convert/constants';
export type Category = {
    units: string[];
    base: string;
    conversions?: Record<string, number>;
    custom?: boolean;
};

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
}
