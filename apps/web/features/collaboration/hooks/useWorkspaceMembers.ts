'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MemberRecord, InviteRecord } from '../types/collaboration';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export function useWorkspaceMembers(workspaceId: string) {
    const [members, setMembers] = useState<MemberRecord[]>([]);
    const [invites, setInvites] = useState<InviteRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const membersUrl = `/api/collaboration/workspaces/${workspaceId}/members`;
    const invitesUrl = `/api/collaboration/workspaces/${workspaceId}/invites`;

    const fetchAll = useCallback(async () => {
        if (!workspaceId) {
            setMembers([]);
            setInvites([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [membersData, invitesData] = await Promise.all([
                cachedJson<MemberRecord[]>(membersUrl, { ttlMs: 15_000 }),
                cachedJson<InviteRecord[]>(invitesUrl, { ttlMs: 15_000 }),
            ]);
            setMembers(Array.isArray(membersData) ? membersData : []);
            setInvites(Array.isArray(invitesData) ? invitesData : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [workspaceId, membersUrl, invitesUrl]);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const createInvite = useCallback(
        async (email: string, role: string): Promise<InviteRecord> => {
            const res = await fetch(invitesUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });
            if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(err.error ?? 'Failed to create invite');
            }
            clearCachedJson(invitesUrl);
            const invite = (await res.json()) as InviteRecord;
            setInvites((prev) => [invite, ...prev]);
            return invite;
        },
        [invitesUrl],
    );

    const revokeInvite = useCallback(
        async (inviteId: string): Promise<void> => {
            const res = await fetch(`${invitesUrl}/${inviteId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to revoke invite');
            clearCachedJson(invitesUrl);
            setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        },
        [invitesUrl],
    );

    const changeMemberRole = useCallback(
        async (memberId: string, role: string): Promise<void> => {
            const res = await fetch(`${membersUrl}/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error('Failed to change role');
            clearCachedJson(membersUrl);
            const updated = (await res.json()) as MemberRecord;
            setMembers((prev) =>
                prev.map((m) => (m.id === memberId ? updated : m)),
            );
        },
        [membersUrl],
    );

    const removeMember = useCallback(
        async (memberId: string): Promise<void> => {
            const res = await fetch(`${membersUrl}/${memberId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove member');
            clearCachedJson(membersUrl);
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        },
        [membersUrl],
    );

    const refresh = useCallback(() => {
        clearCachedJson(membersUrl);
        clearCachedJson(invitesUrl);
        void fetchAll();
    }, [fetchAll, membersUrl, invitesUrl]);

    return {
        members,
        invites,
        loading,
        createInvite,
        revokeInvite,
        changeMemberRole,
        removeMember,
        refresh,
    };
}
