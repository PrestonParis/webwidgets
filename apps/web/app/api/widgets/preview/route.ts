import { NextResponse } from 'next/server';
import superjson from 'superjson';
import { z } from 'zod';
import { generateWidgetPreview } from '@/features/widgets/synthesis/preview/previewEngine';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

const requestSchema = z.object({
    definition: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const preview = generateWidgetPreview(
        parsed.data.definition as unknown as SynthesizedWidgetDefinition,
    );
    if (preview.isErr()) {
        return NextResponse.json(
            superjson.serialize({ ok: false, issues: preview.error }),
            { status: 422 },
        );
    }
    return NextResponse.json(
        superjson.serialize({ ok: true, preview: preview.value }),
    );
}
