'use client';

import { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import { InviteMemberModal } from './InviteMemberModal';
import type { CollaborationRole, InviteRecord } from '../types/collaboration';

const roleBadgeStyles: Record<CollaborationRole, string> = {
    owner: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300',
    editor: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
    viewer: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    automation:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
};

function RoleBadge({ role }: { role: CollaborationRole }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
                roleBadgeStyles[role],
            )}
        >
            {role}
        </span>
    );
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

interface MembersPanelProps {
    workspaceId: string;
    currentUserId: string;
    isOwner: boolean;
    isEditor: boolean;
}

export function MembersPanel({
    workspaceId,
    currentUserId,
    isOwner,
    isEditor,
}: MembersPanelProps) {
    const toast = useToastContext();
    const {
        members,
        invites,
        loading,
        changeMemberRole,
        removeMember,
        revokeInvite,
    } = useWorkspaceMembers(workspaceId);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

    async function handleRemove(memberId: string) {
        setRemovingId(memberId);
        try {
            await removeMember(memberId);
            toast.success('Member removed.');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to remove member.',
            );
        } finally {
            setRemovingId(null);
        }
    }

    async function handleRoleChange(memberId: string, role: string) {
        setChangingRoleId(memberId);
        try {
            await changeMemberRole(memberId, role);
            toast.success('Role updated.');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to update role.',
            );
        } finally {
            setChangingRoleId(null);
        }
    }

    async function handleRevokeInvite(inviteId: string) {
        setRevokingId(inviteId);
        try {
            await revokeInvite(inviteId);
            toast.success('Invite revoked.');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to revoke invite.',
            );
        } finally {
            setRevokingId(null);
        }
    }

    function handleInvited(_invite: InviteRecord) {
        // invite already added to state in the hook; just close on next action
    }

    if (loading) {
        return (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading members…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Members ({members.length})
                </h3>
                {(isOwner || isEditor) && (
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        onClick={() => setInviteOpen(true)}
                    >
                        Invite
                    </Button>
                )}
            </div>

            {members.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No members yet.
                </p>
            ) : (
                <ul className="space-y-2">
                    {members.map((member) => {
                        const isSelf = member.user_id === currentUserId;
                        const canRemove = isOwner || isSelf;
                        const canChangeRole = isOwner && !isSelf;
                        const isBeingRemoved = removingId === member.id;
                        const isChangingRole = changingRoleId === member.id;

                        return (
                            <li
                                key={member.id}
                                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {member.email ??
                                            member.user_id ??
                                            'Unknown'}
                                        {isSelf && (
                                            <span className="ml-1.5 text-xs text-zinc-400">
                                                (you)
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Joined {formatDate(member.joined_at)}
                                    </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {canChangeRole ? (
                                        <select
                                            value={member.role}
                                            disabled={isChangingRole}
                                            onChange={(e) =>
                                                void handleRoleChange(
                                                    member.id,
                                                    e.target.value,
                                                )
                                            }
                                            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                        >
                                            <option value="editor">
                                                Editor
                                            </option>
                                            <option value="viewer">
                                                Viewer
                                            </option>
                                            <option value="automation">
                                                Automation
                                            </option>
                                        </select>
                                    ) : (
                                        <RoleBadge role={member.role} />
                                    )}
                                    {canRemove && (
                                        <button
                                            type="button"
                                            disabled={isBeingRemoved}
                                            onClick={() =>
                                                void handleRemove(member.id)
                                            }
                                            aria-label={
                                                isSelf
                                                    ? 'Leave workspace'
                                                    : 'Remove member'
                                            }
                                            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-rose-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {invites.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Pending invites ({invites.length})
                    </h3>
                    <ul className="space-y-2">
                        {invites.map((invite) => {
                            const isRevoking = revokingId === invite.id;
                            return (
                                <li
                                    key={invite.id}
                                    className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                            {invite.email}
                                        </span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Expires{' '}
                                            {formatDate(invite.expires_at)}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <RoleBadge role={invite.role} />
                                        {(isOwner || isEditor) && (
                                            <button
                                                type="button"
                                                disabled={isRevoking}
                                                onClick={() =>
                                                    void handleRevokeInvite(
                                                        invite.id,
                                                    )
                                                }
                                                aria-label="Revoke invite"
                                                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-rose-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <InviteMemberModal
                open={inviteOpen}
                workspaceId={workspaceId}
                onClose={() => setInviteOpen(false)}
                onInvited={handleInvited}
            />
        </div>
    );
}
