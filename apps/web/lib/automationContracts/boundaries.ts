import {
    createCapabilityRequestSchema,
    capabilityResultSchema,
} from './capabilities';
import { automationEventSchema } from './events';
import { approvalDecisionRequestSchema } from './governance';
import {
    cancelObjectiveRequestSchema,
    createObjectiveRequestSchema,
    createPublishPlanRequestSchema,
    objectiveBudgetSchema,
    objectivePlanSchema,
} from './objectives';
import { verificationResultSchema } from './capabilities';

export function createAutomationContractSet(
    knownCapabilityNames: ReadonlySet<string>,
) {
    const capabilityRequest =
        createCapabilityRequestSchema(knownCapabilityNames);
    const publishPlan = createPublishPlanRequestSchema(knownCapabilityNames);
    return Object.freeze({
        web: Object.freeze({
            createObjective: createObjectiveRequestSchema,
            cancelObjective: cancelObjectiveRequestSchema,
            decideApproval: approvalDecisionRequestSchema,
            publishedPlan: objectivePlanSchema,
            publishPlan,
            budget: objectiveBudgetSchema,
        }),
        worker: Object.freeze({
            event: automationEventSchema,
            capabilityRequest,
            capabilityResult: capabilityResultSchema,
            verificationResult: verificationResultSchema,
        }),
    });
}
