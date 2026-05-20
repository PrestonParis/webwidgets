'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import {
    useFormFillerProfiles,
    useFormFillerJobs,
} from '../hooks/useFormFiller';
import type { FormFillerProfile, FillFormProps, FormFillerJob } from '../types';
import { ProfileEditor } from './ProfileEditor';
import { FillForm } from './FillForm';
import { JobHistory } from './JobHistory';

type Tab = 'profile' | 'fill' | 'history';

const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'fill', label: 'Fill a form' },
    { id: 'history', label: 'History' },
];

interface ProfileTabProps {
    activeProfile: FormFillerProfile | undefined;
    creating: boolean;
    loading: boolean;
    profiles: FormFillerProfile[];
    onCreateProfile: () => void;
    onProfileChange: (profileId: string) => void;
    onSave: (profile: FormFillerProfile) => Promise<void>;
}

interface FillTabProps {
    profiles: FormFillerProfile[];
    onPollJob: FillFormProps['onPollJob'];
    onStartFill: FillFormProps['onStartFill'];
    onShowProfile: () => void;
}

function FormFillerHeader() {
    return (
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                Form Filler
            </h1>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                Store your info once, autofill any web form with Playwright.
            </p>
        </div>
    );
}

function ErrorBanner({ error }: { error: string | null }) {
    if (!error) return null;
    return (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
            {error}
        </div>
    );
}

function TabBar({
    tab,
    onTabChange,
}: {
    tab: Tab;
    onTabChange: (tab: Tab) => void;
}) {
    return (
        <div className="flex gap-1 border-b border-stone-200 dark:border-zinc-800 mb-6">
            {tabs.map(({ id, label }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange(id)}
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
    );
}

function Panel({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm p-6">
            {children}
        </div>
    );
}

function ProfileTab({
    activeProfile,
    creating,
    loading,
    profiles,
    onCreateProfile,
    onProfileChange,
    onSave,
}: ProfileTabProps) {
    if (loading) {
        return (
            <Panel>
                <p className="text-sm text-stone-400 dark:text-zinc-500">
                    Loading…
                </p>
            </Panel>
        );
    }

    if (profiles.length === 0) {
        return (
            <Panel>
                <EmptyProfiles creating={creating} onCreate={onCreateProfile} />
            </Panel>
        );
    }

    return (
        <Panel>
            <ProfileSelector
                activeProfile={activeProfile}
                creating={creating}
                profiles={profiles}
                onCreateProfile={onCreateProfile}
                onProfileChange={onProfileChange}
            />
            {activeProfile && (
                <ProfileEditor
                    profile={activeProfile}
                    onSave={async (profile) => {
                        await onSave(profile);
                    }}
                />
            )}
        </Panel>
    );
}

function EmptyProfiles({
    creating,
    onCreate,
}: {
    creating: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-stone-400 dark:text-zinc-500 text-sm">
                No profiles yet.
            </p>
            <button
                type="button"
                onClick={onCreate}
                disabled={creating}
                className="flex items-center gap-1.5 text-sm font-medium bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 px-4 py-2 rounded-xl disabled:opacity-50"
            >
                <CreateIcon creating={creating} size={14} />
                {creating ? 'Creating…' : 'Create profile'}
            </button>
        </div>
    );
}

function ProfileSelector({
    activeProfile,
    creating,
    profiles,
    onCreateProfile,
    onProfileChange,
}: Omit<ProfileTabProps, 'loading' | 'onSave'>) {
    if (profiles.length <= 1) return null;

    return (
        <div className="flex items-center gap-3 mb-5">
            <select
                value={activeProfile?.id ?? ''}
                onChange={(e) => onProfileChange(e.target.value)}
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
                onClick={onCreateProfile}
                disabled={creating}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 disabled:opacity-50"
            >
                <CreateIcon creating={creating} size={12} />
                {creating ? 'Creating…' : 'New'}
            </button>
        </div>
    );
}

function CreateIcon({ creating, size }: { creating: boolean; size: number }) {
    return creating ? (
        <Loader2 size={size} className="animate-spin" />
    ) : (
        <Plus size={size} />
    );
}

function FillTab({
    profiles,
    onPollJob,
    onStartFill,
    onShowProfile,
}: FillTabProps) {
    return (
        <Panel>
            {profiles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                    <p className="text-sm text-stone-400 dark:text-zinc-500">
                        Create a profile first so there are fields to fill.
                    </p>
                    <button
                        type="button"
                        onClick={onShowProfile}
                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        Go to Profile →
                    </button>
                </div>
            ) : (
                <FillForm
                    profiles={profiles}
                    onStartFill={onStartFill}
                    onPollJob={onPollJob}
                />
            )}
        </Panel>
    );
}

function HistoryTab({
    jobs,
    loading,
}: {
    jobs: FormFillerJob[];
    loading: boolean;
}) {
    return (
        <Panel>
            <JobHistory jobs={jobs} loading={loading} />
        </Panel>
    );
}

export function FormFillerPage() {
    const [tab, setTab] = useState<Tab>('profile');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
        null,
    );

    const profileState = useFormFillerProfiles();
    const jobState = useFormFillerJobs();
    const activeProfile =
        profileState.profiles.find((p) => p.id === selectedProfileId) ??
        profileState.profiles[0];

    const handleCreateProfile = async () => {
        const created = await profileState.create('New profile');
        if (created) setSelectedProfileId(created.id);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <FormFillerHeader />
            <ErrorBanner error={profileState.error} />
            <TabBar tab={tab} onTabChange={setTab} />

            {tab === 'profile' && (
                <ProfileTab
                    activeProfile={activeProfile}
                    creating={profileState.creating}
                    loading={profileState.loading}
                    profiles={profileState.profiles}
                    onCreateProfile={() => {
                        void handleCreateProfile();
                    }}
                    onProfileChange={setSelectedProfileId}
                    onSave={async (profile) => {
                        await profileState.save(profile);
                    }}
                />
            )}

            {tab === 'fill' && (
                <FillTab
                    profiles={profileState.profiles}
                    onStartFill={jobState.startFill}
                    onPollJob={jobState.pollJob}
                    onShowProfile={() => setTab('profile')}
                />
            )}

            {tab === 'history' && (
                <HistoryTab jobs={jobState.jobs} loading={jobState.loading} />
            )}
        </div>
    );
}
