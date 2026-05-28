import type { Json } from '@/types/supabase';
import type { ConfidenceScore } from '@/features/intelligence/types/inference';
import type {
    ActionCategory,
    ApprovalState,
    DestructiveLevel,
    Mutability,
    ProviderScope,
    Queueability,
} from '@/features/actions/lib/schemas/actionEnumSchemas';
import type { ActionRequestEnvelope } from '@/features/actions/lib/schemas/actionPayloadSchemas';
import type { ActionEngineResult } from '@/features/actions/lib/schemas/actionResultSchemas';
import type { ActionDefinition } from '@/features/actions/lib/schemas/definitionSchemas';

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
