import { ArrowDownUp } from 'lucide-react';
import { ConverterSwapButtonProps } from '@/features/convert/types/unitconvert';

export function ConverterSwapButton({ onSwap }: ConverterSwapButtonProps) {
    return (
        <div className="flex justify-center -my-1 relative z-10">
            <button
                onClick={onSwap}
                className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            >
                <ArrowDownUp className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
