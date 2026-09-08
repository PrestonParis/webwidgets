import type { CapabilityBindingCatalog } from './registry';

const executors = new Set([
    'supabase.rpc.execute_approved_task_action',
    'nextjs.internal.execute_approved_calendar',
    'nextjs.internal.execute_approved_email',
]);
const verifiers = new Set([
    'supabase.receipt.task_action',
    'provider.readback.calendar',
    'provider.readback.email',
]);
const compensations = new Set([
    'supabase.rpc.undo_task_action',
    'nextjs.calendar.undo_create',
]);

export const productionBindingCatalog: CapabilityBindingCatalog = Object.freeze(
    {
        executors,
        verifiers,
        compensations,
    },
);
