import type { WidgetPermission } from '@/features/platform/types/widgetTypes';
import type { ActionRegistryEntry } from './actionTypes';

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

export const ACTION_REGISTRY_PART_2: ActionRegistryEntry[] = [
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
];
