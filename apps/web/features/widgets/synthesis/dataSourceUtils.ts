import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';
import { DATA_SOURCE_REGISTRY } from './dataSources';

export function getDataSource(id: string): DataSourceRegistryEntry | undefined {
    return DATA_SOURCE_REGISTRY.find((ds) => ds.id === id);
}

export function getDataSourcesByCategory(
    category: string,
): DataSourceRegistryEntry[] {
    return DATA_SOURCE_REGISTRY.filter((ds) => ds.category === category);
}

const CATEGORY_ORDER = [
    'app_data',
    'finance',
    'tracking',
    'calendar',
    'email',
    'knowledge',
    'news',
    'events',
    'sports',
    'ai',
    'computed',
    'custom',
];

export function getDataSourceCategories(): string[] {
    const all = [...new Set(DATA_SOURCE_REGISTRY.map((ds) => ds.category))];
    return all.sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}
