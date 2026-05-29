'use client';

import { AlertTriangle } from 'lucide-react';
import {
    PAIN_QUALITIES,
    RED_FLAG_LABELS,
    TISSUE_TYPE_CONFIGS,
    TISSUE_TYPE_CONFIG_MAP,
    type InjuryOnset,
    type PainQuality,
    type TissueTypeConfig,
} from '@/features/tracking/health/types/health';
import type {
    BodyRegion,
    TissueType,
} from '@/features/tracking/health/lib/bodyRegions';

export const SEVERITY_LABELS: Record<number, string> = {
    1: 'Barely noticeable',
    2: 'Very mild',
    3: 'Mild',
    4: 'Mild–moderate',
    5: 'Moderate',
    6: 'Moderate–strong',
    7: 'Strong',
    8: 'Very strong',
    9: 'Severe',
    10: 'Worst imaginable',
};

export const ONSETS: { id: InjuryOnset; label: string }[] = [
    { id: 'sudden', label: 'Sudden' },
    { id: 'gradual', label: 'Gradual' },
    { id: 'unknown', label: 'Unknown' },
];

const chipBase =
    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border';
const chipOff =
    'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800';
const chipOn =
    'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300';

export interface InjuryFormState {
    tissueType: TissueType;
    injuryType: string;
    severity: number;
    painQualities: PainQuality[];
    onset: InjuryOnset;
    cause: string;
    symptoms: string;
    mobilityImpact: number;
    hasSwelling: boolean;
    hasBruising: boolean;
    hasBleeding: boolean;
    notes: string;
}

interface InjuryLogFormBodyProps {
    form: InjuryFormState;
    update: <K extends keyof InjuryFormState>(
        key: K,
        value: InjuryFormState[K],
    ) => void;
    togglePainQuality: (quality: PainQuality) => void;
    region: BodyRegion;
    adjacent: BodyRegion[];
    liveFlags: string[];
    onSwitchRegion?: (id: string) => void;
    error: string | null;
}

export function InjuryLogFormBody({
    form,
    update,
    togglePainQuality,
    region,
    adjacent,
    liveFlags,
    onSwitchRegion,
    error,
}: InjuryLogFormBodyProps) {
    const tissueConfig = TISSUE_TYPE_CONFIG_MAP[form.tissueType] as
        | TissueTypeConfig
        | undefined;
    const supportedTissues = TISSUE_TYPE_CONFIGS.filter((c) =>
        region.supportedTissueTypes.includes(c.id),
    );

    return (
        <>
            {onSwitchRegion && adjacent.length > 0 && (
                <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                        Switch region
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {adjacent.map((adj) => (
                            <button
                                key={adj.id}
                                type="button"
                                onClick={() => onSwitchRegion(adj.id)}
                                className={`${chipBase} ${chipOff}`}
                            >
                                {adj.displayName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {liveFlags.length > 0 && (
                <div
                    role="alert"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30"
                >
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                These symptoms may require professional medical
                                evaluation.
                            </p>
                            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                                This app does not provide medical advice.
                                Detected:{' '}
                                {liveFlags
                                    .map(
                                        (f) =>
                                            RED_FLAG_LABELS[
                                                f as keyof typeof RED_FLAG_LABELS
                                            ],
                                    )
                                    .join(', ')}
                                .
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <section>
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Tissue type
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {supportedTissues.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                                update('tissueType', c.id);
                                update('injuryType', '');
                            }}
                            className={`${chipBase} ${form.tissueType === c.id ? chipOn : chipOff}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
                {tissueConfig && (
                    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500">
                        {tissueConfig.description}
                    </p>
                )}
            </section>
            <section>
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Injury type
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {(tissueConfig?.commonInjuryTypes ?? []).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => update('injuryType', type)}
                            className={`${chipBase} ${form.injuryType === type ? chipOn : chipOff} capitalize`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    value={form.injuryType}
                    onChange={(e) => update('injuryType', e.target.value)}
                    placeholder="Or type a custom injury type"
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
            </section>
            <section>
                <label
                    htmlFor="injury-severity"
                    className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300"
                >
                    <span>Severity</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                        {form.severity}/10 · {SEVERITY_LABELS[form.severity]}
                    </span>
                </label>
                <input
                    id="injury-severity"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.severity}
                    onChange={(e) => update('severity', Number(e.target.value))}
                    className="w-full accent-rose-500"
                />
            </section>
            <section>
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Pain quality
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {PAIN_QUALITIES.map((quality) => (
                        <button
                            key={quality}
                            type="button"
                            onClick={() => togglePainQuality(quality)}
                            className={`${chipBase} ${form.painQualities.includes(quality) ? chipOn : chipOff} capitalize`}
                        >
                            {quality}
                        </button>
                    ))}
                </div>
            </section>
            <section>
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Onset
                </p>
                <div className="flex gap-1.5">
                    {ONSETS.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => update('onset', o.id)}
                            className={`${chipBase} flex-1 ${form.onset === o.id ? chipOn : chipOff}`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </section>
            <section>
                <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Flags
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {(
                        ['hasSwelling', 'hasBruising', 'hasBleeding'] as const
                    ).map((key) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={form[key]}
                            onClick={() => update(key, !form[key])}
                            className={`${chipBase} ${form[key] ? chipOn : chipOff}`}
                        >
                            {key === 'hasSwelling'
                                ? 'Swelling'
                                : key === 'hasBruising'
                                  ? 'Bruising'
                                  : 'Bleeding'}
                        </button>
                    ))}
                </div>
            </section>
            <section>
                <label
                    htmlFor="injury-mobility"
                    className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300"
                >
                    <span>Mobility impact</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {form.mobilityImpact}/10 ·{' '}
                        {form.mobilityImpact >= 8
                            ? 'Severe'
                            : form.mobilityImpact >= 4
                              ? 'Moderate'
                              : 'Minor'}
                    </span>
                </label>
                <input
                    id="injury-mobility"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.mobilityImpact}
                    onChange={(e) =>
                        update('mobilityImpact', Number(e.target.value))
                    }
                    className="w-full accent-indigo-500"
                />
            </section>
            {(['cause', 'symptoms', 'notes'] as const).map((field) => (
                <section key={field}>
                    <label
                        htmlFor={`injury-${field}`}
                        className="mb-1 block text-xs font-semibold text-gray-700 dark:text-zinc-300 capitalize"
                    >
                        {field === 'cause' ? 'Cause / activity' : field}
                    </label>
                    {field === 'cause' ? (
                        <input
                            id={`injury-${field}`}
                            type="text"
                            value={form[field]}
                            onChange={(e) => update(field, e.target.value)}
                            placeholder={
                                field === 'cause'
                                    ? 'e.g. running, lifting, fall (optional)'
                                    : ''
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                    ) : (
                        <textarea
                            id={`injury-${field}`}
                            rows={2}
                            value={form[field]}
                            onChange={(e) => update(field, e.target.value)}
                            placeholder={
                                field === 'symptoms'
                                    ? 'Describe what you feel'
                                    : 'Anything else (optional)'
                            }
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                    )}
                </section>
            ))}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </>
    );
}
