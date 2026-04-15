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

  // Derive valid units for current category — no useEffect needed
  const units = useMemo(() => getUnits(category), [category]);
  const validFrom = units.includes(fromUnit) ? fromUnit : units[0] ?? "";
  const validTo = units.includes(toUnit) ? toUnit : units[1] ?? units[0] ?? "";

  const result = useMemo(
    () => formatResult(convert(category, fromValue, validFrom, validTo)),
    [category, fromValue, validFrom, validTo]
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
    if (result && result !== "") setFromValue(result);
  };

  return (
    <div className="w-72 bg-card border border-border rounded-2xl shadow-lg p-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Unit Converter</span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {categoryList.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* From */}
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
          className="flex-1 min-w-0 h-9 px-3 text-sm bg-muted/60 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          placeholder="0"
        />
        <select
          value={validFrom}
          onChange={(e) => setFromUnit(e.target.value)}
          className="w-28 h-9 px-2 text-xs bg-muted/60 rounded-lg border-0 outline-none text-foreground cursor-pointer"
        >
          {units.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Swap */}
      <div className="flex justify-center my-2">
        <button
          onClick={handleSwap}
          className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>

      {/* To */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 h-9 px-3 flex items-center rounded-lg bg-accent/60 border border-border/50">
          <span className="text-sm font-medium text-foreground truncate">
            {result || "0"}
          </span>
        </div>
        <select
          value={validTo}
          onChange={(e) => setToUnit(e.target.value)}
          className="w-28 h-9 px-2 text-xs bg-muted/60 rounded-lg border-0 outline-none text-foreground cursor-pointer"
        >
          {units.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Result label */}
      {fromValue && result && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {fromValue} {validFrom}
          </span>
          {" = "}
          <span className="font-medium text-foreground">
            {result} {validTo}
          </span>
        </p>
      )}
    </div>
  );
}