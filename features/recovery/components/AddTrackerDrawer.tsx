'use client';

import { AddTrackerDrawerProps } from '@/features/recovery/types/recovery';
import { useAddTrackerDrawer } from '@/features/recovery/hooks/useAddTrackerDrawer';
import { AddictionPicker } from './AddictionPicker';

export default function AddTrackerDrawer({
    isOpen,
    onClose,
    onAdd,
    existingTrackers,
}: AddTrackerDrawerProps) {
    const {
        selectedAddiction,
        setSelectedAddiction,
        activeCategory,
        setActiveCategory,
        isAdding,
        handleAdd,
        handleClose,
    } = useAddTrackerDrawer(onAdd, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div
                className="absolute inset-0 bg-black/20"
                onClick={handleClose}
            />

            <div className="relative z-50 w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-xl flex flex-col">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-zinc-100">
                            Add a tracker
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            Pick a category then choose what to track
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <AddictionPicker
                        existingTrackers={existingTrackers}
                        activeCategory={activeCategory}
                        selectedAddiction={selectedAddiction}
                        onCategoryChange={(cat) => {
                            setActiveCategory(cat);
                            setSelectedAddiction('');
                        }}
                        onSelect={setSelectedAddiction}
                    />
                </div>

                <div className="px-6 py-5 border-t border-gray-100 dark:border-zinc-800">
                    {selectedAddiction && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 text-center">
                            Selected:{' '}
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                                {selectedAddiction}
                            </span>
                        </p>
                    )}
                    <button
                        onClick={handleAdd}
                        disabled={!selectedAddiction || isAdding}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                    >
                        {isAdding
                            ? 'Adding...'
                            : selectedAddiction
                              ? `Start tracking ${selectedAddiction}`
                              : 'Choose something to track'}
                    </button>
                </div>
            </div>
        </div>
    );
}
