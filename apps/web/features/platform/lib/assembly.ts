import type {
    AssemblyContext,
    WidgetEligibility,
} from '@/features/platform/types/assembly';
import type {
    WidgetAction,
    WidgetDefinition,
} from '@/features/platform/types/widget';
import { FEATURE_REGISTRY } from '@/features/platform/registry/featureRegistry';
import { WIDGET_REGISTRY } from '@/features/platform/registry/widgetRegistry';

export function recommendWidgetsForContext(context: AssemblyContext) {
    return WIDGET_REGISTRY.filter((widget) =>
        widget.goals.some((goal) => context.goals.includes(goal)),
    ).sort(
        (left, right) =>
            scoreWidget(right, context) - scoreWidget(left, context),
    );
}

export function resolveWidgetEligibility(
    widget: WidgetDefinition,
    context: AssemblyContext,
): WidgetEligibility {
    const feature = FEATURE_REGISTRY.find(
        (item) => item.id === widget.featureId,
    );
    const reasons: string[] = [];
    const missingPermissions = widget.permissions.filter(
        (permission) => !context.grantedPermissions.includes(permission),
    );
    const hiddenByBeta = widget.betaState !== 'stable' && !context.showBeta;
    const featureEnabled =
        !feature ||
        context.enabledFeatureIds.includes(feature.id) ||
        feature.goals.some((goal) => context.goals.includes(goal));
    const eligible =
        missingPermissions.length === 0 && !hiddenByBeta && featureEnabled;
    const visible =
        eligible &&
        (context.selectedWidgetIds.length === 0 ||
            context.selectedWidgetIds.includes(widget.id));

    if (missingPermissions.length > 0)
        reasons.push(`Needs consent: ${missingPermissions.join(', ')}`);
    if (hiddenByBeta)
        reasons.push('Beta or unfinished widget hidden by preference');
    if (!featureEnabled)
        reasons.push('Feature is not enabled for this workspace');

    return {
        widget,
        eligible,
        visible,
        reasons,
        availableActions: resolveActionAvailability(widget.actions, context),
    };
}

export function resolveWidgetVisibility(context: AssemblyContext) {
    return WIDGET_REGISTRY.map((widget) =>
        resolveWidgetEligibility(widget, context),
    );
}

export function resolveActionAvailability(
    actions: WidgetAction[],
    context: AssemblyContext,
) {
    return actions.filter(
        (action) =>
            !action.requiresConsent ||
            context.grantedPermissions.includes(action.requiresConsent),
    );
}

export function resolveFeatureDependencies(featureIds: string[]) {
    return FEATURE_REGISTRY.filter((feature) =>
        featureIds.includes(feature.id),
    ).flatMap((feature) => feature.requiredIntegrations ?? []);
}

function scoreWidget(widget: WidgetDefinition, context: AssemblyContext) {
    const goalScore =
        widget.goals.filter((goal) => context.goals.includes(goal)).length * 10;
    const selectedScore = context.selectedWidgetIds.includes(widget.id)
        ? 100
        : 0;
    const betaPenalty = widget.betaState === 'stable' ? 0 : 3;
    return goalScore + selectedScore - betaPenalty;
}
