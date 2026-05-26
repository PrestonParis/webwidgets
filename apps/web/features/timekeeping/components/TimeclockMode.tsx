'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Building2, Clock3, UserPlus } from 'lucide-react';
import { useCompanyTimeclock } from '@/features/timekeeping/hooks/useCompanyTimeclock';
import type {
    CompanyRole,
    TimeclockEntry,
} from '@/features/timekeeping/types/companyTimeclock';

const ROLE_OPTIONS: CompanyRole[] = ['employee', 'manager', 'admin'];

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDuration(ms: number): string {
    const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

function entryDuration(entry: TimeclockEntry): string {
    const end = entry.clockOutAt
        ? new Date(entry.clockOutAt).getTime()
        : Date.now();
    return formatDuration(end - new Date(entry.clockInAt).getTime());
}

export function TimeclockMode() {
    const [companyName, setCompanyName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberRole, setMemberRole] = useState<CompanyRole>('employee');
    const [clockNotes, setClockNotes] = useState('');
    const {
        companies,
        memberships,
        selectedCompany,
        selectedCompanyId,
        setSelectedCompanyId,
        currentMembership,
        entries,
        activeEntry,
        loading,
        saving,
        error,
        canManageMembers,
        createCompany,
        inviteMember,
        clockIn,
        clockOut,
    } = useCompanyTimeclock();

    const visibleMemberships = useMemo(
        () =>
            selectedCompanyId
                ? memberships.filter(
                      (membership) =>
                          membership.companyId === selectedCompanyId,
                  )
                : [],
        [memberships, selectedCompanyId],
    );

    async function handleCreateCompany(event: FormEvent) {
        event.preventDefault();
        await createCompany(companyName);
        setCompanyName('');
    }

    async function handleInvite(event: FormEvent) {
        event.preventDefault();
        await inviteMember(memberEmail, memberRole);
        setMemberEmail('');
        setMemberRole('employee');
    }

    async function handleClockIn() {
        await clockIn(clockNotes);
        setClockNotes('');
    }

    if (loading) {
        return (
            <div className="w-full space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-12 w-full animate-pulse rounded-xl bg-stone-100 dark:bg-zinc-800"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                        Company
                    </p>
                </div>

                {companies.length > 0 && (
                    <select
                        value={selectedCompanyId ?? ''}
                        onChange={(event) =>
                            setSelectedCompanyId(event.target.value)
                        }
                        className="mb-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                )}

                <form
                    onSubmit={(event) => void handleCreateCompany(event)}
                    className="flex gap-2"
                >
                    <input
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder={
                            companies.length > 0
                                ? 'Create another company'
                                : 'Company name'
                        }
                        className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <button
                        type="submit"
                        disabled={saving || companyName.trim().length === 0}
                        className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        Create
                    </button>
                </form>
            </div>

            {selectedCompany && currentMembership ? (
                <>
                    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                                    {selectedCompany.name}
                                </p>
                                <p className="text-lg font-bold text-stone-900 dark:text-zinc-100">
                                    {activeEntry
                                        ? 'Clocked in'
                                        : 'Ready to clock in'}
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-orange-600 dark:bg-zinc-900 dark:text-orange-300">
                                {currentMembership.role}
                            </span>
                        </div>

                        {activeEntry ? (
                            <div className="space-y-3">
                                <p className="text-sm text-stone-600 dark:text-zinc-300">
                                    Started{' '}
                                    {formatDateTime(activeEntry.clockInAt)} ·{' '}
                                    {entryDuration(activeEntry)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => void clockOut()}
                                    disabled={saving}
                                    className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                                >
                                    Clock out
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    value={clockNotes}
                                    onChange={(event) =>
                                        setClockNotes(event.target.value)
                                    }
                                    placeholder="Shift note (optional)"
                                    className="w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-orange-900/50 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleClockIn()}
                                    disabled={saving}
                                    className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    Clock in
                                </button>
                            </div>
                        )}
                    </div>

                    {canManageMembers && (
                        <div className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-3 flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-orange-500" />
                                <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                                    Members
                                </p>
                            </div>
                            <form
                                onSubmit={(event) => void handleInvite(event)}
                                className="mb-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                            >
                                <input
                                    type="email"
                                    value={memberEmail}
                                    onChange={(event) =>
                                        setMemberEmail(event.target.value)
                                    }
                                    placeholder="employee@example.com"
                                    className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                                <select
                                    value={memberRole}
                                    onChange={(event) =>
                                        setMemberRole(
                                            event.target.value as CompanyRole,
                                        )
                                    }
                                    className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    {ROLE_OPTIONS.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        memberEmail.trim().length === 0
                                    }
                                    className="rounded-xl border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-600 disabled:opacity-50 dark:border-orange-900 dark:text-orange-300"
                                >
                                    Add
                                </button>
                            </form>
                            <div className="space-y-2">
                                {visibleMemberships.map((membership) => (
                                    <div
                                        key={membership.id}
                                        className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs dark:bg-zinc-800/70"
                                    >
                                        <span className="truncate text-stone-700 dark:text-zinc-200">
                                            {membership.email ??
                                                membership.userId ??
                                                'Member'}
                                        </span>
                                        <span className="shrink-0 capitalize text-stone-400 dark:text-zinc-500">
                                            {membership.role} ·{' '}
                                            {membership.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-orange-500" />
                            <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                                Recent shifts
                            </p>
                        </div>
                        {entries.length === 0 ? (
                            <p className="text-xs text-stone-400 dark:text-zinc-500">
                                No shifts logged for this company yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {entries.slice(0, 8).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-xl bg-stone-50 px-3 py-2 text-xs dark:bg-zinc-800/70"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-stone-700 dark:text-zinc-200">
                                                {formatDateTime(
                                                    entry.clockInAt,
                                                )}
                                            </span>
                                            <span className="text-stone-400 dark:text-zinc-500">
                                                {entryDuration(entry)}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-stone-400 dark:text-zinc-500">
                                            {entry.clockOutAt
                                                ? `Out ${formatDateTime(entry.clockOutAt)}`
                                                : 'Open shift'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="rounded-2xl border border-dashed border-stone-200 p-5 text-center dark:border-zinc-800">
                    <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                        Create or join a company to use the timeclock.
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-zinc-500">
                        Employees can only clock in when their company
                        membership is active.
                    </p>
                </div>
            )}

            {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}
