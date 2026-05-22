import { ConverterRateSummaryProps } from '@/features/convert/types/unitconvert';

export function ConverterRateSummary({
    rate,
    fromUnit,
    toUnit,
    rateDate,
    loading,
}: ConverterRateSummaryProps) {
    if (!rate && !loading) return null;

    return (
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-900">
            {loading ? (
                <div className="h-3 w-32 mx-auto rounded bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (
                <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500 font-medium tracking-tight">
                    1 {fromUnit} = {rate} {toUnit}
                    {rateDate && (
                        <span className="ml-1 opacity-60">· {rateDate}</span>
                    )}
                </p>
            )}
        </div>
    );
}
