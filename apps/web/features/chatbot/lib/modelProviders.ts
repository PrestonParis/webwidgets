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
        description: 'Most capable Anthropic model',
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
        modelId: 'gpt-4.1',
        label: 'GPT-4.1',
        requiresUserKey: false,
        description: 'OpenAI general model',
    },
    {
        provider: 'openai',
        modelId: 'gpt-4.1-mini',
        label: 'GPT-4.1 mini',
        requiresUserKey: false,
        description: 'Fast OpenAI fallback model',
    },
    {
        provider: 'google',
        modelId: 'gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        requiresUserKey: false,
        description: 'Google fast model',
    },
    {
        provider: 'google',
        modelId: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        requiresUserKey: false,
        description: 'Gemini fast reasoning model',
    },
    {
        provider: 'google',
        modelId: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        requiresUserKey: false,
        description: 'Gemini advanced reasoning model',
    },
];

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';
export const DEFAULT_PROVIDER: ModelProvider = 'anthropic';

export const DEFAULT_MODEL_BY_PROVIDER: Record<ModelProvider, string> = {
    anthropic: 'claude-sonnet-4-6',
    openai: 'gpt-4.1',
    google: 'gemini-2.5-flash',
};

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
    google: 'Gemini',
};

export const ALL_PROVIDERS: ModelProvider[] = ['anthropic', 'openai', 'google'];
