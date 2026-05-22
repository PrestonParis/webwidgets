import { useState } from 'react';
import { logUrge } from '../api/logUrge';

export const TRIGGER_TAGS = [
    'stress',
    'boredom',
    'social',
    'anxiety',
    'loneliness',
    'craving',
] as const;
export type TriggerTag = (typeof TRIGGER_TAGS)[number];

export function useUrgeForm(trackerId: string) {
    const [trigger, setTrigger] = useState('');
    const [replacement, setReplacement] = useState('');
    const [selectedTags, setSelectedTags] = useState<TriggerTag[]>([]);
    const [intensity, setIntensity] = useState(3);
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const toggleTag = (tag: TriggerTag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
    };

    const combinedTrigger = [
        selectedTags.join(', '),
        trigger.trim(),
        replacement.trim() ? `Instead: ${replacement.trim()}` : '',
    ]
        .filter(Boolean)
        .join(' — ');

    const canSave = combinedTrigger.length > 0;

    const handleLogUrge = async () => {
        if (!canSave) return;
        setIsSaving(true);
        await logUrge(trackerId, combinedTrigger, intensity);
        setTrigger('');
        setReplacement('');
        setSelectedTags([]);
        setIntensity(3);
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const handleCancel = () => {
        setShowUrgeForm(false);
        setTrigger('');
        setReplacement('');
        setSelectedTags([]);
        setIntensity(3);
    };

    return {
        trigger,
        setTrigger,
        replacement,
        setReplacement,
        selectedTags,
        toggleTag,
        intensity,
        setIntensity,
        canSave,
        showUrgeForm,
        setShowUrgeForm,
        isSaving,
        handleLogUrge,
        handleCancel,
    };
}
