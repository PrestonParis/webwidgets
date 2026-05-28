'use client';

import {
    ftInToCm,
    type HeightUnit,
} from '@/features/tracking/health/lib/weightDomain';

interface WeightHeightInputProps {
    heightUnit: HeightUnit;
    heightFt: string;
    heightInches: string;
    heightCmRaw: string;
    onUnitChange: (u: HeightUnit) => void;
    onFtChange: (v: string) => void;
    onInChange: (v: string) => void;
    onCmChange: (v: string) => void;
    inputCls: string;
    toggleCls: (active: boolean) => string;
}

export function WeightHeightInput({
    heightUnit,
    heightFt,
    heightInches,
    heightCmRaw,
    onUnitChange,
    onFtChange,
    onInChange,
    onCmChange,
    inputCls,
    toggleCls,
}: WeightHeightInputProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                    Height{' '}
                    <span className="font-normal text-gray-400">(for BMI)</span>
                </label>
                <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                    <button
                        type="button"
                        className={toggleCls(heightUnit === 'in')}
                        onClick={() => onUnitChange('in')}
                    >
                        ft/in
                    </button>
                    <button
                        type="button"
                        className={toggleCls(heightUnit === 'cm')}
                        onClick={() => onUnitChange('cm')}
                    >
                        cm
                    </button>
                </div>
            </div>
            {heightUnit === 'in' ? (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label htmlFor="wlf-ft" className="sr-only">
                            Feet
                        </label>
                        <input
                            id="wlf-ft"
                            type="number"
                            min="1"
                            max="8"
                            placeholder="5 ft"
                            value={heightFt}
                            onChange={(e) => onFtChange(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="wlf-in" className="sr-only">
                            Inches
                        </label>
                        <input
                            id="wlf-in"
                            type="number"
                            min="0"
                            max="11"
                            placeholder="10 in"
                            value={heightInches}
                            onChange={(e) => onInChange(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <label htmlFor="wlf-cm" className="sr-only">
                        Height in centimeters
                    </label>
                    <input
                        id="wlf-cm"
                        type="number"
                        step="0.1"
                        placeholder="177.8"
                        value={heightCmRaw}
                        onChange={(e) => onCmChange(e.target.value)}
                        className={inputCls}
                    />
                </>
            )}
        </div>
    );
}

export { ftInToCm };
