import type {
    OnboardingPreferences,
    OnboardingProfile,
} from '@/features/onboarding/types/profile';

const STORAGE_PREFIX = 'webwidgets_onboarding';

export const DEFAULT_ONBOARDING_PREFERENCES: OnboardingPreferences = {
    workspaceStyle: 'focused',
    layoutMode: 'grid',
    density: 'comfortable',
    complexity: 'balanced',
    aiAssistance: 'balanced',
};

const VALID_STEP_IDS = [
    'welcome',
    'focus',
    'integrations',
    'recommendation',
    'launch',
] as const;

export function createDefaultProfile(): OnboardingProfile {
    return {
        version: 1,
        status: 'not_started',
        currentStep: 'welcome',
        completed: false,
        goals: [],
        focusAreas: [],
        intent: '',
        selectedWidgetTypes: [],
        enabledIntegrationIds: [],
        skippedIntegrationIds: [],
        enabledAutomationIds: [],
        preferences: DEFAULT_ONBOARDING_PREFERENCES,
        generatedWorkspace: null,
        updatedAt: new Date().toISOString(),
    };
}

export function onboardingStorageKey(userId: string | undefined) {
    return `${STORAGE_PREFIX}:${userId ?? 'local'}`;
}

export function readOnboardingProfile(
    userId: string | undefined,
): OnboardingProfile {
    if (typeof window === 'undefined') return createDefaultProfile();
    const raw = localStorage.getItem(onboardingStorageKey(userId));
    if (!raw) return createDefaultProfile();

    try {
        return normalizeOnboardingProfile(
            JSON.parse(raw) as Partial<OnboardingProfile>,
        );
    } catch {
        return createDefaultProfile();
    }
}

export function normalizeOnboardingProfile(
    profile: Partial<OnboardingProfile>,
): OnboardingProfile {
    const defaults = createDefaultProfile();
    const parsed: OnboardingProfile = {
        ...defaults,
        ...profile,
        focusAreas: profile.focusAreas ?? defaults.focusAreas,
    };
    if (
        !VALID_STEP_IDS.includes(
            parsed.currentStep as (typeof VALID_STEP_IDS)[number],
        )
    ) {
        return { ...parsed, currentStep: 'welcome' };
    }
    return parsed;
}

export function cacheOnboardingProfile(
    userId: string | undefined,
    profile: OnboardingProfile,
) {
    localStorage.setItem(onboardingStorageKey(userId), JSON.stringify(profile));
}
