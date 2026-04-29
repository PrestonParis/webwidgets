import { useState } from 'react';
import { logUrge } from '../api/logUrge';

export function useUrgeForm(trackerId: string) {
    const [trigger, setTrigger] = useState('');
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleLogUrge = async () => {
        if (!trigger.trim()) return;
        setIsSaving(true);
        await logUrge(trackerId, trigger);
        setTrigger('');
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const handleCancel = () => {
        setShowUrgeForm(false);
        setTrigger('');
    };

    return {
        trigger,
        setTrigger,
        showUrgeForm,
        setShowUrgeForm,
        isSaving,
        handleLogUrge,
        handleCancel,
    };
}
