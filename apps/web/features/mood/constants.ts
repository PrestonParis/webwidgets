export const MOODS: {
    value: number;
    emoji: string;
    label: string;
    color: string;
}[] = [
    {
        value: 1,
        emoji: '😣',
        label: 'Rough',
        color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
    },
    {
        value: 2,
        emoji: '😕',
        label: 'Meh',
        color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
    },
    {
        value: 3,
        emoji: '😐',
        label: 'Okay',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    },
    {
        value: 4,
        emoji: '🙂',
        label: 'Good',
        color: 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700',
    },
    {
        value: 5,
        emoji: '😄',
        label: 'Great',
        color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    },
];

export const DOT_COLORS: Record<number, string> = {
    1: 'bg-red-400',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-lime-400',
    5: 'bg-green-400',
};
