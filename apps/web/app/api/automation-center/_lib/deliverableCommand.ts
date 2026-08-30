import type { SupabaseClient } from '@supabase/supabase-js';

interface DeliverableInput {
    id?: string | undefined;
    name?: string | undefined;
    sourceWidgets?: string[] | undefined;
    outputType?: string | undefined;
    schedule?: Record<string, unknown> | undefined;
    deliveryDestination?: string | undefined;
    approvalMode?: string | undefined;
    enabled?: boolean | undefined;
}

interface DeliverableRow {
    id: string;
    user_id: string;
    name: string;
    source_widgets: string[];
    output_type: string;
    schedule: Record<string, unknown>;
    delivery_destination: string;
    approval_mode: string;
    enabled: boolean;
}

export async function upsertDeliverable(
    db: SupabaseClient,
    userId: string,
    input: DeliverableInput,
) {
    const values = {
        user_id: userId,
        name: input.name,
        source_widgets: input.sourceWidgets,
        output_type: input.outputType,
        schedule: input.schedule,
        delivery_destination: input.deliveryDestination,
        approval_mode: input.approvalMode,
        enabled: input.enabled,
        updated_at: new Date().toISOString(),
    };
    const query = input.id
        ? db
              .from('automation_deliverables')
              .update(values)
              .eq('id', input.id)
              .eq('user_id', userId)
        : db.from('automation_deliverables').insert(values);
    const result = await query.select('*').single();
    if (result.error) throw result.error;
    const row = result.data as unknown as DeliverableRow;
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        sourceWidgets: row.source_widgets,
        outputType: row.output_type,
        schedule: row.schedule,
        deliveryDestination: row.delivery_destination,
        approvalMode: row.approval_mode,
        enabled: row.enabled,
    };
}
