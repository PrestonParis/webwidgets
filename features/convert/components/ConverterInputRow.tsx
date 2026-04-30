import { cn } from '@/lib/utils/utils';
import { ConverterInputRowProps } from '@/types/unitconvert';
import { baseInputClass } from '@/features/convert/constants';

export function ConverterInputRow({
    value,
    unit,
    units,
    onValueChange,
    onUnitChange,
    highlight,
}: ConverterInputRowProps) {
    return (
        <div className="flex gap-2">
            <input
                type="number"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="0"
                className={cn(
                    baseInputClass,
                    highlight &&
                        'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-900/20 focus:border-amber-500/50 font-bold',
                )}
            />
            <select
                value={unit}
                onChange={(e) => onUnitChange(e.target.value)}
                className="w-24 h-11 px-3 text-xs bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-transparent outline-none text-gray-600 dark:text-zinc-400 cursor-pointer appearance-none"
            >
                {units.map((u) => (
                    <option key={u} value={u}>
                        {u}
                    </option>
                ))}
            </select>
        </div>
    );
}
