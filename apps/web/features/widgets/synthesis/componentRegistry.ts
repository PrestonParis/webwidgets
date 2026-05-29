import type { ComponentRegistryEntry } from '../types/synthesisComponents';
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
