import type { DeveloperToolDefinition } from '@/features/developer/types/developer';

export function canUseDeveloperTool(
    tool: DeveloperToolDefinition,
    grantedLocalAccess: boolean,
) {
    if (tool.state === 'unavailable') return false;
    if (tool.requiresLocalAccess) return grantedLocalAccess;
    return true;
}
