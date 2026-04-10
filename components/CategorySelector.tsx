"use client";

import { motion } from "framer-motion";
import { LucideIcon, Ruler, Thermometer, Gauge, Clock, Square, HardDrive } from "lucide-react";
import { categories } from "@/app/lib/unitData";

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(" ");
}

export interface Category {
    units: string[];
    base: string;
    conversions?: Record<string, number>;
    custom?: boolean;
}

export function getCategories(): string[] {
    return Object.keys(categories);
}

const iconMap: Record<string, LucideIcon> = {
    Length: Ruler,
    Weight: Ruler,
    Temperature: Thermometer,
    Speed: Gauge,
    Time: Clock,
    Area: Square,
    Data: HardDrive,
};

interface Props {
    selected: string;
    onSelect: (cat: string) => void;
}

export default function CategorySelector({ selected, onSelect }: Props) {
    const categories = getCategories();

    return (
    <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => {
        const Icon = iconMap[cat];
        const active = selected === cat;

        return (
            <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat)}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm border",
                active
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground"
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