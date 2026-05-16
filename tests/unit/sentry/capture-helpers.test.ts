import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockScope, mockWithScope, mockCaptureException, mockCaptureMessage } =
    vi.hoisted(() => {
        const mockScope = {
            setUser: vi.fn(),
            setTag: vi.fn(),
            setExtras: vi.fn(),
        };
        return {
            mockScope,
            mockWithScope: vi.fn((cb: (scope: typeof mockScope) => void) =>
                cb(mockScope),
            ),
            mockCaptureException: vi.fn(),
            mockCaptureMessage: vi.fn(),
        };
    });

vi.mock('@sentry/nextjs', () => ({
    withScope: mockWithScope,
    captureException: mockCaptureException,
    captureMessage: mockCaptureMessage,
}));

import { captureError, captureMessage } from '@/lib/observability/sentry';

beforeEach(() => {
    vi.clearAllMocks();
    mockWithScope.mockImplementation((cb: (scope: typeof mockScope) => void) =>
        cb(mockScope),
    );
});

describe('captureError', () => {
    it('captures the exception', () => {
        const err = new Error('boom');
        captureError(err);
        expect(mockCaptureException).toHaveBeenCalledWith(err);
    });

    it('sets user when userId provided', () => {
        captureError(new Error(), { userId: 'u-123' });
        expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'u-123' });
    });

    it('sets requestId, operation, and feature tags', () => {
        captureError(new Error(), {
            requestId: 'req-1',
            operation: 'GET /api/foo',
            feature: 'inbox',
        });
        expect(mockScope.setTag).toHaveBeenCalledWith('requestId', 'req-1');
        expect(mockScope.setTag).toHaveBeenCalledWith(
            'operation',
            'GET /api/foo',
        );
        expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'inbox');
    });

    it('sets custom tags', () => {
        captureError(new Error(), {
            tags: { env: 'staging', region: 'us-east' },
        });
        expect(mockScope.setTag).toHaveBeenCalledWith('env', 'staging');
        expect(mockScope.setTag).toHaveBeenCalledWith('region', 'us-east');
    });

    it('sets extras', () => {
        captureError(new Error(), {
            extra: { messageId: 'msg-42', attempt: 3 },
        });
        expect(mockScope.setExtras).toHaveBeenCalledWith({
            messageId: 'msg-42',
            attempt: 3,
        });
    });

    it('does not set user when userId is absent', () => {
        captureError(new Error(), { feature: 'chess' });
        expect(mockScope.setUser).not.toHaveBeenCalled();
    });

    it('works with no context', () => {
        const err = new Error('bare');
        captureError(err);
        expect(mockCaptureException).toHaveBeenCalledWith(err);
        expect(mockScope.setUser).not.toHaveBeenCalled();
    });
});

describe('captureMessage', () => {
    it('captures the message with the given level', () => {
        captureMessage('something happened', 'warning');
        expect(mockCaptureMessage).toHaveBeenCalledWith(
            'something happened',
            'warning',
        );
    });

    it('sets user when userId provided', () => {
        captureMessage('test', 'info', { userId: 'u-456' });
        expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'u-456' });
    });

    it('sets tags when provided', () => {
        captureMessage('test', 'error', { tags: { source: 'cron' } });
        expect(mockScope.setTag).toHaveBeenCalledWith('source', 'cron');
    });

    it('works with no context', () => {
        captureMessage('plain', 'debug');
        expect(mockCaptureMessage).toHaveBeenCalledWith('plain', 'debug');
    });
});
