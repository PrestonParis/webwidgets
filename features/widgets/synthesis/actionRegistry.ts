import type { WidgetPermission } from '@/features/platform/types/widgetTypes';

export interface ActionRegistryEntry {
    id: string;
    label: string;
    description: string;
    category: string;
    emoji: string;
    permissions: WidgetPermission[];
    requiresConfirmation: boolean;
    safe: boolean;
    destructiveLevel: 'safe' | 'warning' | 'critical';
    queueability: 'immediate' | 'optional' | 'required';
    provider: string;
    inputSchema: Record<string, string>;
    outputSchema: Record<string, string>;
    supportedContexts: string[];
}

export interface AutomationRegistryEntry {
    id: string;
    label: string;
    description: string;
    triggerType: 'schedule' | 'threshold' | 'event' | 'condition';
    configSchema: Record<string, string>;
    permissions: WidgetPermission[];
    safe: boolean;
}

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

function auto(
    id: string,
    label: string,
    desc: string,
    trigger: AutomationRegistryEntry['triggerType'],
    schema: Record<string, string>,
    perms: WidgetPermission[],
    safe: boolean,
): AutomationRegistryEntry {
    return {
        id,
        label,
        description: desc,
        triggerType: trigger,
        configSchema: schema,
        permissions: perms,
        safe,
    };
}

export const ACTION_REGISTRY: ActionRegistryEntry[] = [
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
    act(
        'data.delete_entry',
        'Delete Entry',
        'Remove a selected item permanently',
        'data',
        '🗑️',
        [],
        true,
        false,
    ),

    // Notifications
    act(
        'notify.send_reminder',
        'Send Reminder',
        'Create a reminder notification for this item',
        'productivity',
        '🔔',
        [],
        false,
        true,
    ),
    act(
        'notify.share_summary',
        'Share Summary',
        'Generate a summary to copy or share',
        'productivity',
        '📋',
        [],
        false,
        true,
    ),
    act(
        'notify.threshold',
        'Set Threshold',
        'Create a threshold alert for this widget',
        'productivity',
        '🚦',
        [],
        false,
        true,
    ),

    // Intelligence
    act(
        'ai.summarize',
        'Summarize',
        'Generate a concise summary from widget records',
        'ai',
        '✨',
        ['ai_analysis'],
        false,
        true,
        { queueability: 'optional', provider: 'unified-action-engine' },
    ),
    act(
        'research.add_item',
        'Add to Research',
        'Send this item to the research queue',
        'knowledge',
        '🔎',
        [],
        false,
        true,
    ),
    act(
        'news.mute_source',
        'Mute Source',
        'Mute a noisy source from this feed',
        'news',
        '🔇',
        [],
        false,
        true,
    ),
    act(
        'briefing.generate',
        'Generate Briefing',
        'Generate a briefing from selected records',
        'ai',
        '🧠',
        ['ai_analysis'],
        false,
        true,
        { queueability: 'optional', provider: 'unified-action-engine' },
    ),

    // Automations
    act(
        'automation.run_rule',
        'Run Automation',
        'Manually trigger an automation rule',
        'automation',
        '⚡',
        ['automation_actions'],
        true,
        true,
    ),
    act(
        'automation.create_rule',
        'Create Automation',
        'Set up a new automation rule from this widget',
        'automation',
        '⚙️',
        ['automation_actions'],
        true,
        true,
    ),
    act(
        'workflow.trigger',
        'Trigger Workflow',
        'Trigger a connected workflow from widget context',
        'automation',
        '🧩',
        ['automation_actions'],
        true,
        true,
        { queueability: 'required' },
    ),

    // API
    act(
        'api.call_endpoint',
        'Call API',
        'Send a request to the configured API endpoint',
        'api',
        '🌐',
        [],
        true,
        false,
    ),
    act(
        'api.refresh_data',
        'Refresh from API',
        'Re-fetch data from the configured API',
        'api',
        '🔁',
        [],
        false,
        true,
    ),
    act(
        'api.custom_action_placeholder',
        'Custom API Action',
        'Placeholder for a safe server-side custom API action',
        'api',
        '🔌',
        ['external_imports'],
        true,
        false,
        { queueability: 'required', provider: 'custom-api' },
    ),
];

export const AUTOMATION_REGISTRY: AutomationRegistryEntry[] = [
    auto(
        'refresh.on_schedule',
        'Refresh on Schedule',
        'Automatically reload data at a set interval',
        'schedule',
        { interval: 'minutes', unit: 'minute|hour|day' },
        [],
        true,
    ),
    auto(
        'alert.threshold_crossed',
        'Alert on Threshold',
        'Send alert when a value crosses a limit',
        'threshold',
        { field: 'string', operator: 'gt|lt|eq', value: 'number' },
        [],
        true,
    ),
    auto(
        'notify.stale_data',
        'Notify if Stale',
        'Alert when no new data has been logged recently',
        'condition',
        { maxAgeHours: 'number' },
        [],
        true,
    ),
    auto(
        'task.create_on_trigger',
        'Create Task on Trigger',
        'Auto-create a to-do task when condition is met',
        'condition',
        { condition: 'string', taskTitle: 'string' },
        ['automation_actions'],
        true,
    ),
    auto(
        'summary.weekly',
        'Weekly Summary',
        'Generate a weekly summary of widget data',
        'schedule',
        { dayOfWeek: 'number', hour: 'number' },
        [],
        true,
    ),
    auto(
        'alert.anomaly',
        'Alert on Anomaly',
        'Detect and flag unusual data patterns',
        'condition',
        { sensitivity: 'low|medium|high' },
        [],
        true,
    ),
    auto(
        'log.recurring',
        'Log on Schedule',
        'Prompt user to log data on a recurring schedule',
        'schedule',
        { interval: 'minutes', message: 'string' },
        [],
        true,
    ),
];

export function getAction(id: string): ActionRegistryEntry | undefined {
    return ACTION_REGISTRY.find((a) => a.id === id);
}

export function getSafeActions(): ActionRegistryEntry[] {
    return ACTION_REGISTRY.filter((a) => a.safe);
}

export function getActionsByCategory(category: string): ActionRegistryEntry[] {
    return ACTION_REGISTRY.filter((a) => a.category === category);
}
