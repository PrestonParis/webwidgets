'use client';
import { useEffect, useRef } from 'react';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

const DRAFT_KEY = 'widget_builder_draft';

export function saveDraft(
    definition: Partial<SynthesizedWidgetDefinition>,
): void {
    try {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ ...definition, _savedAt: Date.now() }),
        );
    } catch {}
}

export function loadDraft(): Partial<SynthesizedWidgetDefinition> | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        // Expire drafts older than 24h
        if (Date.now() - ((parsed._savedAt as number) ?? 0) > 86_400_000) {
            localStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return parsed as Partial<SynthesizedWidgetDefinition>;
    } catch {
        return null;
    }
}

export function clearDraft(): void {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {}
}

export function useWidgetDraftAutosave(
    definition: Partial<SynthesizedWidgetDefinition>,
    isDirty: boolean,
): void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!isDirty) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => saveDraft(definition), 1500);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [definition, isDirty]);
}
