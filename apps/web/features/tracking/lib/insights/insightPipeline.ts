import type { InsightProvider } from '@/features/tracking/types/insightProviders';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type {
    Insight,
    InsightConsent,
    InsightContext,
} from '@/features/tracking/types/insights';
import { RuleBasedInsightProvider } from './ruleBasedProvider';
import { AIInsightProvider } from './aiProvider';

export class InsightPipeline {
    private providers: InsightProvider[];

    constructor(providers: InsightProvider[]) {
        this.providers = providers;
    }

    async run(
        entries: TrackingEntry[],
        consent: InsightConsent,
        context: InsightContext,
    ): Promise<Insight[]> {
        const eligible = this.providers.filter((p) =>
            p.canProvide(entries, consent),
        );
        const results = await Promise.all(
            eligible.map((p) => p.analyze(entries, context)),
        );
        const flat = results.flat();

        const seen = new Set<string>();
        return flat.filter((insight) => {
            if (seen.has(insight.title)) return false;
            seen.add(insight.title);
            return true;
        });
    }
}

export function createDefaultPipeline(): InsightPipeline {
    return new InsightPipeline([
        new RuleBasedInsightProvider(),
        new AIInsightProvider(),
    ]);
}
