// Provider bootstrap: registers all providers into the registry.
// Import this once at widget mount time.

import { registerProvider } from '@/features/reading/lib/providerRegistry';
import userUploadsProvider from './userUploadsProvider';
import bibleProvider from './bibleProvider';

let bootstrapped = false;

export function bootstrapProviders(): void {
    if (bootstrapped) return;
    bootstrapped = true;
    registerProvider(bibleProvider);
    registerProvider(userUploadsProvider);
}
