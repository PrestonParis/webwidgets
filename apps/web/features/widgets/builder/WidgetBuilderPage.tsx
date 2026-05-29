'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWidgetBuilder } from '@/features/widgets/builder/hooks/useWidgetBuilder';
import { WidgetBuilderStepper } from '@/features/widgets/builder/WidgetBuilderStepper';
import { PurposeStep } from '@/features/widgets/builder/steps/PurposeStep';
import { DataSourceStep } from '@/features/widgets/builder/steps/DataSourceStep';
import { TransformStep } from '@/features/widgets/builder/steps/TransformStep';
import { LayoutStep } from '@/features/widgets/builder/steps/LayoutStep';
import { ComponentStep } from '@/features/widgets/builder/steps/ComponentStep';
import { ActionStep } from '@/features/widgets/builder/steps/ActionStep';
import { PermissionReviewStep } from '@/features/widgets/builder/steps/PermissionReviewStep';
import { PreviewTestStep } from '@/features/widgets/builder/steps/PreviewTestStep';
import { SaveWidgetStep } from '@/features/widgets/builder/steps/SaveWidgetStep';
import { BUILDER_STEPS } from '@/features/widgets/synthesis/widgetConstants';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

interface WidgetBuilderPageProps {
    onSave?: (def: SynthesizedWidgetDefinition) => void;
}

function renderStep(
    stepId: string,
    definition: Partial<SynthesizedWidgetDefinition>,
    state: ReturnType<typeof useWidgetBuilder>[0],
    actions: ReturnType<typeof useWidgetBuilder>[1],
    onSave: () => void,
) {
    switch (stepId) {
        case 'purpose':
            return (
                <PurposeStep
                    definition={definition}
                    nlQuery={state.nlQuery}
                    onUpdate={actions.updateDefinition}
                    onNlQuery={actions.setNlQuery}
                    onLoadSuggestion={actions.loadDefinition}
                />
            );
        case 'data_source':
            return (
                <DataSourceStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'transform':
            return (
                <TransformStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'layout':
            return (
                <LayoutStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'components':
            return (
                <ComponentStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'actions':
        case 'automations':
            return (
                <ActionStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'permissions':
            return (
                <PermissionReviewStep
                    definition={definition}
                    onUpdate={actions.updateDefinition}
                />
            );
        case 'preview':
            return (
                <PreviewTestStep
                    definition={definition}
                    previewMode={state.previewMode}
                    onPreviewMode={actions.setPreviewMode}
                />
            );
        case 'save':
            return (
                <SaveWidgetStep
                    definition={definition}
                    isValid={state.isValid}
                    onUpdate={actions.updateDefinition}
                    onSave={onSave}
                />
            );
        default:
            return null;
    }
}

export function WidgetBuilderPage({ onSave }: WidgetBuilderPageProps) {
    const [state, actions] = useWidgetBuilder();
    const searchParams = useSearchParams();
    const stepConfig = useMemo(
        () => BUILDER_STEPS.find((s) => s.id === state.stepId),
        [state.stepId],
    );

    useEffect(() => {
        const intent = searchParams.get('intent');
        if (intent && !state.nlQuery) actions.setNlQuery(intent);
    }, [actions, searchParams, state.nlQuery]);

    const handleSave = () => {
        onSave?.(state.definition as SynthesizedWidgetDefinition);
    };

    const isFirstStep = state.stepIndex === 0;
    const isLastStep = state.stepIndex === BUILDER_STEPS.length - 1;
    const complexityColor =
        state.definition.metadata?.complexity === 'advanced'
            ? 'border-red-700 text-red-400 bg-red-950/20'
            : state.definition.metadata?.complexity === 'moderate'
              ? 'border-amber-700 text-amber-400 bg-amber-950/20'
              : 'border-emerald-700 text-emerald-400 bg-emerald-950/20';

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
            <aside className="w-56 shrink-0 border-r border-zinc-800 p-4 flex flex-col gap-5 overflow-y-auto">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">
                        Widget Builder
                    </p>
                    <p className="text-[10px] text-zinc-600">
                        Step {state.stepIndex + 1} of {BUILDER_STEPS.length}
                    </p>
                </div>

                <WidgetBuilderStepper
                    currentStepId={state.stepId}
                    currentStepIndex={state.stepIndex}
                    onGoToStep={actions.goToStep}
                />

                {state.validationIssues.some((i) => i.severity === 'error') && (
                    <div className="rounded-xl border border-red-800 bg-red-950/20 p-3">
                        <p className="text-[10px] font-semibold text-red-500 mb-1">
                            Errors (
                            {
                                state.validationIssues.filter(
                                    (i) => i.severity === 'error',
                                ).length
                            }
                            )
                        </p>
                        {state.validationIssues
                            .filter((i) => i.severity === 'error')
                            .slice(0, 3)
                            .map((issue, i) => (
                                <p
                                    key={i}
                                    className="text-[10px] text-red-400/80"
                                >
                                    ✕ {issue.message}
                                </p>
                            ))}
                    </div>
                )}
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 shrink-0">
                    <div>
                        <p className="text-sm font-semibold text-zinc-200">
                            {stepConfig?.label ?? state.stepId}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {stepConfig?.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {stepConfig?.optional && (
                            <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                                optional
                            </span>
                        )}
                        {state.definition.metadata?.complexity && (
                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize border ${complexityColor}`}
                            >
                                {state.definition.metadata.complexity}
                            </span>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {renderStep(
                        state.stepId,
                        state.definition,
                        state,
                        actions,
                        handleSave,
                    )}
                </div>

                <footer className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
                    <button
                        onClick={actions.prevStep}
                        disabled={isFirstStep}
                        className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Back
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={actions.reset}
                            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            Reset
                        </button>
                        {!isLastStep && (
                            <button
                                onClick={actions.nextStep}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors"
                            >
                                Continue →
                            </button>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    );
}
