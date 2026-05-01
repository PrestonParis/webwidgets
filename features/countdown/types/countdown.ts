export interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export interface CountdownDisplayProps {
    timeLeft: TimeLeft;
}

export interface Countdown {
    id: string;
    name: string;
    emoji: string;
    target_date: string;
}

export interface CountdownHeroProps {
    countdown: Countdown;
    onDelete: (id: string) => void;
}

export interface CountdownItemProps {
    countdown: Countdown;
    onDelete: (id: string) => void;
}

export interface CountdownListProps {
    countdowns: Countdown[];
    onDelete: (id: string) => void;
}

export interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
}

export interface AddFormProps {
    onAdd: (name: string, date: string, emoji: string) => Promise<void>;
    onCancel: () => void;
}
