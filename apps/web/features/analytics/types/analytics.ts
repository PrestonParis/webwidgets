import type { EventName } from '../lib/eventNames';

export interface TrackEventOptions {
    userId?: string;
    type: EventName;
    source?: string;
    metadata?: Record<string, unknown>;
}
