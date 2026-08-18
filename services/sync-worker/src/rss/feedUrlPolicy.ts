import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { WorkerTaskError } from '../v1/processors.js';

const blockedNames = new Set([
    'localhost',
    'metadata.google.internal',
    'metadata.google.com',
]);

function blockedIpv4(address: string) {
    const octets = address.split('.').map(Number);
    const [a, b] = octets;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a >= 224
    );
}

function blockedIp(address: string) {
    if (isIP(address) === 4) return blockedIpv4(address);
    const normalized = address.toLowerCase();
    return (
        normalized === '::' ||
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        /^fe[89ab]/u.test(normalized) ||
        normalized.startsWith('2001:db8:') ||
        normalized.startsWith('::ffff:')
    );
}

export function parseFeedUrl(value: string) {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new WorkerTaskError(
            'rss_invalid_url',
            'The feed URL is invalid.',
            false,
        );
    }
    const host = url.hostname.toLowerCase();
    const invalid =
        !['http:', 'https:'].includes(url.protocol) ||
        Boolean(url.username || url.password) ||
        (url.port !== '' && !['80', '443'].includes(url.port)) ||
        blockedNames.has(host) ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        blockedIp(host);
    if (invalid) {
        throw new WorkerTaskError(
            'rss_unsafe_url',
            'The feed URL targets a blocked network location.',
            false,
        );
    }
    url.hash = '';
    return url;
}

export async function assertPublicFeedUrl(value: string) {
    const url = parseFeedUrl(value);
    let addresses: Array<{ address: string; family: number }>;
    try {
        addresses = await lookup(url.hostname, { all: true, verbatim: true });
    } catch {
        throw new WorkerTaskError(
            'rss_dns_failed',
            'The feed hostname could not be resolved.',
            true,
        );
    }
    if (
        !addresses.length ||
        addresses.some(({ address }) => blockedIp(address))
    ) {
        throw new WorkerTaskError(
            'rss_unsafe_url',
            'The feed hostname resolves to a blocked network location.',
            false,
        );
    }
    return url;
}
