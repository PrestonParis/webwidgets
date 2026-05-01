import { useState } from 'react';

export function useAddTrackerDrawer(
    onAdd: (addiction: string) => Promise<void>,
    onClose: () => void,
) {
    const [selectedAddiction, setSelectedAddiction] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleClose = () => {
        onClose();
        setSelectedAddiction('');
        setActiveCategory(null);
    };

    const handleAdd = async () => {
        if (!selectedAddiction) return;
        setIsAdding(true);
        await onAdd(selectedAddiction);
        setIsAdding(false);
        setSelectedAddiction('');
        setActiveCategory(null);
        onClose();
    };

    return {
        selectedAddiction,
        setSelectedAddiction,
        activeCategory,
        setActiveCategory,
        isAdding,
        handleAdd,
        handleClose,
    };
}
