export type ConnectMethod = 'oauth' | 'api_key';
export type ProviderGroup =
    | 'google'
    | 'microsoft'
    | 'developer'
    | 'productivity'
    | 'finance'
    | 'gaming'
    | 'ai';

export interface IntegrationProvider {
    id: string;
    name: string;
    description: string;
    group: ProviderGroup;
    groupLabel: string;
    connectMethod: ConnectMethod;
    keyPlaceholder?: string;
    keyLabel?: string;
    comingSoon?: boolean;
    beta?: boolean;
    oauthScopes?: string[];
    tokenFlag?: string;
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
    // Google
    {
        id: 'gmail',
        name: 'Gmail',
        description: 'Read inbox, detect action items, AI triage.',
        group: 'google',
        groupLabel: 'Google Workspace',
        connectMethod: 'oauth',
        tokenFlag: 'gmail',
        oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    },
    {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Sync events and show them on your dashboard.',
        group: 'google',
        groupLabel: 'Google Workspace',
        connectMethod: 'oauth',
        tokenFlag: 'calendar',
        oauthScopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.events',
        ],
    },
    {
        id: 'google_drive',
        name: 'Google Drive',
        description: 'Browse files and surface recent documents.',
        group: 'google',
        groupLabel: 'Google Workspace',
        connectMethod: 'oauth',
        tokenFlag: 'drive',
        comingSoon: true,
    },
    // Microsoft
    {
        id: 'outlook',
        name: 'Outlook',
        description: 'Read Outlook inbox alongside Gmail.',
        group: 'microsoft',
        groupLabel: 'Microsoft 365',
        connectMethod: 'oauth',
        tokenFlag: 'microsoft',
    },
    {
        id: 'outlook_calendar',
        name: 'Outlook Calendar',
        description: 'Merge Outlook events with your calendar view.',
        group: 'microsoft',
        groupLabel: 'Microsoft 365',
        connectMethod: 'oauth',
        tokenFlag: 'microsoft',
        comingSoon: true,
    },
    // Developer
    {
        id: 'github',
        name: 'GitHub',
        description: 'Track open PRs and issues across your repos.',
        group: 'developer',
        groupLabel: 'Developer',
        connectMethod: 'api_key',
        keyLabel: 'Personal Access Token',
        keyPlaceholder: 'ghp_...',
        beta: true,
    },
    {
        id: 'linear',
        name: 'Linear',
        description: 'See your assigned issues and in-progress work.',
        group: 'developer',
        groupLabel: 'Developer',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'lin_api_...',
        beta: true,
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Embed databases and pages in your workspace.',
        group: 'developer',
        groupLabel: 'Developer',
        connectMethod: 'api_key',
        keyLabel: 'Integration Token',
        keyPlaceholder: 'ntn_...',
        comingSoon: true,
    },
    // Productivity
    {
        id: 'readwise',
        name: 'Readwise',
        description: 'Surface daily highlights from your reading.',
        group: 'productivity',
        groupLabel: 'Productivity',
        connectMethod: 'api_key',
        keyLabel: 'Access Token',
        keyPlaceholder: 'your_readwise_token',
        comingSoon: true,
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Get unread counts and surface important messages.',
        group: 'productivity',
        groupLabel: 'Productivity',
        connectMethod: 'api_key',
        keyLabel: 'Bot Token',
        keyPlaceholder: 'xoxb-...',
        comingSoon: true,
    },
    // Finance
    {
        id: 'plaid',
        name: 'Plaid',
        description: 'Connect bank accounts for spending insights.',
        group: 'finance',
        groupLabel: 'Finance',
        connectMethod: 'api_key',
        keyLabel: 'Client ID + Secret',
        keyPlaceholder: 'client_id:secret',
        comingSoon: true,
    },
    {
        id: 'finnhub',
        name: 'Finnhub',
        description: 'Real-time stock quotes and market data.',
        group: 'finance',
        groupLabel: 'Finance',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'c...',
    },
    {
        id: 'alpha_vantage',
        name: 'Alpha Vantage',
        description: 'Historical stock data and forex rates.',
        group: 'finance',
        groupLabel: 'Finance',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'your_alphavantage_key',
    },
    // Gaming
    {
        id: 'lichess',
        name: 'Lichess',
        description: 'Track rating, recent games, and puzzles.',
        group: 'gaming',
        groupLabel: 'Gaming',
        connectMethod: 'api_key',
        keyLabel: 'Personal Access Token',
        keyPlaceholder: 'lip_...',
    },
    // AI Models
    {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Power AI email triage and chat with Claude.',
        group: 'ai',
        groupLabel: 'AI Models',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'sk-ant-...',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'Use GPT models for AI-powered features.',
        group: 'ai',
        groupLabel: 'AI Models',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'sk-...',
    },
    {
        id: 'gemini',
        name: 'Gemini',
        description: "Use Google's Gemini models for AI features.",
        group: 'ai',
        groupLabel: 'AI Models',
        connectMethod: 'api_key',
        keyLabel: 'API Key',
        keyPlaceholder: 'AIza...',
    },
];

export const GROUP_ORDER: ProviderGroup[] = [
    'google',
    'microsoft',
    'developer',
    'productivity',
    'finance',
    'gaming',
    'ai',
];

export function groupedProviders(): {
    group: ProviderGroup;
    label: string;
    providers: IntegrationProvider[];
}[] {
    return GROUP_ORDER.map((group) => {
        const providers = INTEGRATION_PROVIDERS.filter(
            (p) => p.group === group,
        );
        return { group, label: providers[0]?.groupLabel ?? group, providers };
    }).filter((g) => g.providers.length > 0);
}
