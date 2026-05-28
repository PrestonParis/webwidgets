import type { DataSourceRegistryEntry } from './dataSourceTypes';
import { DATA_SOURCE_REGISTRY_PART_1 } from './dataSourcesPart1';
import { DATA_SOURCE_REGISTRY_PART_2 } from './dataSourcesPart2';

export const DATA_SOURCE_REGISTRY: DataSourceRegistryEntry[] = [
    ...DATA_SOURCE_REGISTRY_PART_1,
    ...DATA_SOURCE_REGISTRY_PART_2,
];
