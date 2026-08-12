import { Briefcase, BookOpen, Cpu, Heart, type LucideIcon } from 'lucide-react';
import type { ContextEntry, ContextEntryType } from '@/features/context/types/context';
import type { WidgetType } from '@/features/dashboard/types/dashboard';

export type ContextLayer = 'personal' | 'productivity' | 'knowledge' | 'system';

export const LAYER_ORDER: ContextLayer[] = [
    'personal',
    'productivity',
    'knowledge',
    'system',
];

export const LAYER_META: Record<
    ContextLayer,
    { label: string; color: string; icon: LucideIcon }
> = {
    personal: { label: 'Personal', color: '#ec4899', icon: Heart },
    productivity: { label: 'Productivity', color: '#3b82f6', icon: Briefcase },
    knowledge: { label: 'Knowledge', color: '#f59e0b', icon: BookOpen },
    system: { label: 'System', color: '#8b5cf6', icon: Cpu },
};

// `profile` is handled separately as the graph root and intentionally excluded.
// `widget` is resolved via WIDGET_TYPE_LAYER, not this table.
export const ENTRY_TYPE_LAYER: Partial<Record<ContextEntryType, ContextLayer>> = {
    goal: 'personal',
    journal_entry: 'personal',
    mood_entry: 'personal',
    habit_entry: 'personal',
    recovery_entry: 'personal',

    project: 'productivity',
    file: 'productivity',
    document: 'productivity',
    artifact: 'productivity',
    email: 'productivity',
    calendar_event: 'productivity',
    todo: 'productivity',

    recommendation: 'knowledge',
    insight: 'knowledge',

    widget_activity: 'system',
    chat: 'system',
    chat_gist: 'system',
    automation: 'system',
    automation_run: 'system',
    integration: 'system',
    query_gist: 'system',
    memory: 'system',
    agent_action: 'system',
    import_export_object: 'system',
};

// Exhaustive over every WidgetType. A few placements are judgment calls with no
// explicit spec (e.g. games/utility/ambient widgets -> knowledge) — flagged here
// rather than silently guessed, since there's no strong signal either way.
export const WIDGET_TYPE_LAYER: Record<WidgetType, ContextLayer> = {
    // personal
    texteditor: 'personal',
    recovery: 'personal',
    'recovery-empty': 'personal',
    habit: 'personal',
    mood: 'personal',
    journal: 'personal',
    notes: 'personal',
    tracking: 'personal',
    'tracking-sleep': 'personal',
    'tracking-workout': 'personal',
    'tracking-meal': 'personal',
    'tracking-mood': 'personal',
    'tracking-supplements': 'personal',
    'tracking-health': 'personal',

    // productivity
    email: 'productivity',
    countdown: 'productivity',
    timekeeping: 'productivity',
    'employee-clock': 'productivity',
    timer: 'productivity',
    stopwatch: 'productivity',
    pomodoro: 'productivity',
    todo: 'productivity',
    calendar: 'productivity',
    'form-filler': 'productivity',
    scratchpad: 'productivity',
    files: 'productivity',
    view: 'productivity',
    folder: 'productivity',
    'action-cards': 'productivity',

    // knowledge
    'research-queue': 'knowledge',
    converter: 'knowledge',
    currency: 'knowledge',
    chess: 'knowledge',
    weather: 'knowledge',
    worldclock: 'knowledge',
    finance: 'knowledge',
    news: 'knowledge',
    reading: 'knowledge',
    creative: 'knowledge',
    'insight-cards': 'knowledge',
    calculator: 'knowledge',

    // system
    activity: 'system',
    automation: 'system',
    developer: 'system',
    datahealth: 'system',
    'context-diagram': 'system',
    chat: 'system',
    'widget-builder': 'system',
    collaboration: 'system',
    'command-center': 'system',
    accessibility: 'system',
    memorization: 'system',
    synthesized: 'system',
};

export function resolveWidgetType(entry: ContextEntry): WidgetType | undefined {
    const fromData = entry.data?.widgetType;
    if (typeof fromData === 'string') return fromData as WidgetType;
    const match = entry.entityId.match(/^widget-(.+)$/);
    return match ? (match[1] as WidgetType) : undefined;
}

export function getWidgetLayer(widgetType: WidgetType): ContextLayer {
    return WIDGET_TYPE_LAYER[widgetType] ?? 'productivity';
}

export function getEntryLayer(entry: ContextEntry): ContextLayer | 'root' {
    if (entry.entryType === 'profile') return 'root';
    if (entry.entryType === 'widget') {
        const widgetType = resolveWidgetType(entry);
        return widgetType ? getWidgetLayer(widgetType) : 'system';
    }
    return ENTRY_TYPE_LAYER[entry.entryType] ?? 'system';
}
