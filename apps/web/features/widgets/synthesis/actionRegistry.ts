import type {
    ActionRegistryEntry,
    AutomationRegistryEntry,
} from '../types/synthesisActions';
import {
    ACTION_REGISTRY,
    getAction,
    getSafeActions,
    getActionsByCategory,
} from './actions';
import { AUTOMATION_REGISTRY } from './automations';

export type { ActionRegistryEntry, AutomationRegistryEntry };
export {
    ACTION_REGISTRY,
    AUTOMATION_REGISTRY,
    getAction,
    getSafeActions,
    getActionsByCategory,
};
