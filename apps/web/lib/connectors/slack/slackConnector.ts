import { ProviderError } from '@/lib/connectors/providerError';

// Slack OAuth support is intentionally guarded until SLACK_CLIENT_ID,
// SLACK_CLIENT_SECRET, per-user token storage, and the channels:history,
// im:history, users:read scopes are configured.

export function requireSlack(): never {
    throw new ProviderError(
        'PROVIDER_NOT_CONFIGURED',
        'Slack not configured. See lib/connectors/slack/slackConnector.ts for setup instructions.',
    );
}

export type SlackMessage = {
    id: string;
    channelId: string;
    channelName: string;
    text: string;
    from: string;
    date: string;
    isRead: boolean;
};

export function fetchSlackUnread(_userId: string): Promise<SlackMessage[]> {
    requireSlack();
}
