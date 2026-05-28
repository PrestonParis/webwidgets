'use client';

import type {
    SicknessType,
    TemperatureUnit,
} from '@/features/tracking/health/types/health';

const SICKNESS_TYPES: SicknessType[] = [
    'cold',
    'flu',
    'gi',
    'migraine',
    'allergy',
    'headache',
    'fatigue',
    'other',
];

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-rose-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

interface SicknessSectionProps {
    enabled: boolean;
    onToggle: (v: boolean) => void;
    sicknessType: SicknessType;
    onTypeChange: (v: SicknessType) => void;
    medicationTaken: boolean;
    onMedicationChange: (v: boolean) => void;
    temperature: string;
    onTemperatureChange: (v: string) => void;
    temperatureUnit: TemperatureUnit;
    onUnitChange: (v: TemperatureUnit) => void;
}

export function SicknessSection({
    enabled,
    onToggle,
    sicknessType,
    onTypeChange,
    medicationTaken,
    onMedicationChange,
    temperature,
    onTemperatureChange,
    temperatureUnit,
    onUnitChange,
}: SicknessSectionProps) {
    return (
        <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/50">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="accent-rose-500"
                />
                Log sickness
            </label>
            {enabled && (
                <div className="space-y-2">
                    <div>
                        <label htmlFor="sickness-type" className={labelCls}>
                            Type
                        </label>
                        <select
                            id="sickness-type"
                            value={sicknessType}
                            onChange={(e) =>
                                onTypeChange(e.target.value as SicknessType)
                            }
                            className={inputCls}
                        >
                            {SICKNESS_TYPES.map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                    className="capitalize"
                                >
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                        <input
                            type="checkbox"
                            checked={medicationTaken}
                            onChange={(e) =>
                                onMedicationChange(e.target.checked)
                            }
                            className="accent-rose-500"
                        />
                        Medication taken
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label htmlFor="sickness-temp" className={labelCls}>
                                Temperature
                            </label>
                            <input
                                id="sickness-temp"
                                type="number"
                                inputMode="decimal"
                                placeholder="Optional"
                                value={temperature}
                                onChange={(e) =>
                                    onTemperatureChange(e.target.value)
                                }
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label htmlFor="sickness-unit" className={labelCls}>
                                Unit
                            </label>
                            <select
                                id="sickness-unit"
                                value={temperatureUnit}
                                onChange={(e) =>
                                    onUnitChange(
                                        e.target.value as TemperatureUnit,
                                    )
                                }
                                className={inputCls}
                            >
                                <option value="F">°F</option>
                                <option value="C">°C</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
