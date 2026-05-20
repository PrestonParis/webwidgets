import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/supabase', () => ({
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
    db: { from: vi.fn() },
}));

vi.mock('@/lib/supabase/serverClient', () => ({
    createClients: vi
        .fn()
        .mockResolvedValue({ supabase: {}, supabaseAdmin: {} }),
}));
import { listWidgetManifests } from '@/features/widgets/registry/widgetManifest';
import { listDataResolvers } from '@/features/widgets/registry/widgetDataRegistry';

describe('widget manifest / resolver consistency', () => {
    it('every dataNeeds key declared in a manifest has a registered resolver', () => {
        const manifests = listWidgetManifests();
        const resolverKeys = new Set(listDataResolvers().map((r) => r.key));

        const missing: { widgetId: string; missingKey: string }[] = [];

        for (const manifest of manifests) {
            for (const need of manifest.dataNeeds) {
                if (!resolverKeys.has(need)) {
                    missing.push({ widgetId: manifest.id, missingKey: need });
                }
            }
        }

        expect(missing).toEqual([]);
    });

    it('resolver keys are unique in the registry', () => {
        const resolvers = listDataResolvers();
        const keys = resolvers.map((r) => r.key);
        const unique = new Set(keys);
        expect(keys.length).toBe(unique.size);
    });

    it('all manifests have a non-empty id, feature, and title', () => {
        const manifests = listWidgetManifests();
        for (const m of manifests) {
            expect(m.id, `${m.id} missing id`).toBeTruthy();
            expect(m.feature, `${m.id} missing feature`).toBeTruthy();
            expect(m.title, `${m.id} missing title`).toBeTruthy();
        }
    });
});
