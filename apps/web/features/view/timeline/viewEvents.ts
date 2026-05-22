import { getLogger } from '@/lib/observability/logger';

export function emitViewLifecycleEvent(event: {
    type:
        | 'view.opened'
        | 'view.parsed'
        | 'view.annotated'
        | 'view.exported'
        | 'view.failed';
    fileId: string;
    metadata?: Record<string, unknown>;
}) {
    getLogger({
        component: 'view-widget',
        fileId: event.fileId,
        eventType: event.type,
    }).info(event.metadata ?? {}, 'view lifecycle event');
}
