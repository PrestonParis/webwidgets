import { afterEach, describe, expect, it } from 'vitest';
import { sharedLlmKey, sharedLlmKeysEnabled } from '@/lib/llm/sharedKeys';

const original = { ...process.env };

describe('shared LLM key kill switch', () => {
    afterEach(() => {
        process.env = { ...original };
    });

    it('withholds server keys unless explicitly enabled', () => {
        delete process.env.ALLOW_SHARED_LLM_KEYS;
        process.env.ANTHROPIC_API_KEY = 'server-key';

        expect(sharedLlmKeysEnabled()).toBe(false);
        expect(sharedLlmKey('ANTHROPIC_API_KEY')).toBeUndefined();
    });

    it('only treats the exact string true as enabled', () => {
        process.env.ALLOW_SHARED_LLM_KEYS = '1';
        process.env.OPENAI_API_KEY = 'server-key';

        expect(sharedLlmKey('OPENAI_API_KEY')).toBeUndefined();
    });

    it('returns the server key when enabled', () => {
        process.env.ALLOW_SHARED_LLM_KEYS = 'true';
        process.env.GEMINI_API_KEY = 'server-key';

        expect(sharedLlmKey('GEMINI_API_KEY')).toBe('server-key');
    });
});
