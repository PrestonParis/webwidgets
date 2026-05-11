'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FormFillerProfile, FormFillerJob } from '../types';

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
            const res = await fetch('/api/form-filler/profiles');
            if (res.ok) {
                setProfiles((await res.json()) as FormFillerProfile[]);
            } else {
                const body = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                setError(body.error ?? `Server error ${res.status}`);
            }
        } catch {
            setError('Could not reach server');
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
                const res = await fetch('/api/form-filler/profiles', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: profile.id,
                        name: profile.name,
                        fields: profile.fields,
                    }),
                });
                if (!res.ok) {
                    const body = (await res.json().catch(() => ({}))) as {
                        error?: string;
                    };
                    setError(body.error ?? `Save failed (${res.status})`);
                    return false;
                }
                const updated = (await res.json()) as FormFillerProfile;
                setProfiles((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p)),
                );
                return true;
            } catch {
                setError('Network error — changes not saved');
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
                const res = await fetch('/api/form-filler/profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, fields: {} }),
                });
                if (!res.ok) {
                    const body = (await res.json().catch(() => ({}))) as {
                        error?: string;
                    };
                    setError(
                        body.error ??
                            `Could not create profile (${res.status})`,
                    );
                    return null;
                }
                const created = (await res.json()) as FormFillerProfile;
                setProfiles((prev) => [...prev, created]);
                return created;
            } catch {
                setError('Network error — could not create profile');
                return null;
            } finally {
                setCreating(false);
            }
        },
        [],
    );

    const remove = useCallback(async (id: string) => {
        await fetch(`/api/form-filler/profiles?id=${id}`, { method: 'DELETE' });
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
            const res = await fetch('/api/form-filler/fill');
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
            const res = await fetch('/api/form-filler/fill', {
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
            const res = await fetch(`/api/form-filler/fill?jobId=${jobId}`);
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
