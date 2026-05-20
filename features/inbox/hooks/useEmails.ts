'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Email } from '@/features/inbox/types/inbox';
import { z } from 'zod';

const emailSchema = z.object({
    id: z.string(),
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
    date: z.string(),
    category: z.string().optional(),
    is_manual: z.boolean().optional(),
});
const inboxResponseSchema = z.object({
    emails: z.array(emailSchema).default([]),
    nextPageToken: z.string().nullable().optional(),
});

const CACHE_TTL = 5 * 60 * 1000;
interface EmailsCache {
    emails: Email[];
    nextPageToken: string | null;
    fetchedAt: number;
}
let cache: EmailsCache | null = null;

function updateEmailsOptimistically(
    email_id: string,
    category: string,
    setEmails: (updater: (prev: Email[]) => Email[]) => void,
) {
    setEmails((prev) => {
        const updated = prev.map((m) =>
            m.id === email_id ? { ...m, category, is_manual: true } : m,
        );
        if (cache) cache = { ...cache, emails: updated };
        return updated;
    });
}

async function persistClassification(
    userId: string,
    email_id: string,
    category: string,
    sender: string,
    subject: string,
) {
    await supabase
        .from('email_classifications')
        .upsert(
            {
                user_id: userId,
                email_id,
                category,
                sender,
                subject,
                is_manual: true,
            },
            { onConflict: 'user_id,email_id' },
        );
}

async function fetchInboxPage(
    token?: string,
): Promise<{ emails: Email[]; nextPageToken: string | null } | null> {
    const url = token
        ? `/api/gmail/inbox?pageToken=${token}`
        : '/api/gmail/inbox';
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error('Inbox API Fail');
    const parsed = inboxResponseSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error('Invalid inbox API response');
    const data = parsed.data;
    const existing = token ? (cache?.emails ?? []) : [];
    const existingIds = new Set(existing.map((e) => e.id));
    return {
        emails: [
            ...existing,
            ...data.emails.filter((e) => !existingIds.has(e.id)),
        ],
        nextPageToken: data.nextPageToken ?? null,
    };
}

export function useEmails() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>(() => cache?.emails ?? []);
    const [nextPageToken, setNextPageToken] = useState<string | null>(
        () => cache?.nextPageToken ?? null,
    );
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const inflightKey = useRef<string | null>(null);
    const hasGoogleSync =
        user?.identities?.some((id) => id.provider === 'google') ?? false;

    // Reset unauthorized flag when user identity changes so reconnect works without reload
    useEffect(() => {
        queueMicrotask(() => setIsUnauthorized(false));
    }, [user?.id]);

    const loadEmails = useCallback(
        async (token?: string) => {
            if (!user || !hasGoogleSync || isUnauthorized) return;
            const key = token ?? '__initial__';
            if (inflightKey.current === key) return;
            inflightKey.current = key;
            setLoading(true);
            try {
                const result = await fetchInboxPage(token);
                if (!result) {
                    setIsUnauthorized(true);
                    return;
                }
                cache = {
                    emails: result.emails,
                    nextPageToken: result.nextPageToken,
                    fetchedAt: Date.now(),
                };
                setEmails(result.emails);
                setNextPageToken(result.nextPageToken);
            } catch (err) {
                console.error(err);
            } finally {
                inflightKey.current = null;
                setLoading(false);
            }
        },
        [user, hasGoogleSync, isUnauthorized],
    );

    useEffect(() => {
        if (!user || !hasGoogleSync || isUnauthorized) return;
        const isFresh =
            cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL;
        if (!isFresh)
            queueMicrotask(() => {
                void loadEmails();
            });
    }, [user, hasGoogleSync, loadEmails, isUnauthorized]);

    const handleManualClassify = async (
        email_id: string,
        category: string,
        sender: string,
        subject: string,
    ) => {
        if (!user?.id) return;
        updateEmailsOptimistically(email_id, category, setEmails);
        await persistClassification(
            user.id,
            email_id,
            category,
            sender,
            subject,
        );
    };

    return {
        user,
        emails,
        nextPageToken,
        loading,
        isUnauthorized,
        hasGoogleSync,
        loadEmails,
        handleManualClassify,
    };
}
