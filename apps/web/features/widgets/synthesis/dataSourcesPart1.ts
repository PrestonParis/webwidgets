import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';
import { DATA_SOURCE_REGISTRY_PART_1_CHUNK_1 } from './dataSourcesPart1Chunk1';
import { DATA_SOURCE_REGISTRY_PART_1_CHUNK_2 } from './dataSourcesPart1Chunk2';

export const DATA_SOURCE_REGISTRY_PART_1: DataSourceRegistryEntry[] = [
    ...DATA_SOURCE_REGISTRY_PART_1_CHUNK_1,
    ...DATA_SOURCE_REGISTRY_PART_1_CHUNK_2,
];
