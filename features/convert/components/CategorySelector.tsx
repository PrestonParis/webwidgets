'use client';

import { motion } from 'framer-motion';
import {
    LucideIcon,
    Ruler,
    Thermometer,
    Gauge,
    Clock,
    Square,
    HardDrive,
    Weight,
    Droplets,
    DollarSign,
} from 'lucide-react';
import { categories } from '@/features/convert/constants';
import { getCategories } from '@/features/convert/types/unitconvert';
import { CategorySelectorProps } from '@/features/convert/types/unitconvert';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

const iconMap: Record<string, LucideIcon> = {
    Length: Ruler,
    Weight: Weight,
    Temperature: Thermometer,
    Volume: Droplets,
    Speed: Gauge,
    Time: Clock,
    Area: Square,
    Data: HardDrive,
    Currency: DollarSign,
};

export default function CategorySelector({
    selected,
    onSelect,
}: CategorySelectorProps) {
    // Static-only full page — exclude live (async) categories like Currency
    const staticCategories = getCategories().filter(
        (cat) => !categories[cat]?.live,
    );

    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {staticCategories.map((cat) => {
                const Icon = iconMap[cat];
                const active = selected === cat;

                return (
                    <motion.button
                        key={cat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm border',
                            active
                                ? 'bg-primary text-white'
                                : 'bg-card text-muted-foreground',
                        )}
                    >
                        {Icon && <Icon className="w-4 h-4" />}
                        {cat}
                    </motion.button>
                );
            })}
        </div>
    );
}
