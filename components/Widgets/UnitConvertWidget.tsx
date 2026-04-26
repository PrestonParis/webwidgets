'use client';

import { useState, useMemo } from 'react';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import { getCategories, getUnits } from '@/types/unitconvert';
import { convert, formatResult } from '@/app/lib/logic/convert';
import { cn } from '@/app/lib/utils';
import WidgetShell from '@/components/Widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';

export default function UnitConverterWidget() {
    const categoryList = getCategories();
    const [category, setCategory] = useState('Length');
    const [fromUnit, setFromUnit] = useState(() => getUnits('Length')[0]);
    const [toUnit, setToUnit] = useState(() => getUnits('Length')[1]);
    const [fromValue, setFromValue] = useState('1');
    const { settings, updateSettings } = useWidgetSettings(
        'converter',
        'converter',
    );

    const units = useMemo(() => getUnits(category), [category]);
    const validFrom = units.includes(fromUnit) ? fromUnit : (units[0] ?? '');
    const validTo = units.includes(toUnit)
        ? toUnit
        : (units[1] ?? units[0] ?? '');

    const convertedResult = useMemo(
        () => formatResult(convert(category, fromValue, validFrom, validTo)),
        [category, fromValue, validFrom, validTo],
    );
    const conversionRate = useMemo(
        () => formatResult(convert(category, '1', validFrom, validTo)),
        [category, validFrom, validTo],
    );

    const handleCategoryChange = (cat: string) => {
        const newUnits = getUnits(cat);
        setCategory(cat);
        setFromUnit(newUnits[0] ?? '');
        setToUnit(newUnits[1] ?? newUnits[0] ?? '');
        setFromValue('1');
    };

    const handleSwap = () => {
        setFromUnit(validTo);
        setToUnit(validFrom);
        setFromValue(convertedResult);
    };

    return (
        <WidgetShell
            icon={<ArrowLeftRight />}
            title="Converter"
            badge="Convert"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-4 mb-2 no-scrollbar">
                {categoryList.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={cn(
                            'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                            category === cat
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800',
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Inputs */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={fromValue}
                        onChange={(e) => setFromValue(e.target.value)}
                        className="flex-1 min-w-0 h-11 px-4 text-sm bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-transparent focus:border-amber-500/50 outline-none text-gray-900 dark:text-zinc-100 transition-all"
                        placeholder="0"
                    />
                    <select
                        value={validFrom}
                        onChange={(e) => setFromUnit(e.target.value)}
                        className="w-24 h-11 px-3 text-xs bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-transparent outline-none text-gray-600 dark:text-zinc-400 cursor-pointer appearance-none"
                    >
                        {units.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-center -my-1 relative z-10">
                    <button
                        onClick={handleSwap}
                        className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                        <ArrowDownUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 min-w-0 h-11 px-4 flex items-center rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400 truncate">
                            {convertedResult || '0'}
                        </span>
                    </div>
                    <select
                        value={validTo}
                        onChange={(e) => setToUnit(e.target.value)}
                        className="w-24 h-11 px-3 text-xs bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-transparent outline-none text-gray-600 dark:text-zinc-400 cursor-pointer appearance-none"
                    >
                        {units.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Rate summary */}
            {fromValue && convertedResult && (
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-900">
                    <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500 font-medium tracking-tight">
                        1 {validFrom} = {conversionRate} {validTo}
                    </p>
                </div>
            )}
        </WidgetShell>
    );
}
