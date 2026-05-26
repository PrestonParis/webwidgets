'use client';

import { useState } from 'react';
import {
    allergyLogSchema,
    healthLogSchema,
    sicknessLogSchema,
} from '@/features/tracking/lib/health/schemas';
import type {
    AllergyLog,
    AllergySeverity,
    AllergyTrigger,
    Severity,
    SicknessLog,
    SicknessType,
    TemperatureUnit,
} from '@/features/tracking/lib/health/types';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';

interface HealthLogFormProps {
    onSubmit: (entry: BaseTrackingEntry) => Promise<void>;
    onCancel: () => void;
    mode: 'quick' | 'full';
    initialDate?: string;
}

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
const ALLERGY_TRIGGERS: AllergyTrigger[] = [
    'pollen',
    'dust',
    'pet',
    'food',
    'mold',
    'medication',
    'insect',
    'other',
];
const ALLERGY_SEVERITIES: AllergySeverity[] = ['mild', 'moderate', 'severe'];

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-rose-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';
const btnCls = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors';

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function SeveritySlider({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: Severity | undefined;
    onChange: (value: Severity) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-zinc-400"
            >
                <span>{label}</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                    {value ?? '—'}
                    {value !== undefined ? '/10' : ''}
                </span>
            </label>
            <input
                id={id}
                type="range"
                min={1}
                max={10}
                step={1}
                value={value ?? 5}
                onChange={(e) => onChange(Number(e.target.value) as Severity)}
                className="w-full accent-rose-500"
            />
        </div>
    );
}

export default function HealthLogForm({
    onSubmit,
    onCancel,
    mode,
    initialDate,
}: HealthLogFormProps) {
    const [date, setDate] = useState(initialDate ?? todayISO());
    const [energyLevel, setEnergyLevel] = useState<Severity | undefined>(
        undefined,
    );
    const [sleepQuality, setSleepQuality] = useState<Severity | undefined>(
        undefined,
    );
    const [notes, setNotes] = useState('');

    // sickness
    const [logSickness, setLogSickness] = useState(false);
    const [sicknessType, setSicknessType] = useState<SicknessType>('cold');
    const [medicationTaken, setMedicationTaken] = useState(false);
    const [temperature, setTemperature] = useState('');
    const [temperatureUnit, setTemperatureUnit] =
        useState<TemperatureUnit>('F');

    // allergy
    const [logAllergy, setLogAllergy] = useState(false);
    const [allergyTrigger, setAllergyTrigger] =
        useState<AllergyTrigger>('pollen');
    const [allergySeverity, setAllergySeverity] =
        useState<AllergySeverity>('mild');
    const [allergySymptoms, setAllergySymptoms] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        setError(null);
        const baseResult = healthLogSchema.safeParse({
            date,
            ...(energyLevel !== undefined ? { energyLevel } : {}),
            ...(sleepQuality !== undefined ? { sleepQuality } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
        if (!baseResult.success) {
            setError(baseResult.error.issues[0]?.message ?? 'Invalid entry');
            return;
        }

        const metadata: Record<string, unknown> = {};
        if (energyLevel !== undefined) metadata['energyLevel'] = energyLevel;
        if (sleepQuality !== undefined) metadata['sleepQuality'] = sleepQuality;

        if (mode === 'full' && logSickness) {
            const candidate: SicknessLog = {
                type: sicknessType,
                medicationTaken,
                temperatureUnit,
                timestamp: new Date().toISOString(),
                ...(temperature.trim()
                    ? { temperature: Number(temperature) }
                    : {}),
            };
            const result = sicknessLogSchema.safeParse(candidate);
            if (!result.success) {
                setError(
                    result.error.issues[0]?.message ?? 'Invalid sickness entry',
                );
                return;
            }
            metadata['sickness'] = candidate;
        }

        if (mode === 'full' && logAllergy) {
            const candidate: AllergyLog = {
                trigger: allergyTrigger,
                severity: allergySeverity,
                symptoms: allergySymptoms.trim(),
                timestamp: new Date().toISOString(),
            };
            const result = allergyLogSchema.safeParse(candidate);
            if (!result.success) {
                setError(
                    result.error.issues[0]?.message ?? 'Invalid allergy entry',
                );
                return;
            }
            metadata['allergies'] = [candidate];
        }

        const entry: BaseTrackingEntry = {
            category: 'health',
            entryDate: date,
            metadata,
            tags: [],
            source: 'manual',
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        };

        setIsSaving(true);
        try {
            await onSubmit(entry);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-3 text-sm">
            <div>
                <label htmlFor="health-date" className={labelCls}>
                    Date
                </label>
                <input
                    id="health-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                />
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Energy & Sleep
                </p>
                <SeveritySlider
                    id="health-energy"
                    label="Energy level"
                    value={energyLevel}
                    onChange={setEnergyLevel}
                />
                <SeveritySlider
                    id="health-sleep"
                    label="Sleep quality"
                    value={sleepQuality}
                    onChange={setSleepQuality}
                />
            </div>

            {mode === 'full' && (
                <>
                    {/* Sickness */}
                    <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/50">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            <input
                                type="checkbox"
                                checked={logSickness}
                                onChange={(e) =>
                                    setLogSickness(e.target.checked)
                                }
                                className="accent-rose-500"
                            />
                            Log sickness
                        </label>
                        {logSickness && (
                            <div className="space-y-2">
                                <div>
                                    <label
                                        htmlFor="sickness-type"
                                        className={labelCls}
                                    >
                                        Type
                                    </label>
                                    <select
                                        id="sickness-type"
                                        value={sicknessType}
                                        onChange={(e) =>
                                            setSicknessType(
                                                e.target.value as SicknessType,
                                            )
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
                                            setMedicationTaken(e.target.checked)
                                        }
                                        className="accent-rose-500"
                                    />
                                    Medication taken
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label
                                            htmlFor="sickness-temp"
                                            className={labelCls}
                                        >
                                            Temperature
                                        </label>
                                        <input
                                            id="sickness-temp"
                                            type="number"
                                            inputMode="decimal"
                                            placeholder="Optional"
                                            value={temperature}
                                            onChange={(e) =>
                                                setTemperature(e.target.value)
                                            }
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="sickness-unit"
                                            className={labelCls}
                                        >
                                            Unit
                                        </label>
                                        <select
                                            id="sickness-unit"
                                            value={temperatureUnit}
                                            onChange={(e) =>
                                                setTemperatureUnit(
                                                    e.target
                                                        .value as TemperatureUnit,
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

                    {/* Allergies */}
                    <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/50">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            <input
                                type="checkbox"
                                checked={logAllergy}
                                onChange={(e) =>
                                    setLogAllergy(e.target.checked)
                                }
                                className="accent-rose-500"
                            />
                            Log allergy
                        </label>
                        {logAllergy && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label
                                            htmlFor="allergy-trigger"
                                            className={labelCls}
                                        >
                                            Trigger
                                        </label>
                                        <select
                                            id="allergy-trigger"
                                            value={allergyTrigger}
                                            onChange={(e) =>
                                                setAllergyTrigger(
                                                    e.target
                                                        .value as AllergyTrigger,
                                                )
                                            }
                                            className={inputCls}
                                        >
                                            {ALLERGY_TRIGGERS.map((trigger) => (
                                                <option
                                                    key={trigger}
                                                    value={trigger}
                                                    className="capitalize"
                                                >
                                                    {trigger}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="allergy-severity"
                                            className={labelCls}
                                        >
                                            Severity
                                        </label>
                                        <select
                                            id="allergy-severity"
                                            value={allergySeverity}
                                            onChange={(e) =>
                                                setAllergySeverity(
                                                    e.target
                                                        .value as AllergySeverity,
                                                )
                                            }
                                            className={inputCls}
                                        >
                                            {ALLERGY_SEVERITIES.map(
                                                (severity) => (
                                                    <option
                                                        key={severity}
                                                        value={severity}
                                                        className="capitalize"
                                                    >
                                                        {severity}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="allergy-symptoms"
                                        className={labelCls}
                                    >
                                        Symptoms
                                    </label>
                                    <input
                                        id="allergy-symptoms"
                                        type="text"
                                        placeholder="e.g. Sneezing, itchy eyes"
                                        value={allergySymptoms}
                                        onChange={(e) =>
                                            setAllergySymptoms(e.target.value)
                                        }
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div>
                <label htmlFor="health-notes" className={labelCls}>
                    Notes
                </label>
                <input
                    id="health-notes"
                    type="text"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputCls}
                />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isSaving}
                    className={`${btnCls} bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50`}
                >
                    {isSaving ? 'Saving…' : 'Log Entry'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className={`${btnCls} bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700`}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
