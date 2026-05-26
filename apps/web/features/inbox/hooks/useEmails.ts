'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEmailConnection } from './useEmailConnection';
import { Email } from '@/features/inbox/types/inbox';
import { z } from 'zod';

const emailSchema = z.object({
    id: z.string(),
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
    date: z.string(),
    provider: z.enum(['gmail', 'outlook']).optional(),
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

let gmailCache: EmailsCache | null = null;
let outlookCache: EmailsCache | null = null;

function mergeEmails(gmail: Email[], outlook: Email[]): Email[] {
    const seen = new Set<string>();
    const merged: Email[] = [];
    for (const e of [...gmail, ...outlook]) {
        if (!seen.has(e.id)) {
            seen.add(e.id);
            merged.push(e);
        }
    }
    return merged.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
}

function updateEmailsOptimistically(
    email_id: string,
    category: string,
    setEmails: (updater: (prev: Email[]) => Email[]) => void,
) {
    setEmails((prev) => {
        const updated = prev.map((m) =>
            m.id === email_id ? { ...m, category, is_manual: true } : m,
        );
        if (gmailCache) {
            gmailCache = {
                ...gmailCache,
                emails: gmailCache.emails.map((m) =>
                    m.id === email_id ? { ...m, category, is_manual: true } : m,
                ),
            };
        }
        if (outlookCache) {
            outlookCache = {
                ...outlookCache,
                emails: outlookCache.emails.map((m) =>
                    m.id === email_id ? { ...m, category, is_manual: true } : m,
                ),
            };
        }
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

async function fetchProviderPage(
    provider: 'gmail' | 'outlook',
    token?: string,
): Promise<{ emails: Email[]; nextPageToken: string | null } | null> {
    const base =
        provider === 'gmail' ? '/api/gmail/inbox' : '/api/outlook/inbox';
    const url = token ? `${base}?pageToken=${token}` : base;
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`${provider} inbox fetch failed`);
    const parsed = inboxResponseSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`Invalid ${provider} inbox response`);
    const data = parsed.data;
    const providerEmails = data.emails.map((email) => ({
        ...email,
        provider,
    }));
    const cache = provider === 'gmail' ? gmailCache : outlookCache;
    const existing = token ? (cache?.emails ?? []) : [];
    const existingIds = new Set(existing.map((e) => e.id));
    return {
        emails: [
            ...existing,
            ...providerEmails.filter((e) => !existingIds.has(e.id)),
        ],
        nextPageToken: data.nextPageToken ?? null,
    };
}

export function useEmails() {
    const { user } = useAuth();
    const {
        hasGmail,
        hasMicrosoft,
        hasAny,
        loading: connectionLoading,
    } = useEmailConnection();

    const [emails, setEmails] = useState<Email[]>(() =>
        mergeEmails(gmailCache?.emails ?? [], outlookCache?.emails ?? []),
    );
    const [nextPageToken, setNextPageToken] = useState<string | null>(
        () => gmailCache?.nextPageToken ?? null,
    );
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const inflightKey = useRef<string | null>(null);

    useEffect(() => {
        if (!connectionLoading) {
            setIsUnauthorized(!hasAny);
        }
    }, [hasAny, connectionLoading]);

    useEffect(() => {
        queueMicrotask(() => setIsUnauthorized(!hasAny));
    }, [user?.id, hasAny]);

    const loadEmails = useCallback(
        async (gmailToken?: string) => {
            if (!user || !hasAny || isUnauthorized) return;
            const key = gmailToken ?? '__initial__';
            if (inflightKey.current === key) return;
            inflightKey.current = key;
            setLoading(true);

            try {
                const fetches: Promise<void>[] = [];

                if (hasGmail) {
                    fetches.push(
                        fetchProviderPage('gmail', gmailToken)
                            .then((result) => {
                                if (!result) {
                                    setIsUnauthorized(!hasMicrosoft);
                                    return;
                                }
                                gmailCache = {
                                    emails: result.emails,
                                    nextPageToken: result.nextPageToken,
                                    fetchedAt: Date.now(),
                                };
                                setNextPageToken(result.nextPageToken);
                            })
                            .catch(console.error),
                    );
                }

                if (hasMicrosoft) {
                    fetches.push(
                        fetchProviderPage('outlook')
                            .then((result) => {
                                if (!result) return;
                                outlookCache = {
                                    emails: result.emails,
                                    nextPageToken: null,
                                    fetchedAt: Date.now(),
                                };
                            })
                            .catch(console.error),
                    );
                }

                await Promise.all(fetches);
                setEmails(
                    mergeEmails(
                        gmailCache?.emails ?? [],
                        outlookCache?.emails ?? [],
                    ),
                );
            } finally {
                inflightKey.current = null;
                setLoading(false);
            }
        },
        [user, hasAny, hasGmail, hasMicrosoft, isUnauthorized],
    );

    useEffect(() => {
        if (!user || !hasAny || isUnauthorized || connectionLoading) return;
        const gmailFresh =
            gmailCache !== null &&
            Date.now() - gmailCache.fetchedAt < CACHE_TTL;
        const outlookFresh =
            outlookCache !== null &&
            Date.now() - outlookCache.fetchedAt < CACHE_TTL;
        const allFresh =
            (!hasGmail || gmailFresh) && (!hasMicrosoft || outlookFresh);
        if (!allFresh) {
            queueMicrotask(() => void loadEmails());
        }
    }, [
        user,
        hasAny,
        hasGmail,
        hasMicrosoft,
        loadEmails,
        isUnauthorized,
        connectionLoading,
    ]);

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
        gmailEmails: gmailCache?.emails ?? [],
        outlookEmails: outlookCache?.emails ?? [],
        nextPageToken,
        loading: loading || connectionLoading,
        isUnauthorized: !connectionLoading && !hasAny,
        hasGoogleSync: hasGmail,
        hasMicrosoftSync: hasMicrosoft,
        loadEmails,
        handleManualClassify,
    };
}
