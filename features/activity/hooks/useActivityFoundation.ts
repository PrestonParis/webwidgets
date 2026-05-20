const ACTIVITY_SOURCES = [
    'email',
    'calendar',
    'tracking',
    'automation',
    'finance',
    'integrations',
    'onboarding',
    'system',
] as const;

export function useActivityFoundation() {
    return { sources: ACTIVITY_SOURCES };
}
