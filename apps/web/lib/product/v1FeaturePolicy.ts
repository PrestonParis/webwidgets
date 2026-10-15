export type V1ReleaseState = 'stable' | 'beta';

const SUSPENDED_BETA_TYPES = new Set([
    'chess',
    'creative',
    'memorization',
    'reading',
]);

export function getV1ReleaseState(widgetType: string): V1ReleaseState {
    return SUSPENDED_BETA_TYPES.has(widgetType) ? 'beta' : 'stable';
}

export function isV1DefaultWidget(widgetType: string): boolean {
    return getV1ReleaseState(widgetType) === 'stable';
}
