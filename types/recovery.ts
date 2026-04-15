export interface Tracker {
    id: string;
    addiction: string;
    start_time: string;
    created_at: string;
}

export interface SoberWidgetProps {
    tracker: {
        id: string;
        addiction: string;
        start_time: string;
    };
    onReset: (id: string, newStart: string) => void;
}