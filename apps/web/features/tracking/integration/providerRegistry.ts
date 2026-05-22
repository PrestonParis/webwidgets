import type {
    HealthProvider,
    HealthProviderAdapter,
} from '@/features/tracking/types/providers';
import { AppleHealthProvider } from './appleHealthProvider';
import { GoogleFitProvider } from './googleFitProvider';
import { FitbitProvider } from './fitbitProvider';
import { OuraProvider } from './ouraProvider';

const registry = new Map<HealthProvider, HealthProviderAdapter>([
    ['apple_health', new AppleHealthProvider()],
    ['google_fit', new GoogleFitProvider()],
    ['fitbit', new FitbitProvider()],
    ['oura', new OuraProvider()],
]);

export function getProvider(
    name: HealthProvider,
): HealthProviderAdapter | undefined {
    return registry.get(name);
}

export function getAllProviders(): HealthProviderAdapter[] {
    return [...registry.values()];
}
