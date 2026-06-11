import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';
import { DATA_SOURCE_REGISTRY_PART_1 } from './dataSourcesPart1';
import { DATA_SOURCE_REGISTRY_PART_2 } from './dataSourcesPart2';
import { DATA_SOURCE_REGISTRY_ADAPTERS } from './dataSourcesAdapters';

export const DATA_SOURCE_REGISTRY: DataSourceRegistryEntry[] = [
    ...DATA_SOURCE_REGISTRY_PART_1,
    ...DATA_SOURCE_REGISTRY_PART_2,
    ...DATA_SOURCE_REGISTRY_ADAPTERS,
];
