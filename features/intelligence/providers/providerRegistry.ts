import { createInternalMlProvider } from '@/features/intelligence/providers/internalMlProvider';
import { createRuleProvider } from '@/features/intelligence/providers/ruleProvider';
import { EXTERNAL_LLM_PROVIDERS } from '@/features/intelligence/providers/externalLlmProviders';
import type { PredictionTask } from '@/features/intelligence/types/inferenceTypes';
import type { MLProvider } from '@/features/intelligence/types/providerTypes';

export function getIntelligenceProviders(): MLProvider[] {
    return [
        createRuleProvider(),
        createInternalMlProvider(),
        ...EXTERNAL_LLM_PROVIDERS,
    ];
}

export function getProvidersForTask(
    task: PredictionTask,
    allowExternal: boolean,
) {
    return getIntelligenceProviders().filter((provider) => {
        if (!provider.capabilities.tasks.includes(task)) return false;
        if (!allowExternal && provider.kind === 'llm') return false;
        return provider.availability === 'available';
    });
}
