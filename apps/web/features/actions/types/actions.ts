import type { Json } from '@/types/supabase';
import type { ConfidenceScore } from '@/features/intelligence/types/inferenceTypes';
import type {
    ActionCategory,
    ApprovalState,
    DestructiveLevel,
    Mutability,
    ProviderScope,
    Queueability,
} from '@/features/actions/schemas/actionEnumSchemas';
import type { ActionRequestEnvelope } from '@/features/actions/schemas/actionPayloadSchemas';
import type { ActionEngineResult } from '@/features/actions/schemas/actionResultSchemas';
import type { ActionDefinition } from '@/features/actions/schemas/definitionSchemas';

export type {
    ActionCategory,
    ActionDefinition,
    ApprovalState,
    DestructiveLevel,
    Mutability,
    ProviderScope,
    Queueability,
    ActionEngineResult,
    ActionRequestEnvelope,
};

export interface ActionRequest {
    userId: string;
    actionId: string;
    sourceWidgetId?: string;
    payload: Json;
    approvalState: ApprovalState;
    confidence?: ConfidenceScore;
}

export interface ActionResult {
    ok: boolean;
    message: string;
    auditEventId?: string;
    rollbackToken?: string;
    engineResult?: ActionEngineResult;
}
