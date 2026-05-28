export type SelDate = {
    day: number;
    month: number;
    year: number;
};

export interface DatePickerProps {
    value: string;
    onChange: (iso: string) => void;
    onCancel: () => void;
    allowFuture?: boolean;
    showQuickActions?: boolean;
    className?: string;
    saveLabel?: string;
}

export type FooterActionsProps = {
    onCancel: () => void;
    onSave: () => void;
    saveLabel?: string;
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
    allowFuture?: boolean;
};
