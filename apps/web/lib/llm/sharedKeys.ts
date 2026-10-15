// Temporary kill switch: server-owned LLM keys stay off unless
// ALLOW_SHARED_LLM_KEYS=true, because signup is open and nothing yet enforces a
// per-user quota on the operator's provider budget. Keys users save themselves
// are unaffected.
type SharedLlmKeyName =
    | 'ANTHROPIC_API_KEY'
    | 'OPENAI_API_KEY'
    | 'GEMINI_API_KEY'
    | 'GOOGLE_API_KEY';

export function sharedLlmKeysEnabled(): boolean {
    return process.env.ALLOW_SHARED_LLM_KEYS === 'true';
}

export function sharedLlmKey(name: SharedLlmKeyName): string | undefined {
    if (!sharedLlmKeysEnabled()) return undefined;
    return process.env[name] || undefined;
}
