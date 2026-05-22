'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FormFillerProfile, FormFillerJob } from '../types';

const PROFILES_API = '/api/form-filler/profiles';
const FILL_API = '/api/form-filler/fill';

async function readError(res: Response, fallback: string): Promise<string> {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return body.error ?? fallback;
}

async function fetchProfiles(): Promise<FormFillerProfile[]> {
    const res = await fetch(PROFILES_API);
    if (!res.ok)
        throw new Error(await readError(res, `Server error ${res.status}`));
    return (await res.json()) as FormFillerProfile[];
}

async function patchProfile(
    profile: FormFillerProfile,
): Promise<FormFillerProfile> {
    const res = await fetch(PROFILES_API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: profile.id,
            name: profile.name,
            fields: profile.fields,
        }),
    });
    if (!res.ok)
        throw new Error(await readError(res, `Save failed (${res.status})`));
    return (await res.json()) as FormFillerProfile;
}

async function postProfile(name: string): Promise<FormFillerProfile> {
    const res = await fetch(PROFILES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fields: {} }),
    });
    if (!res.ok)
        throw new Error(
            await readError(res, `Could not create profile (${res.status})`),
        );
    return (await res.json()) as FormFillerProfile;
}

export function useFormFillerProfiles() {
    const [profiles, setProfiles] = useState<FormFillerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setProfiles(await fetchProfiles());
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Could not reach server',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = setTimeout(() => {
            void load();
        }, 0);
        return () => clearTimeout(id);
    }, [load]);

    const save = useCallback(
        async (profile: FormFillerProfile): Promise<boolean> => {
            setSaving(true);
            setError(null);
            try {
                const updated = await patchProfile(profile);
                setProfiles((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p)),
                );
                return true;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Network error — changes not saved',
                );
                return false;
            } finally {
                setSaving(false);
            }
        },
        [],
    );

    const create = useCallback(
        async (name: string): Promise<FormFillerProfile | null> => {
            setCreating(true);
            setError(null);
            try {
                const created = await postProfile(name);
                setProfiles((prev) => [...prev, created]);
                return created;
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Network error — could not create profile',
                );
                return null;
            } finally {
                setCreating(false);
            }
        },
        [],
    );

    const remove = useCallback(async (id: string) => {
        await fetch(`${PROFILES_API}?id=${id}`, { method: 'DELETE' });
        setProfiles((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return {
        profiles,
        loading,
        error,
        saving,
        creating,
        save,
        create,
        remove,
        reload: load,
    };
}

export function useFormFillerJobs() {
    const [jobs, setJobs] = useState<FormFillerJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(FILL_API);
            if (res.ok) {
                setJobs((await res.json()) as FormFillerJob[]);
            } else {
                const body = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                setError(body.error ?? `Server error ${res.status}`);
            }
        } catch {
            setError('Could not load job history');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = setTimeout(() => {
            void load();
        }, 0);
        return () => clearTimeout(id);
    }, [load]);

    const startFill = useCallback(
        async (url: string, profileId: string): Promise<string | null> => {
            const res = await fetch(FILL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, profileId }),
            });
            if (!res.ok) return null;
            const { jobId } = (await res.json()) as { jobId: string };
            setJobs((prev) => [
                {
                    id: jobId,
                    user_id: '',
                    profile_id: profileId,
                    url,
                    status: 'pending',
                    fields_filled: null,
                    screenshot: null,
                    error: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                ...prev,
            ]);
            return jobId;
        },
        [],
    );

    const pollJob = useCallback(
        async (jobId: string): Promise<FormFillerJob | undefined> => {
            const res = await fetch(`${FILL_API}?jobId=${jobId}`);
            if (!res.ok) return undefined;
            const job = (await res.json()) as FormFillerJob;
            setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, ...job } : j)),
            );
            return job;
        },
        [],
    );

    return { jobs, loading, error, startFill, pollJob, reload: load };
}
