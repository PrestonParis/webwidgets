import { ProviderError } from '@/lib/connectors/providerError';

// TODO: Implement Slack OAuth flow (https://api.slack.com/authentication/oauth-v2).
// Required: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET env vars, per-user token storage.
// Scopes needed: channels:history, im:history, users:read

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

// Placeholder — will throw PROVIDER_NOT_CONFIGURED until OAuth is wired up.
export async function fetchSlackUnread(
    _userId: string,
): Promise<SlackMessage[]> {
    requireSlack();
}
