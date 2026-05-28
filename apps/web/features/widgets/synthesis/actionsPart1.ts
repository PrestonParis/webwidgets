import type { WidgetPermission } from '@/features/platform/types/widget';
import type { ActionRegistryEntry } from '../types/synthesisActions';

function act(
    id: string,
    label: string,
    desc: string,
    cat: string,
    emoji: string,
    perms: WidgetPermission[],
    confirm: boolean,
    safe: boolean,
    extras: Partial<
        Pick<
            ActionRegistryEntry,
            | 'destructiveLevel'
            | 'queueability'
            | 'provider'
            | 'inputSchema'
            | 'outputSchema'
            | 'supportedContexts'
        >
    > = {},
): ActionRegistryEntry {
    return {
        id,
        label,
        description: desc,
        category: cat,
        emoji,
        permissions: perms,
        requiresConfirmation: confirm,
        safe,
        destructiveLevel:
            extras.destructiveLevel ?? (safe ? 'safe' : 'warning'),
        queueability: extras.queueability ?? 'immediate',
        provider: extras.provider ?? 'local',
        inputSchema: extras.inputSchema ?? {},
        outputSchema: extras.outputSchema ?? { accepted: 'boolean' },
        supportedContexts: extras.supportedContexts ?? [
            'dashboard',
            'page',
            'custom-widget',
        ],
    };
}

export const ACTION_REGISTRY_PART_1: ActionRegistryEntry[] = [
    // Navigation
    act(
        'nav.open_full_page',
        'Open Full Page',
        'Navigate to the full-page view for this widget',
        'navigation',
        '↗️',
        [],
        false,
        true,
    ),
    act(
        'nav.open_detail',
        'Open Detail',
        'Open a detail drawer or modal for the selected item',
        'navigation',
        '🔍',
        [],
        false,
        true,
    ),
    // Data creation
    act(
        'data.create_transaction',
        'Log Transaction',
        'Create a new finance transaction entry',
        'finance',
        '💸',
        ['finance_data'],
        true,
        true,
    ),
    act(
        'data.create_tracking_entry',
        'Log Tracking Entry',
        'Record a new tracking data point',
        'tracking',
        '📊',
        ['tracking_sensitive'],
        false,
        true,
    ),
    act(
        'data.create_note',
        'Create Note',
        'Open a new note or document',
        'knowledge',
        '📝',
        [],
        false,
        true,
    ),
    act(
        'data.add_calendar_event',
        'Add Event',
        'Create a new calendar event',
        'calendar',
        '📅',
        [],
        true,
        true,
    ),
    act(
        'data.add_task',
        'Add Task',
        'Create a task in the to-do system',
        'productivity',
        '✅',
        [],
        false,
        true,
    ),
    act(
        'data.log_manual_value',
        'Log Value',
        'Manually enter a data value for this widget',
        'custom',
        '✏️',
        [],
        false,
        true,
    ),
    // Data mutation
    act(
        'data.refresh',
        'Refresh Data',
        'Reload data from the source',
        'data',
        '🔄',
        [],
        false,
        true,
    ),
    act(
        'data.save_bookmark',
        'Save / Bookmark',
        'Save this item for later review',
        'data',
        '🔖',
        [],
        false,
        true,
    ),
    act(
        'data.dismiss',
        'Dismiss',
        'Hide or acknowledge this item',
        'data',
        '✓',
        [],
        false,
        true,
    ),
    act(
        'data.export',
        'Export Data',
        'Export widget data as CSV or JSON',
        'data',
        '📤',
        [],
        true,
        true,
    ),
];
