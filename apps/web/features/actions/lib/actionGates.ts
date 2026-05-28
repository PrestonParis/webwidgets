import { err, ok, type Result } from 'neverthrow';
import type { ActionDefinition } from '@/features/actions/lib/schemas/definitionSchemas';
import type { ActionExecutionContext } from '@/features/actions/lib/schemas/actionPayloadSchemas';

export type PermissionError = {
    code: 'PermissionDenied';
    message: string;
};

export function evaluateActionGate(
    definition: ActionDefinition,
    context: ActionExecutionContext,
): Result<true, PermissionError> {
    if (context.approvalState === 'denied') {
        return err({
            code: 'PermissionDenied',
            message: 'Action approval was denied',
        });
    }

    const requiresApproval =
        definition.destructiveLevel !== 'safe' ||
        definition.mutability === 'state-altering' ||
        definition.requiredConsents.length > 0 ||
        definition.requiredPermissions.length > 0;

    if (requiresApproval && context.approvalState !== 'approved') {
        return err({
            code: 'PermissionDenied',
            message: `${definition.label} requires approval before execution`,
        });
    }

    return ok(true);
}
