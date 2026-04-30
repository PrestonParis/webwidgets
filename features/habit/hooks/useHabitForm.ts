import { useState } from 'react';
import { UseHabitFormOptions } from '@/types/habit';

export function useHabitForm({ onAdd }: UseHabitFormOptions) {
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('✅');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await onAdd(newName, newEmoji);
        setNewName('');
        setNewEmoji('✅');
        setAdding(false);
    };

    const handleCancel = () => setAdding(false);
    const openForm = () => setAdding(true);

    return {
        adding,
        newName,
        newEmoji,
        setNewName,
        setNewEmoji,
        handleSubmit,
        handleCancel,
        openForm,
    };
}
