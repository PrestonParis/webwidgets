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

export const ACTION_REGISTRY_PART_3: ActionRegistryEntry[] = [
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
