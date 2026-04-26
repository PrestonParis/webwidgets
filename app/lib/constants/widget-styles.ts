import { WidgetBackground, WidgetColor, WidgetSize } from '@/types/widgets';

// This file defines constants and mappings for widget styles, including colors, sizes, and background styles.
export const colorMap: Record<
    WidgetColor,
    {
        iconBg: string;
        iconText: string;
        hoverBorder: string;
        footerHover: string;
        swatch: string;
    }
> = {
    blue: {
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        iconText: 'text-blue-600 dark:text-blue-400',
        hoverBorder: 'hover:border-blue-500/50',
        footerHover:
            'hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400',
        swatch: 'bg-blue-500',
    },
    green: {
        iconBg: 'bg-green-50 dark:bg-green-900/20',
        iconText: 'text-green-600 dark:text-green-400',
        hoverBorder: 'hover:border-green-500/50',
        footerHover:
            'hover:bg-green-50 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400',
        swatch: 'bg-green-500',
    },
    amber: {
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        iconText: 'text-amber-600 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-500/50',
        footerHover:
            'hover:bg-amber-50 dark:hover:bg-amber-900/40 hover:text-amber-600 dark:hover:text-amber-400',
        swatch: 'bg-amber-500',
    },
    purple: {
        iconBg: 'bg-purple-50 dark:bg-purple-900/20',
        iconText: 'text-purple-600 dark:text-purple-400',
        hoverBorder: 'hover:border-purple-500/50',
        footerHover:
            'hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 dark:hover:text-purple-400',
        swatch: 'bg-purple-500',
    },
    red: {
        iconBg: 'bg-red-50 dark:bg-red-900/20',
        iconText: 'text-red-600 dark:text-red-400',
        hoverBorder: 'hover:border-red-500/50',
        footerHover:
            'hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400',
        swatch: 'bg-red-500',
    },
    emerald: {
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        hoverBorder: 'hover:border-emerald-500/50',
        footerHover:
            'hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-600 dark:hover:text-emerald-400',
        swatch: 'bg-emerald-500',
    },
    zinc: {
        iconBg: 'bg-zinc-100 dark:bg-zinc-800',
        iconText: 'text-zinc-600 dark:text-zinc-400',
        hoverBorder: 'hover:border-zinc-400/50',
        footerHover:
            'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300',
        swatch: 'bg-zinc-500',
    },
    pink: {
        iconBg: 'bg-pink-50 dark:bg-pink-900/20',
        iconText: 'text-pink-600 dark:text-pink-400',
        hoverBorder: 'hover:border-pink-500/50',
        footerHover:
            'hover:bg-pink-50 dark:hover:bg-pink-900/40 hover:text-pink-600 dark:hover:text-pink-400',
        swatch: 'bg-pink-500',
    },
    orange: {
        iconBg: 'bg-orange-50 dark:bg-orange-900/20',
        iconText: 'text-orange-600 dark:text-orange-400',
        hoverBorder: 'hover:border-orange-500/50',
        footerHover:
            'hover:bg-orange-50 dark:hover:bg-orange-900/40 hover:text-orange-600 dark:hover:text-orange-400',
        swatch: 'bg-orange-500',
    },
};

export const COLORS = Object.keys(colorMap) as WidgetColor[];

export const SIZE_LABELS: Record<WidgetSize, string> = {
    compact: 'Compact',
    default: 'Default',
    large: 'Large',
};

export const BG_LABELS: Record<WidgetBackground, string> = {
    default: 'Default',
    glass: 'Glass',
    solid: 'Solid',
};

export const bgStyles: Record<WidgetBackground, string> = {
    default: 'bg-white dark:bg-zinc-950',
    glass: 'bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md',
    solid: 'bg-gray-50 dark:bg-zinc-900',
};

export const bgHoverStyles: Record<WidgetBackground, string> = {
    default: 'hover:bg-white dark:hover:bg-zinc-900/80',
    glass: 'hover:bg-white/80 dark:hover:bg-zinc-950/80',
    solid: 'hover:bg-gray-100 dark:hover:bg-zinc-800',
};
