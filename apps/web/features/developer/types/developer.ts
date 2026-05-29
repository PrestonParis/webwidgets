export type DeveloperToolState =
    | 'unavailable'
    | 'beta'
    | 'available'
    | 'requires_permission';

export interface DeveloperToolDefinition {
    id: string;
    title: string;
    description: string;
    state: DeveloperToolState;
    requiresLocalAccess: boolean;
}
