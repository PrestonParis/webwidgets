import { useState } from 'react';

export function useGreeting(name?: string) {
    // Generate a greeting message based on the current time and user's name
    const [greeting] = useState(() => {
        const hour = new Date().getHours();
        let timeGreeting: string;

        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else if (hour < 21) timeGreeting = 'Good evening';
        else timeGreeting = 'Hello';

        const suffixes = [
            'What’s on the agenda today?',
            'Let’s make some progress.',
            'Ready to dive back in?',
            'Stay focused, stay inspired.',
        ];

        const randomSuffix =
            suffixes[Math.floor(Math.random() * suffixes.length)];
        const userSegment = name ? `, ${name}` : '';

        return `${timeGreeting}${userSegment}! ${randomSuffix}`;
    });

    return greeting;
}
