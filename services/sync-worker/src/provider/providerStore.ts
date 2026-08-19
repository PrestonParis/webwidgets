import type { SupabaseClient } from '@supabase/supabase-js';
import { ProviderTimelineStore } from './providerTimelineStore.js';
import type {
    ProviderAccount,
    ProviderConnection,
    ProviderSignal,
} from './providerTypes.js';

interface ConnectionRow {
    id: string;
    user_id: string;
    provider_id: 'google' | 'microsoft';
    external_account_id: string;
    scopes: string[];
    sync_cursor: string | null;
    disabled_at: string | null;
    disconnected_at: string | null;
}

interface AccountRow {
    id: string;
    user_id: string;
    integration_connection_id: string;
    provider: 'google' | 'microsoft';
    email: string;
    access_token: string;
    refresh_token: string | null;
    expires_at: number | null;
}

export interface ProviderStoreContract {
    getConnection(
        userId: string,
        connectionId: string,
    ): Promise<ProviderConnection | null>;
    getAccount(connection: ProviderConnection): Promise<ProviderAccount | null>;
    markSyncing(connection: ProviderConnection): Promise<void>;
    markSuccess(
        connection: ProviderConnection,
        cursor: string,
        intervalMinutes: number,
    ): Promise<void>;
    markFailure(
        connection: ProviderConnection,
        code: string,
        detail: string,
    ): Promise<void>;
    persistSignal(
        connection: ProviderConnection,
        signal: ProviderSignal,
    ): Promise<void>;
}

export class ProviderStore implements ProviderStoreContract {
    private readonly timeline: ProviderTimelineStore;

    constructor(private readonly client: SupabaseClient) {
        this.timeline = new ProviderTimelineStore(client);
    }

    async getConnection(userId: string, connectionId: string) {
        const result = await this.client
            .from('integration_connections')
            .select(
                'id,user_id,provider_id,external_account_id,scopes,sync_cursor,disabled_at,disconnected_at',
            )
            .eq('id', connectionId)
            .eq('user_id', userId)
            .in('provider_id', ['google', 'microsoft'])
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) return null;
        const row = result.data as ConnectionRow;
        return {
            id: row.id,
            userId: row.user_id,
            provider: row.provider_id,
            accountEmail: row.external_account_id,
            scopes: row.scopes,
            cursor: row.sync_cursor,
            disabled: Boolean(row.disabled_at || row.disconnected_at),
        } satisfies ProviderConnection;
    }

    async getAccount(connection: ProviderConnection) {
        const result = await this.client
            .from('user_email_accounts')
            .select(
                'id,user_id,integration_connection_id,provider,email,access_token,refresh_token,expires_at',
            )
            .eq('integration_connection_id', connection.id)
            .eq('user_id', connection.userId)
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) return null;
        const row = result.data as AccountRow;
        return {
            id: row.id,
            userId: row.user_id,
            connectionId: row.integration_connection_id,
            provider: row.provider,
            email: row.email,
            accessToken: row.access_token,
            refreshToken: row.refresh_token,
            expiresAt: row.expires_at,
        } satisfies ProviderAccount;
    }

    async markSyncing(connection: ProviderConnection) {
        await this.updateConnection(connection, {
            sync_status: 'syncing',
            last_sync_started_at: new Date().toISOString(),
            sync_error_code: null,
            sync_error_detail: null,
        });
    }

    async markSuccess(
        connection: ProviderConnection,
        cursor: string,
        intervalMinutes: number,
    ) {
        const now = new Date();
        await this.updateConnection(connection, {
            state: 'connected',
            sync_status: 'healthy',
            sync_cursor: cursor,
            last_checked_at: now.toISOString(),
            last_sync_succeeded_at: now.toISOString(),
            next_sync_at: new Date(
                now.valueOf() + intervalMinutes * 60_000,
            ).toISOString(),
            consecutive_failures: 0,
            sync_error_code: null,
            sync_error_detail: null,
        });
        const accountUpdate = await this.client
            .from('user_email_accounts')
            .update({ last_synced_at: now.toISOString() })
            .eq('integration_connection_id', connection.id)
            .eq('user_id', connection.userId);
        if (accountUpdate.error) throw accountUpdate.error;
    }

    async markFailure(
        connection: ProviderConnection,
        code: string,
        detail: string,
    ) {
        const current = await this.client
            .from('integration_connections')
            .select('consecutive_failures')
            .eq('id', connection.id)
            .eq('user_id', connection.userId)
            .single();
        if (current.error) throw current.error;
        const failures = Number(current.data.consecutive_failures) + 1;
        const delay = Math.min(360, 5 * 2 ** Math.min(failures - 1, 6));
        await this.updateConnection(connection, {
            state: 'error',
            sync_status: 'degraded',
            last_checked_at: new Date().toISOString(),
            next_sync_at: new Date(Date.now() + delay * 60_000).toISOString(),
            consecutive_failures: failures,
            sync_error_code: code,
            sync_error_detail: detail.slice(0, 500),
        });
    }

    persistSignal(connection: ProviderConnection, signal: ProviderSignal) {
        return this.timeline.persistSignal(connection, signal);
    }

    private async updateConnection(
        connection: ProviderConnection,
        values: Record<string, unknown>,
    ) {
        const result = await this.client
            .from('integration_connections')
            .update(values)
            .eq('id', connection.id)
            .eq('user_id', connection.userId)
            .is('disabled_at', null)
            .is('disconnected_at', null);
        if (result.error) throw result.error;
    }
}
