'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { parseCSV } from '@/features/tracking/lib/import/csvParser';
import { validateAndMap } from '@/features/tracking/lib/import/importValidator';
import { addEntry } from '@/features/tracking/api/trackingApi';
import type {
    ImportStep,
    ImportSummary,
} from '@/features/tracking/types/import';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';

export function useImport(onComplete: (count: number) => void): {
    step: ImportStep;
    file: File | null;
    summary: ImportSummary | null;
    loading: boolean;
    importing: boolean;
    setFile: (f: File) => void;
    parse: () => void;
    confirm: () => Promise<void>;
    reset: () => void;
} {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const parse = useCallback(() => {
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                setLoading(false);
                return;
            }
            const rows = parseCSV(content);
            const result = validateAndMap(rows);
            setSummary(result);
            setStep('preview');
            setLoading(false);
        };
        reader.onerror = () => setLoading(false);
        reader.readAsText(file);
    }, [file]);

    const confirm = useCallback(async () => {
        if (!summary) return;
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setImporting(true);
        setStep('confirm');

        const valid = summary.records.filter(
            (r) => r.issues.length === 0 && r.category && r.entryDate,
        );
        let count = 0;

        for (const record of valid) {
            if (!record.category || !record.entryDate) continue;
            const entry: BaseTrackingEntry = {
                category: record.category,
                entryDate: record.entryDate,
                metadata: record.metadata,
                tags: record.tags,
                source: 'import',
                ...(record.notes !== undefined && { notes: record.notes }),
            };
            try {
                await addEntry(user.id, entry);
                count++;
            } catch (err) {
                console.error(
                    '[useImport] failed to insert row',
                    record.rowIndex,
                    err,
                );
            }
        }

        setImporting(false);
        setStep('done');
        onComplete(count);
    }, [summary, onComplete]);

    const reset = useCallback(() => {
        setStep('upload');
        setFile(null);
        setSummary(null);
        setLoading(false);
        setImporting(false);
    }, []);

    return {
        step,
        file,
        summary,
        loading,
        importing,
        setFile,
        parse,
        confirm,
        reset,
    };
}
