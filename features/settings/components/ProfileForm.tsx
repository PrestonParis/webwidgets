'use client';

import { ProfileFormProps } from '@/types/settings';

export default function ProfileForm({
    email,
    fullName,
    saving,
    onNameChange,
    onSave,
}: ProfileFormProps) {
    return (
        <div className="space-y-6 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm text-gray-700 dark:text-zinc-300 mt-1">
                    {email}
                </p>
            </div>

            <div>
                <label className="text-xs text-gray-500">Full name</label>
                <input
                    value={fullName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                    placeholder="Your name"
                />
            </div>

            <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save changes'}
            </button>
        </div>
    );
}
