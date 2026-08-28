import { afterEach, expect, it, vi } from 'vitest';
import {
    googleReadScopes,
    startGoogleConnection,
} from '@/lib/auth/googleConnection';

afterEach(() => vi.unstubAllGlobals());

it('preserves the existing capability sets without requesting email writes', () => {
    const gmail = googleReadScopes('gmail');
    expect(gmail).toContain('gmail.readonly');
    expect(gmail).not.toContain('calendar.events');
    expect(googleReadScopes('calendar')).toContain('calendar.events');
    expect(googleReadScopes('calendar')).not.toContain('drive.readonly');
    expect(googleReadScopes('drive')).toContain('drive.readonly');
    for (const capability of ['gmail', 'calendar', 'drive'] as const) {
        expect(googleReadScopes(capability)).not.toMatch(
            /gmail\.(send|compose|modify)/,
        );
    }
});

it('all connect controls can use the user-bound server route and retain the local page', () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { pathname: '/settings', assign } });
    startGoogleConnection('drive');
    const target = new URL(
        assign.mock.calls[0]![0] as string,
        'https://app.invalid',
    );
    expect(target.pathname).toBe('/api/auth/google/start');
    expect(target.searchParams.get('capability')).toBe('drive');
    expect(target.searchParams.get('redirect')).toBe('/settings');
});
