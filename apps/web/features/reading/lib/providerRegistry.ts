import type { ReadingProvider } from '@/features/reading/types/providers';

const registry = new Map<string, ReadingProvider>();

export function registerProvider(provider: ReadingProvider): void {
    registry.set(provider.id, provider);
}

export function getProvider(id: string): ReadingProvider | undefined {
    return registry.get(id);
}

export function getAllProviders(): ReadingProvider[] {
    return [...registry.values()];
}

export function getProviderOrThrow(id: string): ReadingProvider {
    const p = registry.get(id);
    if (!p) throw new Error(`Reading provider not found: ${id}`);
    return p;
}
