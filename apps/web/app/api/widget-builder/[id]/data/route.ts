import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

registerCoreImportExportAdapters();

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load widget definition
    const { data: widget, error } = await supabase
        .from('custom_widgets')
        .select('definition')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error || !widget)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const definition =
        widget.definition as unknown as SynthesizedWidgetDefinition;
    const adapters = listAdapters();
    const result: Record<string, unknown> = {};

    await Promise.all(
        definition.dataSources.map(async (source) => {
            const adapter = adapters.find((a) => a.id === source.id);
            if (!adapter?.exportData) {
                result[source.id] = [];
                return;
            }
            try {
                const exported = await adapter.exportData(userId, {
                    limit: 200,
                });
                result[source.id] = exported.rows.map((r) => r.data);
            } catch {
                result[source.id] = [];
            }
        }),
    );

    return NextResponse.json({ data: result });
}
