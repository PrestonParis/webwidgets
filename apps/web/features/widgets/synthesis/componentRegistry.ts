import type { ComponentRegistryEntry } from './componentTypes';
import { COMPONENT_REGISTRY } from './components';
import {
    getComponent,
    getComponentsByCategory,
    getComponentCategories,
} from './componentUtils';

export type { ComponentRegistryEntry };
export {
    COMPONENT_REGISTRY,
    getComponent,
    getComponentsByCategory,
    getComponentCategories,
};
