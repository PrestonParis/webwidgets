'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import type { InviteRecord } from '../types/collaboration';

interface InviteMemberModalProps {
    open: boolean;
    workspaceId: string;
    onClose: () => void;
    onInvited: (invite: InviteRecord) => void;
}

export function InviteMemberModal({
    open,
    workspaceId,
    onClose,
    onInvited,
}: InviteMemberModalProps) {
    const toast = useToastContext();
    const { createInvite } = useWorkspaceMembers(workspaceId);

    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
    const [submitting, setSubmitting] = useState(false);
    const [createdInvite, setCreatedInvite] = useState<InviteRecord | null>(
        null,
    );
    const [copied, setCopied] = useState(false);

    const inviteUrl = createdInvite
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/collaboration/invite/${createdInvite.token}`
        : '';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setSubmitting(true);
        try {
            const invite = await createInvite(email.trim().toLowerCase(), role);
            setCreatedInvite(invite);
            onInvited(invite);
            toast.success('Invite created successfully.');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to create invite.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link.');
        }
    }

    function handleClose() {
        setEmail('');
        setRole('viewer');
        setCreatedInvite(null);
        setCopied(false);
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            size="md"
            aria-labelledby="invite-modal-title"
        >
            <ModalHeader
                id="invite-modal-title"
                title="Invite member"
                description="Send an invite link to collaborate on this workspace."
                onClose={handleClose}
            />
            <ModalBody>
                {createdInvite ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                Invite created for{' '}
                                <span className="font-semibold">
                                    {createdInvite.email}
                                </span>
                            </p>
                            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                                Role:{' '}
                                <span className="capitalize">
                                    {createdInvite.role}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Invite link
                            </label>
                            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                                <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                                    {inviteUrl}
                                </span>
                                <Button
                                    size="xs"
                                    variant="secondary"
                                    icon={copied ? Check : Copy}
                                    onClick={() => void handleCopy()}
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form
                        id="invite-form"
                        onSubmit={(e) => void handleSubmit(e)}
                        className="space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Email address *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                required
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(
                                        e.target.value as 'editor' | 'viewer',
                                    )
                                }
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            >
                                <option value="viewer">
                                    Viewer: can see workspaces and handoffs
                                </option>
                                <option value="editor">
                                    Editor: can create handoffs and invite
                                    others
                                </option>
                            </select>
                        </div>
                    </form>
                )}
            </ModalBody>
            <ModalFooter>
                {createdInvite ? (
                    <Button onClick={handleClose}>Done</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="invite-form"
                            loading={submitting}
                            disabled={!email.trim()}
                        >
                            Send invite
                        </Button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    );
}
