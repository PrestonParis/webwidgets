import type { SmartLayerScenario } from '@/features/intelligence/testing/scenarios';

export interface ScenarioReplayResult {
    scenarioId: string;
    passed: boolean;
    notes: string[];
}

export function replayScenarioExpectations(
    scenario: SmartLayerScenario,
    actualRecommendations: string[],
): ScenarioReplayResult {
    const missing = scenario.expectedRecommendations.filter(
        (item) => !actualRecommendations.includes(item),
    );
    return {
        scenarioId: scenario.id,
        passed: missing.length === 0,
        notes: missing.map(
            (item) => `Missing expected recommendation: ${item}`,
        ),
    };
}
