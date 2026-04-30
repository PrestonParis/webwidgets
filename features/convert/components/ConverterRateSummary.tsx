import { ConverterRateSummaryProps } from '@/types/unitconvert';

export function ConverterRateSummary({
    rate,
    fromUnit,
    toUnit,
}: ConverterRateSummaryProps) {
    if (!rate) return null;
    return (
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-900">
            <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500 font-medium tracking-tight">
                1 {fromUnit} = {rate} {toUnit}
            </p>
        </div>
    );
}
