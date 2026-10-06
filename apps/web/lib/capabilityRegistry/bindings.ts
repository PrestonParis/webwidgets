import type {
    CapabilityBindingCatalog,
    CapabilityBindingTarget,
} from './registry';

const target = (
    kind: CapabilityBindingTarget['kind'],
    reference: string,
): CapabilityBindingTarget => Object.freeze({ kind, reference });

const executors = new Map([
    [
        'supabase.rpc.execute_approved_task_action',
        target('sql_function', 'public.execute_approved_task_action'),
    ],
    [
        'nextjs.internal.execute_approved_calendar',
        target(
            'module_export',
            'apps/web/app/api/calendar-actions/_lib/executor.ts#executeApprovedCalendar',
        ),
    ],
    [
        'nextjs.internal.execute_approved_email',
        target(
            'module_export',
            'apps/web/app/api/email-actions/_lib/executor.ts#executeApprovedEmail',
        ),
    ],
]);
const verifiers = new Map([
    [
        'supabase.receipt.task_action',
        target('sql_function', 'public.execute_approved_task_action'),
    ],
    [
        'provider.readback.calendar',
        target(
            'module_export',
            'apps/web/app/api/calendar-actions/reconcile/route.ts#POST',
        ),
    ],
    [
        'provider.readback.email',
        target(
            'module_export',
            'apps/web/app/api/email-actions/reconcile/route.ts#POST',
        ),
    ],
]);
const compensations = new Map([
    [
        'supabase.rpc.undo_task_action',
        target('sql_function', 'public.undo_task_action'),
    ],
    [
        'nextjs.calendar.undo_create',
        target(
            'module_export',
            'apps/web/app/api/calendar-actions/undo/route.ts#POST',
        ),
    ],
]);

export const productionBindingCatalog: CapabilityBindingCatalog = Object.freeze(
    {
        executors,
        verifiers,
        compensations,
    },
);
