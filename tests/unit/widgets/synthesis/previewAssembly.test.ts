import { describe, expect, it } from 'vitest';
import { synthesizeWidgetFromQuery } from '@/features/widgets/synthesis/widgetSearchSynthesis';
import { assembleDraftWidget } from '@/features/widgets/synthesis/widgetAssemblyEngine';
import { generateWidgetPreview } from '@/features/widgets/synthesis/preview/previewEngine';

describe('widget assembly and preview', () => {
    it('assembles and previews a synthesized draft', () => {
        const draft =
            synthesizeWidgetFromQuery('research briefing')[0]?.definitionDraft;
        expect(draft).toBeDefined();
        if (!draft) return;

        const assembled = assembleDraftWidget(draft);
        expect(assembled.resolvedComponents.length).toBeGreaterThan(0);

        const preview = generateWidgetPreview(draft);
        expect(preview.isOk()).toBe(true);
        if (preview.isErr()) return;
        expect(Object.keys(preview.value.sampleData).length).toBeGreaterThan(0);
    });
});
