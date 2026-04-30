'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { categories } from '@/features/convert/constants';
import { convert, formatResult } from '@/features/convert/hooks/useConvert';
import { UnitConverterProps } from '@/types/unitconvert';

export default function UnitConverter({ category }: UnitConverterProps) {
    // Memoize units to prevent unnecessary recalculations
    const units = useMemo(() => categories[category]?.units ?? [], [category]);

    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [value, setValue] = useState('1');
    const [prevCategory, setPrevCategory] = useState(category);

    // Sync state during render if the category changed
    if (category !== prevCategory) {
        setPrevCategory(category);
        setFromUnit(units[0] || '');
        setToUnit(units[1] ?? units[0] ?? '');
        setValue('1');
    }

    // Derived State: Calculate result on the fly
    const result = useMemo(() => {
        const res = convert(category, value, fromUnit, toUnit);
        return formatResult(res);
    }, [value, fromUnit, toUnit, category]);

    const handleSwap = () => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        if (result !== '0') setValue(result);
    };

    if (!units.length) {
        return (
            <div className="p-4 text-center border rounded-xl text-muted-foreground">
                No units found for category: {category}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 border rounded-2xl bg-card shadow-sm space-y-4 text-card-foreground">
            {/* Input */}
            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase opacity-50 px-1">
                    Amount
                </label>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full h-12 px-4 border rounded-lg text-lg bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="0"
                />
            </div>

            {/* Selectors */}
            <div className="flex items-center gap-2">
                <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="flex-1 h-10 px-2 border rounded-md bg-transparent cursor-pointer hover:border-primary transition-colors outline-none"
                >
                    {units.map((u) => (
                        <option
                            key={u}
                            value={u}
                            className="bg-background text-foreground"
                        >
                            {u}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={handleSwap}
                    className="p-2 hover:bg-accent rounded-full transition-all active:scale-95"
                    title="Swap Units"
                >
                    <ArrowUpDown size={18} />
                </button>

                <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="flex-1 h-10 px-2 border rounded-md bg-transparent cursor-pointer hover:border-primary transition-colors outline-none"
                >
                    {units.map((u) => (
                        <option
                            key={u}
                            value={u}
                            className="bg-background text-foreground"
                        >
                            {u}
                        </option>
                    ))}
                </select>
            </div>

            {/* Result */}
            <div className="pt-4 border-t text-center space-y-1">
                <p className="text-xs font-semibold uppercase opacity-50">
                    Result
                </p>
                <div className="text-3xl font-bold break-all">
                    {result}{' '}
                    <span className="text-primary text-xl font-medium">
                        {toUnit}
                    </span>
                </div>
            </div>
        </div>
    );
}
