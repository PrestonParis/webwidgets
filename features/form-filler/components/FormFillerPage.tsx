'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import {
    useFormFillerProfiles,
    useFormFillerJobs,
} from '../hooks/useFormFiller';
import { ProfileEditor } from './ProfileEditor';
import { FillForm } from './FillForm';
import { JobHistory } from './JobHistory';

type Tab = 'profile' | 'fill' | 'history';

export function FormFillerPage() {
    const [tab, setTab] = useState<Tab>('profile');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
        null,
    );

    const {
        profiles,
        loading: profilesLoading,
        error,
        creating,
        save,
        create,
    } = useFormFillerProfiles();
    const {
        jobs,
        loading: jobsLoading,
        startFill,
        pollJob,
    } = useFormFillerJobs();

    const activeProfile =
        profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];

    const handleCreateProfile = async () => {
        const created = await create('New profile');
        if (created) setSelectedProfileId(created.id);
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'fill', label: 'Fill a form' },
        { id: 'history', label: 'History' },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Form Filler
                </h1>
                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                    Store your info once, autofill any web form with Playwright.
                </p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-stone-200 dark:border-zinc-800 mb-6">
                {tabs.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === id
                                ? 'border-stone-900 dark:border-amber-400 text-stone-900 dark:text-zinc-100'
                                : 'border-transparent text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Profile tab */}
            {tab === 'profile' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm p-6">
                    {profilesLoading ? (
                        <p className="text-sm text-stone-400 dark:text-zinc-500">
                            Loading…
                        </p>
                    ) : profiles.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <p className="text-stone-400 dark:text-zinc-500 text-sm">
                                No profiles yet.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    void handleCreateProfile();
                                }}
                                disabled={creating}
                                className="flex items-center gap-1.5 text-sm font-medium bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 px-4 py-2 rounded-xl disabled:opacity-50"
                            >
                                {creating ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Plus size={14} />
                                )}
                                {creating ? 'Creating…' : 'Create profile'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Profile selector if multiple */}
                            {profiles.length > 1 && (
                                <div className="flex items-center gap-3 mb-5">
                                    <select
                                        value={activeProfile?.id ?? ''}
                                        onChange={(e) =>
                                            setSelectedProfileId(e.target.value)
                                        }
                                        className="text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none"
                                    >
                                        {profiles.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleCreateProfile();
                                        }}
                                        disabled={creating}
                                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 disabled:opacity-50"
                                    >
                                        {creating ? (
                                            <Loader2
                                                size={12}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Plus size={12} />
                                        )}
                                        {creating ? 'Creating…' : 'New'}
                                    </button>
                                </div>
                            )}
                            {activeProfile && (
                                <ProfileEditor
                                    profile={activeProfile}
                                    onSave={async (p) => {
                                        await save(p);
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Fill tab */}
            {tab === 'fill' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm p-6">
                    {profiles.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <p className="text-sm text-stone-400 dark:text-zinc-500">
                                Create a profile first so there are fields to
                                fill.
                            </p>
                            <button
                                type="button"
                                onClick={() => setTab('profile')}
                                className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                Go to Profile →
                            </button>
                        </div>
                    ) : (
                        <FillForm
                            profiles={profiles}
                            onStartFill={startFill}
                            onPollJob={pollJob}
                        />
                    )}
                </div>
            )}

            {/* History tab */}
            {tab === 'history' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm p-6">
                    <JobHistory jobs={jobs} loading={jobsLoading} />
                </div>
            )}
        </div>
    );
}
