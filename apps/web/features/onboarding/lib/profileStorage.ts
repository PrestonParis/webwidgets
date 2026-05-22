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

export function createDefaultProfile(): OnboardingProfile {
    return {
        version: 1,
        status: 'not_started',
        currentStep: 'workspace',
        completed: false,
        goals: [],
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
    const parsed = { ...createDefaultProfile(), ...profile };
    if (
        !['workspace', 'goals', 'integrations', 'generate'].includes(
            parsed.currentStep,
        )
    ) {
        return { ...parsed, currentStep: 'workspace' };
    }
    return parsed;
}

export function cacheOnboardingProfile(
    userId: string | undefined,
    profile: OnboardingProfile,
) {
    localStorage.setItem(onboardingStorageKey(userId), JSON.stringify(profile));
}
