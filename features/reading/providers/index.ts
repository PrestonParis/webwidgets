// Provider bootstrap: registers all providers into the registry.
// Import this once at widget mount time.

import { registerProvider } from '@/features/reading/lib/providerRegistry';
import mockReligiousProvider from './mockReligiousProvider';
import mockPdfProvider from './mockPdfProvider';
import userUploadsProvider from './userUploadsProvider';

let bootstrapped = false;

export function bootstrapProviders(): void {
    if (bootstrapped) return;
    bootstrapped = true;
    registerProvider(mockReligiousProvider);
    registerProvider(mockPdfProvider);
    registerProvider(userUploadsProvider);
}
