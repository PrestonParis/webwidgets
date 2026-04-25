"use client";
import { useState, useMemo } from "react";
import { ArrowDownUp, ArrowLeftRight } from "lucide-react";
import { getCategories, getUnits } from "@/types/unitconvert";
import { convert, formatResult } from "@/app/lib/logic/convert";
import { cn } from "@/app/lib/utils";

export default function UnitConverterWidget() {
    const categoryList = getCategories();

    const [category, setCategory] = useState<string>("Length");
    const [fromUnit, setFromUnit] = useState<string>(() => getUnits("Length")[0]);
    const [toUnit, setToUnit] = useState<string>(() => getUnits("Length")[1]);
    const [fromValue, setFromValue] = useState<string>("1");

    // Derive valid units for current category
    const units = useMemo(() => getUnits(category), [category]);
    const validFrom = units.includes(fromUnit) ? fromUnit : units[0] ?? "";
    const validTo = units.includes(toUnit) ? toUnit : units[1] ?? units[0] ?? "";

    // Derive the converted result directly - no state needed!
    const convertedResult = useMemo(
        () => formatResult(convert(category, fromValue, validFrom, validTo)),
        [category, fromValue, validFrom, validTo]
    );

    // For the summary line, we want to show the conversion rate for 1 unit of "from"
    const conversionRate = useMemo(
        () => formatResult(convert(category, "1", validFrom, validTo)),
        [category, validFrom, validTo]
    );

    const handleCategoryChange = (cat: string) => {
        const newUnits = getUnits(cat);
        setCategory(cat);
        setFromUnit(newUnits[0] ?? "");
        setToUnit(newUnits[1] ?? newUnits[0] ?? "");
        setFromValue("1");
    };

    const handleSwap = () => {
        setFromUnit(validTo);
        setToUnit(validFrom);
        setFromValue(convertedResult);
    };

    return (
    <div className="group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-amber-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden">
        
        {/* Header with Badge */}
        <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
            Converter
            </h3>
        </div>
        
        {/* "Convert" Badge */}
        <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
            Convert
        </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {categoryList.map((cat) => (
            <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
                "shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                category === cat
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
            )}
            >
            {cat}
            </button>
        ))}
        </div>

        {/* Input Section */}
        <div className="space-y-3 grow">
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
                <option key={u} value={u}>{u}</option>
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
                {convertedResult || "0"}
            </span>
            </div>
            <select
            value={validTo}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-24 h-11 px-3 text-xs bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-transparent outline-none text-gray-600 dark:text-zinc-400 cursor-pointer appearance-none"
            >
            {units.map((u) => (
                <option key={u} value={u}>{u}</option>
            ))}
            </select>
        </div>
        </div>

        {/* Result Summary - shows the conversion equation */}
        {fromValue && convertedResult && (
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-900">
            <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500 font-medium tracking-tight">
                1 {validFrom} = {conversionRate} {validTo}
            </p>
        </div>
        )}
    </div>
    );
}