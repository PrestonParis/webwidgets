'use client';

import { useCallback, useEffect, useState } from 'react';
import { listOneDriveFiles } from '@/features/uploads/api/oneDriveApi';
import type { OneDriveFile } from '@/app/api/onedrive/files/route';

interface State {
    connected: boolean;
    files: OneDriveFile[];
    loading: boolean;
    error?: string;
}

export function useOneDriveFiles(query?: string) {
    const [state, setState] = useState<State>({
        connected: false,
        files: [],
        loading: true,
    });
    const load = useCallback(async (value?: string) => {
        setState((current) => ({ ...current, loading: true }));
        const result = await listOneDriveFiles(value);
        setState({ ...result, loading: false });
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => void load(query), 200);
        return () => window.clearTimeout(timer);
    }, [load, query]);

    return { ...state, refetch: () => void load(query) };
}
