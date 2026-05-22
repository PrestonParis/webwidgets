'use client';

import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    isDangerous?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
    isDangerous = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-sm w-full">
                <div className="p-6">
                    <div className="flex gap-3 items-start">
                        <AlertCircle
                            size={24}
                            className={isDangerous ? 'text-red-500' : 'text-blue-500'}
                        />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                            isDangerous
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                    >
                        {isLoading ? 'Loading...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
