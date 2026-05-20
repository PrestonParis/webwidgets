export async function* parseSSEStream(
    stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') return;
                yield data;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

export function extractTextDelta(
    rawData: string,
    provider: 'anthropic' | 'openai' | 'google',
): string {
    try {
        const parsed = JSON.parse(rawData) as Record<string, unknown>;
        if (provider === 'anthropic') {
            const delta = parsed['delta'] as
                | Record<string, unknown>
                | undefined;
            return typeof delta?.['text'] === 'string' ? delta['text'] : '';
        }
        if (provider === 'openai') {
            const choices = parsed['choices'] as
                | Array<Record<string, unknown>>
                | undefined;
            const delta = choices?.[0]?.['delta'] as
                | Record<string, unknown>
                | undefined;
            return typeof delta?.['content'] === 'string'
                ? delta['content']
                : '';
        }
    } catch {
        // malformed chunk — skip
    }
    return '';
}
