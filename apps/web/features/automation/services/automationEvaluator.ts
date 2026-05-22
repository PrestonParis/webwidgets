import type { AutomationConfig } from '@/features/automation/types/automation';

export function automationRequiresApproval(config: AutomationConfig) {
    return (
        config.requiresApproval ||
        config.actionTypes.some((action) => action !== 'notify')
    );
}

export function canEvaluateAutomation(
    config: AutomationConfig,
    grantedConsents: string[],
    connectedServices: string[],
) {
    const hasConsents = config.consentRequirements.every((scope) =>
        grantedConsents.includes(scope),
    );
    const hasServices = config.serviceRequirements.every((service) =>
        connectedServices.includes(service),
    );
    return hasConsents && hasServices;
}
