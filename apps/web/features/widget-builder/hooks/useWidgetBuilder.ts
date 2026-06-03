import { useState, useCallback, useMemo } from 'react';
import type { WidgetBuilderState } from '@/features/widgets/synthesis/widgetBuilderInterfaces';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import type {
    WidgetBuilderStepId,
    WidgetPreviewMode,
} from '@/features/widgets/types/synthesisWidgets';
import { BUILDER_STEPS } from '@/features/widgets/synthesis/widgetConstants';
import {
    validateWidgetDefinition,
    hasErrors,
} from '@/features/widgets/synthesis/widgetValidation';
import {
    createEmptyDefinition,
    estimateComplexity,
    serializeDefinition,
} from '@/features/widgets/synthesis/widgetAssemblyEngine';
import { computeRequiredPermissions } from '@/features/widgets/synthesis/widgetAssemblyEngine';

const STEP_IDS = BUILDER_STEPS.map((s) => s.id);

function makeInitialState(): WidgetBuilderState {
    return {
        stepId: 'purpose',
        stepIndex: 0,
        definition: createEmptyDefinition(),
        nlQuery: '',
        isDirty: false,
        isValid: false,
        validationIssues: [],
        previewMode: 'compact',
        visitedStepIds: ['purpose'],
    };
}

export interface WidgetBuilderActions {
    updateDefinition: (patch: Partial<SynthesizedWidgetDefinition>) => void;
    setNlQuery: (q: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (id: WidgetBuilderStepId) => void;
    setPreviewMode: (mode: WidgetPreviewMode) => void;
    reset: () => void;
    loadDefinition: (def: SynthesizedWidgetDefinition) => void;
    exportDefinition: () => string;
}

export function useWidgetBuilder(): [WidgetBuilderState, WidgetBuilderActions] {
    const [state, setState] = useState<WidgetBuilderState>(makeInitialState);

    const updateDefinition = useCallback(
        (patch: Partial<SynthesizedWidgetDefinition>) => {
            setState((prev) => {
                const next = {
                    ...prev.definition,
                    ...patch,
                } as SynthesizedWidgetDefinition;
                const requiredPermissions = computeRequiredPermissions(next);
                const withPermissions = {
                    ...next,
                    permissions: [
                        ...(next.permissions ?? []).filter(
                            (p) =>
                                !requiredPermissions.find(
                                    (r) => r.scope === p.scope,
                                ),
                        ),
                        ...requiredPermissions,
                    ],
                };
                const complexity = estimateComplexity(withPermissions);
                const updated: SynthesizedWidgetDefinition = {
                    ...withPermissions,
                    metadata: { ...withPermissions.metadata, complexity },
                };
                const validationIssues = validateWidgetDefinition(updated);
                return {
                    ...prev,
                    definition: updated,
                    isDirty: true,
                    validationIssues,
                    isValid: !hasErrors(validationIssues),
                };
            });
        },
        [],
    );

    const setNlQuery = useCallback((nlQuery: string) => {
        setState((prev) => ({ ...prev, nlQuery }));
    }, []);

    const nextStep = useCallback(() => {
        setState((prev) => {
            const nextIndex = Math.min(
                prev.stepIndex + 1,
                BUILDER_STEPS.length - 1,
            );
            const nextId = STEP_IDS[nextIndex] ?? prev.stepId;
            const visitedStepIds = prev.visitedStepIds.includes(nextId)
                ? prev.visitedStepIds
                : [...prev.visitedStepIds, nextId];
            return {
                ...prev,
                stepIndex: nextIndex,
                stepId: nextId,
                visitedStepIds,
            };
        });
    }, []);

    const prevStep = useCallback(() => {
        setState((prev) => {
            const prevIndex = Math.max(prev.stepIndex - 1, 0);
            const prevId = STEP_IDS[prevIndex] ?? prev.stepId;
            return { ...prev, stepIndex: prevIndex, stepId: prevId };
        });
    }, []);

    const goToStep = useCallback((id: WidgetBuilderStepId) => {
        setState((prev) => {
            const index = STEP_IDS.indexOf(id);
            if (index < 0) return prev;
            const visitedStepIds = prev.visitedStepIds.includes(id)
                ? prev.visitedStepIds
                : [...prev.visitedStepIds, id];
            return { ...prev, stepIndex: index, stepId: id, visitedStepIds };
        });
    }, []);

    const setPreviewMode = useCallback((previewMode: WidgetPreviewMode) => {
        setState((prev) => ({ ...prev, previewMode }));
    }, []);

    const reset = useCallback(() => {
        setState(makeInitialState());
    }, []);

    const loadDefinition = useCallback((def: SynthesizedWidgetDefinition) => {
        const issues = validateWidgetDefinition(def);
        setState((prev) => ({
            ...prev,
            definition: def,
            validationIssues: issues,
            isValid: !hasErrors(issues),
            isDirty: false,
        }));
    }, []);

    const exportDefinition = useCallback(() => {
        return serializeDefinition(
            state.definition as SynthesizedWidgetDefinition,
        );
    }, [state.definition]);

    const actions = useMemo<WidgetBuilderActions>(
        () => ({
            updateDefinition,
            setNlQuery,
            nextStep,
            prevStep,
            goToStep,
            setPreviewMode,
            reset,
            loadDefinition,
            exportDefinition,
        }),
        [
            updateDefinition,
            setNlQuery,
            nextStep,
            prevStep,
            goToStep,
            setPreviewMode,
            reset,
            loadDefinition,
            exportDefinition,
        ],
    );

    return [state, actions];
}
