'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/features/ui/components/Button';

interface AcceptInviteButtonProps {
    token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAccept() {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRouteFetch(
                `/api/collaboration/invites/${token}/accept`,
                {
                    method: 'POST',
                },
            );
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(body.error ?? 'Failed to accept invite');
            }
            router.push('/collaboration');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong.',
            );
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                </p>
            )}
            <Button
                fullWidth
                loading={loading}
                onClick={() => void handleAccept()}
            >
                Accept invite
            </Button>
        </div>
    );
}
