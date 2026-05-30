'use client';

import { useState } from 'react';
import {
    SEVERITY_LABELS,
    severityColor,
    type BodyIssueDraft,
    type DurationType,
    type IssueStatus,
    type IssueTrigger,
} from '@/features/tracking/health/lib/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';
import { IssueTypePicker } from './IssueTypePicker';
import { TriggerPicker } from './TriggerPicker';

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
                triggers,
                ...(notes.trim() ? { notes: notes.trim() } : {}),
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
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`;

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
            className="space-y-4 text-sm"
        >
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 px-3 py-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    {regionName}
                </span>
                {(region || initialDraft?.regionType) && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300 capitalize">
                        {region?.supportedTissueTypes[0] ??
                            initialDraft?.regionType}
                    </span>
                )}
            </div>

            <IssueTypePicker
                value={issueType}
                onChange={setIssueType}
                {...(errors['issueType'] !== undefined
                    ? { error: errors['issueType'] }
                    : {})}
            />

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
                        /10 ()
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
                    <span>1: minimal</span>
                    <span>10: debilitating</span>
                </div>
                {errors['severity'] && (
                    <p className="mt-0.5 text-xs text-red-500">
                        {errors['severity']}
                    </p>
                )}
            </div>

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

            <TriggerPicker value={triggers} onChange={setTriggers} />

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
