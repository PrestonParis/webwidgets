export interface Tracker {
    id: string;
    addiction: string;
    start_time: string;
    created_at: string;
}

export interface SoberWidgetProps {
    tracker: Tracker;
    onReset: (id: string, newStart: string) => void;
}

export interface EmptyStateProps {
    onAddClick: () => void;
}

export interface AddTrackerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (addiction: string) => Promise<void>;
    existingTrackers: Tracker[];
}

export interface DatePickerProps {
    value: string;
    onChange: (iso: string) => void;
    onCancel: () => void;
}

export type SelDate = {
    day: number;
    month: number;
    year: number;
};

export type FooterActionsProps = {
    onCancel: () => void;
    onSave: () => void;
};

export type QuickActionKey = 'now' | 'sod' | '1hago' | 'yesterday';

export type QuickActionsProps = {
    onSelect: (key: QuickActionKey) => void;
};

export type CalendarGridProps = {
    firstDay: number;
    daysInMonth: number;
    viewYear: number;
    viewMonth: number;
    today: Date;
    sel: SelDate;
    setSel: (day: number, month: number, year: number) => void;
};
