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
    account_email: z.string().optional(),
});
const inboxResponseSchema = z.object({
    emails: z.array(emailSchema).default([]),
    nextPageToken: z.string().nullable().optional(),
    syncing: z.boolean().optional(),
});

const CACHE_TTL = 5 * 60 * 1000;

interface EmailsCache {
    emails: Email[];
    nextPageToken: string | null;
    fetchedAt: number;
}

let gmailCache: EmailsCache | null = null;
let outlookCache: EmailsCache | null = null;

function normalizeSubject(s: string): string {
    return s
        .replace(/^(re|fwd?|fw):\s*/i, '')
        .trim()
        .toLowerCase();
}

function senderKey(sender: string): string {
    const match = /<([^>]+)>/.exec(sender);
    return (match?.[1] ?? sender).toLowerCase().trim();
}

function isCrossProviderDuplicate(a: Email, b: Email): boolean {
    if (normalizeSubject(a.subject) !== normalizeSubject(b.subject))
        return false;
    if (senderKey(a.sender) !== senderKey(b.sender)) return false;
    const diff = Math.abs(
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return diff < 5 * 60 * 1000;
}

function mergeEmails(gmail: Email[], outlook: Email[]): Email[] {
    const matchedOutlookIds = new Set<string>();
    const result: Email[] = [];

    for (const g of gmail) {
        const dup = outlook.find(
            (o) =>
                !matchedOutlookIds.has(o.id) && isCrossProviderDuplicate(g, o),
        );
        if (dup) {
            matchedOutlookIds.add(dup.id);
            result.push({ ...g, providers: ['gmail', 'outlook'] });
        } else {
            result.push({ ...g, providers: ['gmail'] });
        }
    }

    for (const o of outlook) {
        if (!matchedOutlookIds.has(o.id)) {
            result.push({ ...o, providers: ['outlook'] });
        }
    }

    return result.sort(
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
    await supabase.from('email_classifications').upsert(
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
): Promise<{
    emails: Email[];
    nextPageToken: string | null;
    syncing: boolean;
} | null> {
    const base =
        provider === 'gmail' ? '/api/gmail/inbox' : '/api/outlook/inbox';
    const url = token ? `${base}?pageToken=${encodeURIComponent(token)}` : base;
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`${provider} inbox fetch failed`);
    const parsed = inboxResponseSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`Invalid ${provider} inbox response`);
    const data = parsed.data;
    if (data.syncing) return { emails: [], nextPageToken: null, syncing: true };
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
        syncing: false,
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
    const [syncing, setSyncing] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const inflightKey = useRef<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (!connectionLoading) {
                setIsUnauthorized(!hasAny);
            }
        }, 0);
        return () => window.clearTimeout(timeoutId);
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

                let anySyncing = false;

                if (hasGmail) {
                    fetches.push(
                        fetchProviderPage('gmail', gmailToken)
                            .then((result) => {
                                if (!result) {
                                    setIsUnauthorized(!hasMicrosoft);
                                    return;
                                }
                                if (result.syncing) {
                                    anySyncing = true;
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
                                if (result.syncing) {
                                    anySyncing = true;
                                    return;
                                }
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
                setSyncing(anySyncing);
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

    // Poll every 8s while the sync worker is populating email_snapshots.
    // Cap at 5 attempts (~40s total) so the page never loops indefinitely
    // when the sync-worker is unavailable or Redis is down.
    const syncPollCount = useRef(0);
    useEffect(() => {
        if (!syncing || !user || !hasAny) {
            syncPollCount.current = 0;
            return;
        }
        if (syncPollCount.current >= 5) {
            // Give up — stop showing syncing state so the page isn't stuck.
            setSyncing(false);
            return;
        }
        const id = window.setInterval(() => {
            syncPollCount.current += 1;
            void loadEmails();
        }, 8_000);
        return () => window.clearInterval(id);
    }, [syncing, user, hasAny, loadEmails]);

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

    const forceRefresh = useCallback(async () => {
        gmailCache = null;
        outlookCache = null;
        setEmails([]);
        setNextPageToken(null);
        await loadEmails();
    }, [loadEmails]);

    return {
        user,
        emails,
        gmailEmails: gmailCache?.emails ?? [],
        outlookEmails: outlookCache?.emails ?? [],
        nextPageToken,
        loading: loading || connectionLoading,
        syncing,
        isUnauthorized: !connectionLoading && !hasAny,
        hasGoogleSync: hasGmail,
        hasMicrosoftSync: hasMicrosoft,
        loadEmails,
        forceRefresh,
        handleManualClassify,
    };
}
