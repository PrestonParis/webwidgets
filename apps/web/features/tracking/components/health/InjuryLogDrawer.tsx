'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from '@/features/ui/components/Modal';
import {
    BODY_REGION_MAP,
    getAdjacentRegions,
    type TissueType,
} from '@/features/tracking/lib/health/bodyRegions';
import {
    detectRedFlags,
    getRegionLogs,
} from '@/features/tracking/lib/health/analytics';
import {
    INJURY_STATUSES,
    PAIN_QUALITIES,
    RED_FLAG_LABELS,
    TISSUE_TYPE_CONFIG_MAP,
    TISSUE_TYPE_CONFIGS,
    type InjuryLog,
    type InjuryLogDraft,
    type InjuryOnset,
    type InjuryStatus,
    type PainQuality,
} from '@/features/tracking/lib/health/types';

export interface InjuryLogDrawerProps {
    regionId: string | null;
    existingLogs: InjuryLog[];
    onSave: (log: InjuryLogDraft) => Promise<void>;
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
    /** Allows the region header to switch the drawer to an adjacent region. */
    onSwitchRegion?: (regionId: string) => void;
}

const SEVERITY_LABELS: Record<number, string> = {
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

const MOBILITY_LABELS: Record<number, string> = {
    1: 'No impact',
    5: 'Limited',
    10: 'Cannot move',
};

const ONSETS: { id: InjuryOnset; label: string }[] = [
    { id: 'sudden', label: 'Sudden' },
    { id: 'gradual', label: 'Gradual' },
    { id: 'unknown', label: 'Unknown' },
];

const STATUS_TONE: Record<InjuryStatus, string> = {
    active: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    improving:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    resolved:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    chronic:
        'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
};

const chipBase =
    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border';
const chipOff =
    'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800';
const chipOn =
    'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300';

interface FormState {
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

function emptyForm(regionId: string | null): FormState {
    const region = regionId ? BODY_REGION_MAP[regionId] : undefined;
    const tissueType: TissueType =
        region && region.supportedTissueTypes.length > 0
            ? (region.supportedTissueTypes[0] as TissueType)
            : 'muscle';
    return {
        tissueType,
        injuryType: '',
        severity: 3,
        painQualities: [],
        onset: 'unknown',
        cause: '',
        symptoms: '',
        mobilityImpact: 1,
        hasSwelling: false,
        hasBruising: false,
        hasBleeding: false,
        notes: '',
    };
}

function timeAgo(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function InjuryLogDrawer({
    regionId,
    existingLogs,
    onSave,
    onUpdateStatus,
    onClose,
    isOpen,
    onSwitchRegion,
}: InjuryLogDrawerProps) {
    const [form, setForm] = useState<FormState>(() => emptyForm(regionId));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Reset the form when the active region changes, using the render-time
    // "adjust state from prior props" pattern (no setState-in-effect).
    const [trackedRegion, setTrackedRegion] = useState<string | null>(regionId);
    if (trackedRegion !== regionId) {
        setTrackedRegion(regionId);
        setForm(emptyForm(regionId));
        setError(null);
    }

    const region = regionId ? BODY_REGION_MAP[regionId] : undefined;
    const tissueConfig = TISSUE_TYPE_CONFIG_MAP[form.tissueType];
    const adjacent = useMemo(
        () => (regionId ? getAdjacentRegions(regionId) : []),
        [regionId],
    );

    const supportedTissues = region
        ? TISSUE_TYPE_CONFIGS.filter((config) =>
              region.supportedTissueTypes.includes(config.id),
          )
        : TISSUE_TYPE_CONFIGS;

    const regionLogs = useMemo(
        () => (regionId ? getRegionLogs(existingLogs, regionId) : []),
        [existingLogs, regionId],
    );

    // Live red-flag detection on the working form.
    const liveFlags = useMemo(() => {
        if (!regionId) return [];
        return detectRedFlags({
            bodyRegionId: regionId,
            tissueType: form.tissueType,
            injuryType: form.injuryType || 'general pain',
            severity: form.severity,
            painQualities: form.painQualities,
            onset: form.onset,
            symptoms: form.symptoms,
            mobilityImpact: form.mobilityImpact,
            hasSwelling: form.hasSwelling,
            hasBruising: form.hasBruising,
            hasBleeding: form.hasBleeding,
            notes: form.notes,
            redFlags: [],
        });
    }, [regionId, form]);

    if (!isOpen || !region || !regionId) return null;

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const togglePainQuality = (quality: PainQuality) => {
        setForm((prev) => ({
            ...prev,
            painQualities: prev.painQualities.includes(quality)
                ? prev.painQualities.filter((q) => q !== quality)
                : [...prev.painQualities, quality],
        }));
    };

    const handleSubmit = async () => {
        if (!form.symptoms.trim() && !form.injuryType.trim()) {
            setError(
                'Add an injury type or describe the symptoms before saving.',
            );
            return;
        }
        setSaving(true);
        setError(null);
        const draft: InjuryLogDraft = {
            bodyRegionId: regionId,
            tissueType: form.tissueType,
            injuryType: form.injuryType.trim() || 'general pain',
            severity: form.severity,
            painQualities: form.painQualities,
            onset: form.onset,
            symptoms: form.symptoms.trim(),
            mobilityImpact: form.mobilityImpact,
            hasSwelling: form.hasSwelling,
            hasBruising: form.hasBruising,
            hasBleeding: form.hasBleeding,
            status: 'active',
            redFlags: liveFlags,
            ...(form.cause.trim() ? { cause: form.cause.trim() } : {}),
            ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        };
        try {
            await onSave(draft);
            onClose();
        } catch {
            setError('Could not save the log. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="lg"
            aria-labelledby="injury-log-title"
        >
            <ModalHeader
                id="injury-log-title"
                title={region.displayName}
                description={`${region.view === 'back' ? 'Back' : 'Front'} view · log soreness or injury`}
                onClose={onClose}
            />
            <ModalBody className="space-y-5">
                {/* Region switcher */}
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

                {/* Red-flag safety banner */}
                {liveFlags.length > 0 && (
                    <div
                        role="alert"
                        className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30"
                    >
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                    These symptoms may require professional
                                    medical evaluation.
                                </p>
                                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                                    This app does not provide medical advice.
                                    Detected:{' '}
                                    {liveFlags
                                        .map((flag) => RED_FLAG_LABELS[flag])
                                        .join(', ')}
                                    .
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tissue type */}
                <section>
                    <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        Tissue type
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {supportedTissues.map((config) => (
                            <button
                                key={config.id}
                                type="button"
                                onClick={() => {
                                    update('tissueType', config.id);
                                    update('injuryType', '');
                                }}
                                className={`${chipBase} ${form.tissueType === config.id ? chipOn : chipOff}`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                    {tissueConfig && (
                        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500">
                            {tissueConfig.description}
                        </p>
                    )}
                </section>

                {/* Injury type */}
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

                {/* Severity */}
                <section>
                    <label
                        htmlFor="injury-severity"
                        className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        <span>Severity</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                            {form.severity}/10 ·{' '}
                            {SEVERITY_LABELS[form.severity]}
                        </span>
                    </label>
                    <input
                        id="injury-severity"
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={form.severity}
                        onChange={(e) =>
                            update('severity', Number(e.target.value))
                        }
                        className="w-full accent-rose-500"
                    />
                </section>

                {/* Pain quality */}
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

                {/* Onset */}
                <section>
                    <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        Onset
                    </p>
                    <div className="flex gap-1.5">
                        {ONSETS.map((onset) => (
                            <button
                                key={onset.id}
                                type="button"
                                onClick={() => update('onset', onset.id)}
                                className={`${chipBase} flex-1 ${form.onset === onset.id ? chipOn : chipOff}`}
                            >
                                {onset.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Flags */}
                <section>
                    <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        Flags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {(
                            [
                                ['hasSwelling', 'Swelling'],
                                ['hasBruising', 'Bruising'],
                                ['hasBleeding', 'Bleeding'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={form[key]}
                                onClick={() => update(key, !form[key])}
                                className={`${chipBase} ${form[key] ? chipOn : chipOff}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Mobility impact */}
                <section>
                    <label
                        htmlFor="injury-mobility"
                        className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        <span>Mobility impact</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {form.mobilityImpact}/10 ·{' '}
                            {MOBILITY_LABELS[form.mobilityImpact] ??
                                (form.mobilityImpact >= 8
                                    ? 'Severe'
                                    : form.mobilityImpact >= 4
                                      ? 'Moderate'
                                      : 'Minor')}
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

                {/* Cause */}
                <section>
                    <label
                        htmlFor="injury-cause"
                        className="mb-1 block text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        Cause / activity
                    </label>
                    <input
                        id="injury-cause"
                        type="text"
                        value={form.cause}
                        onChange={(e) => update('cause', e.target.value)}
                        placeholder="e.g. running, lifting, fall (optional)"
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </section>

                {/* Symptoms */}
                <section>
                    <label
                        htmlFor="injury-symptoms"
                        className="mb-1 block text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        Symptoms
                    </label>
                    <textarea
                        id="injury-symptoms"
                        rows={2}
                        value={form.symptoms}
                        onChange={(e) => update('symptoms', e.target.value)}
                        placeholder="Describe what you feel"
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </section>

                {/* Notes */}
                <section>
                    <label
                        htmlFor="injury-notes"
                        className="mb-1 block text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        Notes
                    </label>
                    <textarea
                        id="injury-notes"
                        rows={2}
                        value={form.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        placeholder="Anything else (optional)"
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </section>

                {error && <p className="text-xs text-red-500">{error}</p>}

                {/* Existing logs for this region */}
                {regionLogs.length > 0 && (
                    <section>
                        <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            History for this region ({regionLogs.length})
                        </p>
                        <div className="space-y-2">
                            {regionLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-gray-800 capitalize dark:text-zinc-200">
                                                {log.injuryType} ·{' '}
                                                {log.severity}/10
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                {timeAgo(log.createdAt)} ·{' '}
                                                {
                                                    TISSUE_TYPE_CONFIG_MAP[
                                                        log.tissueType
                                                    ]?.label
                                                }
                                                {log.redFlags.length > 0
                                                    ? ' · ⚠ flagged'
                                                    : ''}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[log.status]}`}
                                        >
                                            {log.status}
                                        </span>
                                    </div>
                                    {log.symptoms && (
                                        <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                                            {log.symptoms}
                                        </p>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {INJURY_STATUSES.map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                disabled={status === log.status}
                                                onClick={() =>
                                                    void onUpdateStatus(
                                                        log.id,
                                                        status,
                                                    )
                                                }
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                                                    status === log.status
                                                        ? 'cursor-default opacity-40'
                                                        : 'border border-gray-200 text-gray-500 hover:bg-white dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </ModalBody>
            <ModalFooter>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSubmit()}
                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save log'}
                </button>
            </ModalFooter>
        </Modal>
    );
}
