import type { ActionRegistryEntry } from '../types/synthesisActions';
import { ACTION_REGISTRY_PART_1 } from './actionsPart1';
import { ACTION_REGISTRY_PART_2 } from './actionsPart2';
import { ACTION_REGISTRY_PART_3 } from './actionsPart3';

export const ACTION_REGISTRY: ActionRegistryEntry[] = [
    ...ACTION_REGISTRY_PART_1,
    ...ACTION_REGISTRY_PART_2,
    ...ACTION_REGISTRY_PART_3,
];

export function getAction(id: string): ActionRegistryEntry | undefined {
    return ACTION_REGISTRY.find((a) => a.id === id);
}

export function getSafeActions(): ActionRegistryEntry[] {
    return ACTION_REGISTRY.filter((a) => a.safe);
}

export function getActionsByCategory(category: string): ActionRegistryEntry[] {
    return ACTION_REGISTRY.filter((a) => a.category === category);
}
