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

export function getDataSourceCategories(): string[] {
    return [...new Set(DATA_SOURCE_REGISTRY.map((ds) => ds.category))];
}
