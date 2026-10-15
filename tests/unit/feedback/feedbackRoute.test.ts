import { beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn();

vi.mock('@/lib/supabase/adminClient', () => ({
    createAdminClient: () => ({ from: () => ({ insert }) }),
}));

function post(body: unknown) {
    return new Request('https://app.test/api/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

describe('feedback route', () => {
    beforeEach(() => {
        insert.mockReset();
        insert.mockResolvedValue({ error: null });
    });

    it('stores a bounded anonymous submission', async () => {
        const { POST } = await import('@/app/api/feedback/route');
        const response = await POST(
            post({ satisfactionRating: 4, whatIWanted: ' Faster sync ' }),
        );

        expect(response.status).toBe(200);
        expect(insert).toHaveBeenCalledWith(
            expect.objectContaining({
                satisfaction_rating: 4,
                what_i_wanted: 'Faster sync',
            }),
        );
    });

    it('rejects out-of-range ratings and oversized text', async () => {
        const { POST } = await import('@/app/api/feedback/route');

        expect((await POST(post({ satisfactionRating: 9 }))).status).toBe(400);
        expect(
            (await POST(post({ generalComment: 'x'.repeat(5001) }))).status,
        ).toBe(400);
        expect(insert).not.toHaveBeenCalled();
    });

    it('does not echo database errors to the caller', async () => {
        insert.mockResolvedValue({
            error: { code: '42P01', message: 'relation "user_feedback"' },
        });
        const { POST } = await import('@/app/api/feedback/route');
        const response = await POST(post({ bugsFound: 'Broken button' }));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'Could not save feedback',
        });
    });
});
