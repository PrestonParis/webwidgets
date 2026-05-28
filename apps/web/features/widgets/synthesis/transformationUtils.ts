import type { WidgetTransformationType } from '../types/synthesisWidgets';
import type { TransformationRegistryEntry } from '../types/synthesisTransformations';
import { TRANSFORMATION_REGISTRY } from './transformations';

export function getTransformation(
    id: WidgetTransformationType,
): TransformationRegistryEntry | undefined {
    return TRANSFORMATION_REGISTRY.find((t) => t.id === id);
}

export function getTransformationsForShape(
    inputShape: string,
): TransformationRegistryEntry[] {
    return TRANSFORMATION_REGISTRY.filter(
        (t) => t.inputShape === inputShape || t.inputShape === 'any',
    );
}

export function validateTransformationConfig(
    id: WidgetTransformationType,
    config: Record<string, unknown>,
): string[] {
    const entry = getTransformation(id);
    if (!entry) return [`Unknown transformation: ${id}`];
    const missing: string[] = [];
    for (const key of Object.keys(entry.configSchema)) {
        if (!(key in config))
            missing.push(`Missing required config field: ${key}`);
    }
    return missing;
}
