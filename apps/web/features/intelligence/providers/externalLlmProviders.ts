import type { LLMProvider } from '@/features/intelligence/types/providerTypes';

export const EXTERNAL_LLM_PROVIDERS: LLMProvider[] = [
    llmProvider('openai', Boolean(process.env.OPENAI_API_KEY)),
    llmProvider('anthropic', Boolean(process.env.ANTHROPIC_API_KEY)),
    llmProvider('gemini', Boolean(process.env.GEMINI_API_KEY)),
    llmProvider('local-llm', Boolean(process.env.LOCAL_LLM_URL)),
];

function llmProvider(id: string, configured: boolean): LLMProvider {
    return {
        id,
        kind: 'llm',
        availability: configured ? 'available' : 'missing_config',
        capabilities: {
            tasks: ['summarization', 'research_synthesis'],
            supportsBatching: false,
            supportsOffline: id === 'local-llm',
            supportsStreaming: true,
        },
        infer: () =>
            Promise.reject(
                new Error(
                    `${id} inference boundary is configured but no runtime adapter is registered`,
                ),
            ),
    };
}
