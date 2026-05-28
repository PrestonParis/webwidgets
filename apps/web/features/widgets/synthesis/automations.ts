import type { WidgetPermission } from '@/features/platform/types/widgetTypes';
import type { AutomationRegistryEntry } from './actionTypes';

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
