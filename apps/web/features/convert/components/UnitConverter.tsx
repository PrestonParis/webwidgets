'use client';

import { useState, useMemo } from 'react';
import { categories } from '@/features/convert/constants';
import { convert, formatResult } from '@/features/convert/hooks/useConvert';
import { UnitConverterProps } from '@/features/convert/types/unitconvert';
import { UnitSelectorRow } from './UnitSelectorRow';

export default function UnitConverter({ category }: UnitConverterProps) {
    const units = useMemo(() => categories[category]?.units ?? [], [category]);

    const [fromUnit, setFromUnit] = useState(() => units[0] ?? '');
    const [toUnit, setToUnit] = useState(() => units[1] ?? units[0] ?? '');
    const [value, setValue] = useState('1');
    const [prevCategory, setPrevCategory] = useState(category);

    if (category !== prevCategory) {
        setPrevCategory(category);
        setFromUnit(units[0] || '');
        setToUnit(units[1] ?? units[0] ?? '');
        setValue('1');
    }

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

            <UnitSelectorRow
                units={units}
                fromUnit={fromUnit}
                toUnit={toUnit}
                onFromChange={setFromUnit}
                onToChange={setToUnit}
                onSwap={handleSwap}
            />

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
