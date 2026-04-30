'use client';
import { SignOutModalProps } from '@/types/ui';

export default function SignOutModal({
    loading,
    onCancel,
    onConfirm,
}: SignOutModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Sign out
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                    Are you sure you want to sign out?
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        {loading ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
