import type { DataSourceRegistryEntry } from './dataSourceTypes';
import { DATA_SOURCE_REGISTRY_PART_2_CHUNK_1 } from './dataSourcesPart2Chunk1';
import { DATA_SOURCE_REGISTRY_PART_2_CHUNK_2 } from './dataSourcesPart2Chunk2';

export const DATA_SOURCE_REGISTRY_PART_2: DataSourceRegistryEntry[] = [
    ...DATA_SOURCE_REGISTRY_PART_2_CHUNK_1,
    ...DATA_SOURCE_REGISTRY_PART_2_CHUNK_2,
];
