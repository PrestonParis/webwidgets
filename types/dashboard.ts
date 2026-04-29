import { Tracker } from './recovery';

export type WidgetType =
    | 'journal'
    | 'email'
    | 'recovery'
    | 'converter'
    | 'recovery-empty'
    | 'chess'
    | 'pomodoro'
    | 'todo'
    | 'weather'
    | 'worldclock'
    | 'currency'
    | 'mood'
    | 'habit'
    | 'scratchpad'
    | 'countdown';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    visible: boolean;
    columnSpan: number; // For weaving and resizing
    containerId: string; // "main", "bucket", or a Folder ID
    order: number; // For manual ordering within a container
    props?: {
        tracker?: Tracker; // recovery
        initialUnit?: string; // converter
        // recovery-empty doesn't need any props
    };
}
