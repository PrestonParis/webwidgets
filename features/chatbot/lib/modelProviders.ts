import type { ModelOption, ModelProvider } from '@/features/chatbot/types/chat';

export const MODEL_OPTIONS: ModelOption[] = [
    {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-6',
        label: 'Claude Sonnet 4.6',
        requiresUserKey: false,
        description: 'Balanced performance and speed',
    },
    {
        provider: 'anthropic',
        modelId: 'claude-opus-4-7',
        label: 'Claude Opus 4.7',
        requiresUserKey: false,
        description: 'Most capable — uses your Anthropic key',
    },
    {
        provider: 'anthropic',
        modelId: 'claude-haiku-4-5-20251001',
        label: 'Claude Haiku 4.5',
        requiresUserKey: false,
        description: 'Fast and lightweight',
    },
    {
        provider: 'openai',
        modelId: 'gpt-4o',
        label: 'GPT-4o',
        requiresUserKey: true,
        description: 'OpenAI flagship — requires your OpenAI key',
    },
    {
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        label: 'GPT-4o mini',
        requiresUserKey: true,
        description: 'Fast and affordable — requires your OpenAI key',
    },
    {
        provider: 'google',
        modelId: 'gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        requiresUserKey: true,
        description: 'Google fast model — requires your Gemini key',
    },
];

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';
export const DEFAULT_PROVIDER: ModelProvider = 'anthropic';

export function getModelOption(modelId: string): ModelOption {
    return (
        MODEL_OPTIONS.find((m) => m.modelId === modelId) ??
        (MODEL_OPTIONS[0] as ModelOption)
    );
}

export function getProviderModels(provider: ModelProvider): ModelOption[] {
    return MODEL_OPTIONS.filter((m) => m.provider === provider);
}

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
};

export const ALL_PROVIDERS: ModelProvider[] = ['anthropic', 'openai', 'google'];
