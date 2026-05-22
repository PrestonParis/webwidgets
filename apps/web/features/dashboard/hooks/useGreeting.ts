import { useMemo, useState } from 'react';

const SUFFIXES = [
    "What's on the agenda today?",
    "Let's make some progress.",
    'Ready to dive back in?',
    'Stay focused, stay inspired.',
];

export function useGreeting(name?: string | null) {
    // useState lazy initializer runs once on mount — Math.random() is allowed here.
    const [suffix] = useState<string>(
        () =>
            SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)] ??
            'Stay focused, stay inspired.',
    );

    return useMemo(() => {
        const hour = new Date().getHours();
        let timeGreeting: string;
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else if (hour < 21) timeGreeting = 'Good evening';
        else timeGreeting = 'Hello';

        const userSegment = name ? `, ${name}` : '';
        return `${timeGreeting}${userSegment}! ${suffix}`;
    }, [name, suffix]);
}
