'use client';

import { useState } from 'react';
import {
    ISSUE_TYPES,
    ISSUE_TRIGGERS,
    SEVERITY_LABELS,
    severityColor,
    type BodyIssueDraft,
    type DurationType,
    type IssueTrigger,
    type IssueStatus,
} from '@/features/tracking/lib/health/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/lib/health/bodyRegions';

const TODAY = new Date().toISOString().slice(0, 10);

interface BodyIssueFormProps {
    regionId: string;
    regionName: string;
    onSave: (draft: BodyIssueDraft) => Promise<void>;
    onCancel: () => void;
    initialDraft?: Partial<BodyIssueDraft>;
}

const inputCls =
    'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500';
const labelCls =
    'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';

export function BodyIssueForm({
    regionId,
    regionName,
    onSave,
    onCancel,
    initialDraft,
}: BodyIssueFormProps) {
    const region = BODY_REGION_MAP[regionId];

    const [issueType, setIssueType] = useState<string>(
        initialDraft?.issueType ?? '',
    );
    const [severity, setSeverity] = useState<number>(
        initialDraft?.severity ?? 5,
    );
    const [onsetDate, setOnsetDate] = useState<string>(
        initialDraft?.onsetDate ?? TODAY,
    );
    const [durationType, setDurationType] = useState<DurationType>(
        initialDraft?.durationType ?? 'acute',
    );
    const [status, setStatus] = useState<IssueStatus>(
        initialDraft?.status ?? 'active',
    );
    const [triggers, setTriggers] = useState<IssueTrigger[]>(
        initialDraft?.triggers ?? [],
    );
    const [notes, setNotes] = useState<string>(initialDraft?.notes ?? '');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function toggleTrigger(t: IssueTrigger) {
        setTriggers((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
        );
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!issueType) e['issueType'] = 'Select an issue type.';
        if (severity < 1 || severity > 10)
            e['severity'] = 'Severity must be 1–10.';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const draft: BodyIssueDraft = {
                regionId,
                regionType:
                    initialDraft?.regionType ??
                    region?.supportedTissueTypes[0] ??
                    'general',
                issueType,
                severity,
                onsetDate,
                durationType,
                status,
                notes: notes.trim() || undefined,
                triggers,
                ...(initialDraft?.skinX !== undefined && {
                    skinX: initialDraft.skinX,
                }),
                ...(initialDraft?.skinY !== undefined && {
                    skinY: initialDraft.skinY,
                }),
                ...(initialDraft?.skinDrawing !== undefined && {
                    skinDrawing: initialDraft.skinDrawing,
                }),
                ...(initialDraft?.toothNumber !== undefined && {
                    toothNumber: initialDraft.toothNumber,
                }),
            };
            await onSave(draft);
        } finally {
            setSaving(false);
        }
    }

    const toggleCls = (active: boolean) =>
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            active
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                : 'text-gray-500 dark:text-zinc-400'
        }`;

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
            className="space-y-4 text-sm"
        >
            {/* Region display */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 px-3 py-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    {regionName}
                </span>
                {region && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300 capitalize">
                        {region.supportedTissueTypes[0]}
                    </span>
                )}
                {!region && initialDraft?.regionType && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300 capitalize">
                        {initialDraft.regionType}
                    </span>
                )}
            </div>

            {/* Issue type chips */}
            <div>
                <p className={labelCls}>Issue type</p>
                <div className="flex flex-wrap gap-1.5">
                    {ISSUE_TYPES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setIssueType(t.id)}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                issueType === t.id
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'
                            }`}
                        >
                            <span>{t.emoji}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
                {errors['issueType'] && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors['issueType']}
                    </p>
                )}
            </div>

            {/* Severity slider */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label
                        htmlFor="bif-severity"
                        className={labelCls.replace(' mb-1', '')}
                    >
                        Severity
                    </label>
                    <span
                        className="text-xs font-bold"
                        style={{ color: severityColor(severity) }}
                    >
                        {severity}/10 — {SEVERITY_LABELS[severity]}
                    </span>
                </div>
                <input
                    id="bif-severity"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                    style={{ accentColor: severityColor(severity) }}
                />
                <div className="mt-1 flex justify-between text-[9px] text-gray-400 dark:text-zinc-500">
                    <span>1 — minimal</span>
                    <span>10 — debilitating</span>
                </div>
                {errors['severity'] && (
                    <p className="mt-0.5 text-xs text-red-500">
                        {errors['severity']}
                    </p>
                )}
            </div>

            {/* Onset date */}
            <div>
                <label htmlFor="bif-date" className={labelCls}>
                    Onset date
                </label>
                <input
                    id="bif-date"
                    type="date"
                    value={onsetDate}
                    onChange={(e) => setOnsetDate(e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Duration type toggle */}
            <div>
                <p className={labelCls}>Duration type</p>
                <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5 w-fit">
                    <button
                        type="button"
                        className={toggleCls(durationType === 'acute')}
                        onClick={() => setDurationType('acute')}
                    >
                        Acute
                    </button>
                    <button
                        type="button"
                        className={toggleCls(durationType === 'chronic')}
                        onClick={() => setDurationType('chronic')}
                    >
                        Chronic
                    </button>
                </div>
            </div>

            {/* Status radio */}
            <div>
                <p className={labelCls}>Status</p>
                <div className="flex gap-2">
                    {(['active', 'improving', 'resolved'] as IssueStatus[]).map(
                        (s) => (
                            <label
                                key={s}
                                className="flex items-center gap-1.5 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="bif-status"
                                    value={s}
                                    checked={status === s}
                                    onChange={() => setStatus(s)}
                                    className="accent-indigo-500"
                                />
                                <span className="text-xs capitalize text-gray-700 dark:text-zinc-300">
                                    {s}
                                </span>
                            </label>
                        ),
                    )}
                </div>
            </div>

            {/* Triggers multi-select */}
            <div>
                <p className={labelCls}>
                    Triggers <span className="font-normal">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {ISSUE_TRIGGERS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTrigger(t.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                triggers.includes(t.id)
                                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label htmlFor="bif-notes" className={labelCls}>
                    Notes <span className="font-normal">(optional)</span>
                </label>
                <textarea
                    id="bif-notes"
                    rows={3}
                    placeholder="Describe symptoms, context, or anything relevant…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputCls} resize-none`}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save issue'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
