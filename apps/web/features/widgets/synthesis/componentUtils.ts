import type { WidgetComponentCategory } from '../types/synthesisWidgets';
import type { ComponentRegistryEntry } from '../types/synthesisComponents';
import { COMPONENT_REGISTRY } from './components';

export function getComponent(id: string): ComponentRegistryEntry | undefined {
    return COMPONENT_REGISTRY.find((c) => c.id === id);
}

export function getComponentsByCategory(
    category: WidgetComponentCategory,
): ComponentRegistryEntry[] {
    return COMPONENT_REGISTRY.filter((c) => c.category === category);
}

export function getComponentCategories(): WidgetComponentCategory[] {
    return [...new Set(COMPONENT_REGISTRY.map((c) => c.category))];
}
