'use client';

import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles } from '@/features/uploads/api/driveApi';
import type { DriveFile } from '@/app/api/drive/files/route';

interface State {
    connected: boolean;
    files: DriveFile[];
    loading: boolean;
}

export function useDriveFiles(query?: string) {
    const [state, setState] = useState<State>({
        connected: false,
        files: [],
        loading: true,
    });

    const fetch = useCallback(async (q?: string) => {
        setState((prev) => ({ ...prev, loading: true }));
        const result = await listDriveFiles(q);
        setState({ ...result, loading: false });
    }, []);

    useEffect(() => {
        void fetch(query);
    }, [query, fetch]);

    return {
        ...state,
        refetch: () => {
            void fetch(query);
        },
    };
}
