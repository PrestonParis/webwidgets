import { createInternalMlProvider } from '@/features/intelligence/providers/internalMlProvider';
import { createRuleProvider } from '@/features/intelligence/providers/ruleProvider';
import { createAnthropicProvider } from '@/features/intelligence/providers/externalLlmProviders';
import type { PredictionTask } from '@/features/intelligence/types/inference';
import type { MLProvider } from '@/features/intelligence/types/provider';

export function getIntelligenceProviders(): MLProvider[] {
    return [
        createRuleProvider(),
        createInternalMlProvider(),
        createAnthropicProvider(),
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
