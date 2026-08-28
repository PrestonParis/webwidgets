import { expect, test } from '@playwright/test';

test.describe('OAuth callback fail-closed boundary', () => {
    for (const path of [
        '/auth/callback?ic=1&uid=attacker&code=fixture&state=fixture',
        '/api/auth/google/callback?ic=1&code=fixture&state=fixture',
        '/api/auth/microsoft/callback?code=fixture&state=fixture',
    ]) {
        test(`rejects unauthenticated callback: ${path}`, async ({
            request,
        }) => {
            const response = await request.get(path, { maxRedirects: 0 });
            expect(response.status()).toBe(307);
            const location = new URL(response.headers().location!);
            expect(location.pathname).toBe('/auth/auth-code-error');
            expect(location.search).toBe('');
            expect(response.headers()['set-cookie'] ?? '').not.toContain(
                'provider_token',
            );
        });
    }

    test('Google connect requires an authenticated initiator', async ({
        request,
    }) => {
        const response = await request.get(
            '/api/auth/google/start?redirect=//attacker.invalid',
            { maxRedirects: 0 },
        );
        expect(response.status()).toBe(307);
        expect(new URL(response.headers().location!).pathname).toBe('/');
    });

    test('signed-out connection reaches the real sign-in screen', async ({
        page,
    }) => {
        await page.goto('/api/auth/google/start?capability=gmail');
        await expect(page).toHaveURL(/\/$/);
        await expect(
            page.getByRole('button', { name: 'Continue with Google' }),
        ).toBeVisible();
    });
});
