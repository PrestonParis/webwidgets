'use client';

import { useMemo, useState } from 'react';
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
} from '@/features/tracking/health/lib/bodyRegions';
import {
    detectRedFlags,
    getRegionLogs,
} from '@/features/tracking/health/lib/analytics';
import {
    type InjuryLog,
    type InjuryLogDraft,
    type InjuryStatus,
    type PainQuality,
} from '@/features/tracking/health/lib/types';
import { InjuryLogFormBody, type InjuryFormState } from './InjuryLogFormBody';
import { InjuryLogHistory } from './InjuryLogHistory';

export interface InjuryLogDrawerProps {
    regionId: string | null;
    existingLogs: InjuryLog[];
    onSave: (log: InjuryLogDraft) => Promise<void>;
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
    onSwitchRegion?: (regionId: string) => void;
}

function emptyForm(regionId: string | null): InjuryFormState {
    const region = regionId ? BODY_REGION_MAP[regionId] : undefined;
    const tissueType: TissueType =
        (region?.supportedTissueTypes[0] as TissueType | undefined) ?? 'muscle';
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

export default function InjuryLogDrawer({
    regionId,
    existingLogs,
    onSave,
    onUpdateStatus,
    onClose,
    isOpen,
    onSwitchRegion,
}: InjuryLogDrawerProps) {
    const [form, setForm] = useState<InjuryFormState>(() =>
        emptyForm(regionId),
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trackedRegion, setTrackedRegion] = useState<string | null>(regionId);
    if (trackedRegion !== regionId) {
        setTrackedRegion(regionId);
        setForm(emptyForm(regionId));
        setError(null);
    }

    const region = regionId ? BODY_REGION_MAP[regionId] : undefined;
    const adjacent = useMemo(
        () => (regionId ? getAdjacentRegions(regionId) : []),
        [regionId],
    );
    const regionLogs = useMemo(
        () => (regionId ? getRegionLogs(existingLogs, regionId) : []),
        [existingLogs, regionId],
    );
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

    const update = <K extends keyof InjuryFormState>(
        key: K,
        value: InjuryFormState[K],
    ) => setForm((prev) => ({ ...prev, [key]: value }));
    const togglePainQuality = (quality: PainQuality) =>
        setForm((prev) => ({
            ...prev,
            painQualities: prev.painQualities.includes(quality)
                ? prev.painQualities.filter((q) => q !== quality)
                : [...prev.painQualities, quality],
        }));

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
                <InjuryLogFormBody
                    form={form}
                    update={update}
                    togglePainQuality={togglePainQuality}
                    region={region}
                    adjacent={adjacent}
                    liveFlags={liveFlags}
                    onSwitchRegion={onSwitchRegion}
                    error={error}
                />
                <InjuryLogHistory
                    regionLogs={regionLogs}
                    onUpdateStatus={onUpdateStatus}
                />
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
