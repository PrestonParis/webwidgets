import type { ComponentRegistryEntry } from '../types/synthesisComponents';
import { COMPONENT_REGISTRY_PART_1 } from './componentsPart1';
import { COMPONENT_REGISTRY_PART_2 } from './componentsPart2';
import { COMPONENT_REGISTRY_PART_3 } from './componentsPart3';
import { COMPONENT_REGISTRY_PART_4 } from './componentsPart4';

export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = [
    ...COMPONENT_REGISTRY_PART_1,
    ...COMPONENT_REGISTRY_PART_2,
    ...COMPONENT_REGISTRY_PART_3,
    ...COMPONENT_REGISTRY_PART_4,
];
