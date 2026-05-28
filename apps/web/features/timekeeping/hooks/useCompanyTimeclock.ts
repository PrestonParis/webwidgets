'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
    Company,
    CompanyMembership,
    CompanyRole,
    TimeclockEntry,
} from '@/features/timekeeping/types/companyTimeclock';

interface CompanyRow {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

interface MembershipRow {
    id: string;
    company_id: string;
    user_id: string | null;
    email: string | null;
    role: CompanyRole;
    status: 'active' | 'invited' | 'disabled';
    created_at: string;
    updated_at: string;
}

interface TimeclockRow {
    id: string;
    company_id: string;
    user_id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

function mapCompany(row: CompanyRow): Company {
    return {
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapMembership(row: MembershipRow): CompanyMembership {
    return {
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        email: row.email,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEntry(row: TimeclockRow): TimeclockEntry {
    return {
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        clockInAt: row.clock_in_at,
        clockOutAt: row.clock_out_at,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function useCompanyTimeclock() {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;
    const [companies, setCompanies] = useState<Company[]>([]);
    const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
    const [entries, setEntries] = useState<TimeclockEntry[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedCompany = useMemo(
        () =>
            companies.find((company) => company.id === selectedCompanyId) ??
            null,
        [companies, selectedCompanyId],
    );

    const currentMembership = useMemo(
        () =>
            memberships.find(
                (membership) =>
                    membership.companyId === selectedCompanyId &&
                    membership.userId === userId &&
                    membership.status === 'active',
            ) ?? null,
        [memberships, selectedCompanyId, userId],
    );

    const activeEntry = useMemo(
        () =>
            entries.find(
                (entry) =>
                    entry.companyId === selectedCompanyId &&
                    entry.userId === userId &&
                    entry.clockOutAt === null,
            ) ?? null,
        [entries, selectedCompanyId, userId],
    );

    const companyEntries = useMemo(
        () =>
            selectedCompanyId
                ? entries.filter(
                      (entry) => entry.companyId === selectedCompanyId,
                  )
                : [],
        [entries, selectedCompanyId],
    );

    const canManageMembers =
        currentMembership?.role === 'owner' ||
        currentMembership?.role === 'admin' ||
        currentMembership?.role === 'manager';

    const refetch = useCallback(async () => {
        if (!userId) {
            setCompanies([]);
            setMemberships([]);
            setEntries([]);
            setSelectedCompanyId(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (userEmail) {
                await db
                    .from('company_memberships')
                    .update({ user_id: userId, status: 'active' })
                    .is('user_id', null)
                    .eq('status', 'invited')
                    .ilike('email', userEmail);
            }

            const [
                { data: companyRows, error: companyError },
                { data: membershipRows, error: membershipError },
            ] = await Promise.all([
                db
                    .from('companies')
                    .select('*')
                    .order('created_at', { ascending: true }),
                db
                    .from('company_memberships')
                    .select('*')
                    .order('created_at', { ascending: true }),
            ]);
            if (companyError) throw companyError;
            if (membershipError) throw membershipError;

            const nextCompanies = ((companyRows ?? []) as CompanyRow[]).map(
                mapCompany,
            );
            const nextMemberships = (
                (membershipRows ?? []) as MembershipRow[]
            ).map(mapMembership);
            setCompanies(nextCompanies);
            setMemberships(nextMemberships);

            const nextSelected =
                selectedCompanyId &&
                nextCompanies.some(
                    (company) => company.id === selectedCompanyId,
                )
                    ? selectedCompanyId
                    : (nextCompanies[0]?.id ?? null);
            setSelectedCompanyId(nextSelected);

            if (nextSelected) {
                const { data: entryRows, error: entryError } = await db
                    .from('company_timeclock_entries')
                    .select('*')
                    .eq('company_id', nextSelected)
                    .order('clock_in_at', { ascending: false })
                    .limit(40);
                if (entryError) throw entryError;
                setEntries(((entryRows ?? []) as TimeclockRow[]).map(mapEntry));
            } else {
                setEntries([]);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load timeclock.',
            );
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, userEmail, userId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refetch();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [refetch]);

    const createCompany = useCallback(
        async (name: string) => {
            if (!userId) return;
            const trimmed = name.trim();
            if (!trimmed) return;
            setSaving(true);
            setError(null);
            try {
                const companyResponse = await db
                    .from('companies')
                    .insert({ name: trimmed, owner_id: userId })
                    .select('*')
                    .single();
                const { error: companyError } = companyResponse;
                const companyRow =
                    companyResponse.data as unknown as CompanyRow;
                if (companyError) throw companyError;
                const company = mapCompany(companyRow);

                const { error: membershipError } = await db
                    .from('company_memberships')
                    .insert({
                        company_id: company.id,
                        user_id: userId,
                        email: userEmail,
                        role: 'owner',
                        status: 'active',
                    });
                if (membershipError) throw membershipError;

                setCompanies((prev) => [...prev, company]);
                setSelectedCompanyId(company.id);
                await refetch();
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to create company.',
                );
            } finally {
                setSaving(false);
            }
        },
        [refetch, userEmail, userId],
    );

    const inviteMember = useCallback(
        async (email: string, role: CompanyRole) => {
            if (!selectedCompanyId) return;
            const trimmed = email.trim().toLowerCase();
            if (!trimmed) return;
            setSaving(true);
            setError(null);
            try {
                const { error: inviteError } = await db
                    .from('company_memberships')
                    .insert({
                        company_id: selectedCompanyId,
                        email: trimmed,
                        role,
                        status: 'invited',
                    });
                if (inviteError) throw inviteError;
                await refetch();
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to add member.',
                );
            } finally {
                setSaving(false);
            }
        },
        [refetch, selectedCompanyId],
    );

    const clockIn = useCallback(
        async (notes?: string) => {
            if (!selectedCompanyId || !userId || !currentMembership) return;
            setSaving(true);
            setError(null);
            try {
                const { error: clockError } = await db
                    .from('company_timeclock_entries')
                    .insert({
                        company_id: selectedCompanyId,
                        user_id: userId,
                        notes: notes?.trim() || null,
                    });
                if (clockError) throw clockError;
                await refetch();
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Unable to clock in.',
                );
            } finally {
                setSaving(false);
            }
        },
        [currentMembership, refetch, selectedCompanyId, userId],
    );

    const clockOut = useCallback(async () => {
        if (!activeEntry) return;
        setSaving(true);
        setError(null);
        try {
            const { error: clockError } = await db
                .from('company_timeclock_entries')
                .update({ clock_out_at: new Date().toISOString() })
                .eq('id', activeEntry.id);
            if (clockError) throw clockError;
            await refetch();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Unable to clock out.',
            );
        } finally {
            setSaving(false);
        }
    }, [activeEntry, refetch]);

    return {
        user,
        companies,
        memberships,
        selectedCompany,
        selectedCompanyId,
        setSelectedCompanyId,
        currentMembership,
        entries: companyEntries,
        activeEntry,
        loading,
        saving,
        error,
        canManageMembers,
        refetch,
        createCompany,
        inviteMember,
        clockIn,
        clockOut,
    };
}
