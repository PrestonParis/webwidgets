import { SettingsProfileCardProps } from '@/features/settings/types/settings';

export function SettingsProfileCard({
    user,
    fullName,
    saving,
    onNameChange,
    onSave,
}: SettingsProfileCardProps) {
    return (
        <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Profile
            </h2>
            <div>
                <label className="text-xs text-gray-500">Email</label>
                <div className="text-sm text-gray-700 dark:text-zinc-300 mt-1">
                    {user.email}
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500">Full name</label>
                <input
                    value={fullName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                    placeholder="Enter your name"
                />
            </div>
            <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] disabled:opacity-50 transition-colors"
            >
                {saving ? 'Saving...' : 'Save changes'}
            </button>
        </div>
    );
}
