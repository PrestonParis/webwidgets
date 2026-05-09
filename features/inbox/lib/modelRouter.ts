import type { EmailInput, EmailCategory } from '@/features/inbox/types/inbox';
import { classifyWithRules } from './rules';
import { classifyWithMlService } from './mlService';
import { classifyWithClaude } from './claude';
import { getLogger } from '@/lib/observability/logger';
import {
    mlInferenceDuration,
    mlInferenceTotal,
} from '@/lib/observability/metrics';

export interface RouterOptions {
    apiKey?: string;
    allowHosted?: boolean;
}

/**
 * Three-stage inference chain: cheap local rules → local ML → hosted Claude.
 * Each stage only runs if the prior stage returned 'other' for some inputs.
 */
export async function routeInference(
    emails: EmailInput[],
    options: RouterOptions = {},
): Promise<Map<number, EmailCategory>> {
    const log = getLogger({ operation: 'routeInference' });
    log.debug({ emailCount: emails.length }, 'Starting inference chain');

    const result = classifyWithRules(emails);
    const ruleResolved = emails.filter(
        (e) => result.get(e.idx) !== 'other',
    ).length;
    mlInferenceTotal.inc({ stage: 'rules', outcome: 'resolved' }, ruleResolved);
    mlInferenceTotal.inc(
        { stage: 'rules', outcome: 'unresolved' },
        emails.length - ruleResolved,
    );

    const needsMl = emails.filter((e) => result.get(e.idx) === 'other');
    if (needsMl.length === 0) {
        log.debug({ resolved: emails.length }, 'All emails resolved by rules');
        return result;
    }

    let needsHosted = needsMl;
    const mlEnd = mlInferenceDuration.startTimer({ stage: 'ml' });
    try {
        const mlResult = await classifyWithMlService(needsMl);
        mlEnd();

        const stillUnclear: EmailInput[] = [];
        let mlResolved = 0;
        for (const e of needsMl) {
            const cat = mlResult.get(e.idx);
            if (cat && cat !== 'other') {
                result.set(e.idx, cat);
                mlResolved++;
            } else {
                stillUnclear.push(e);
            }
        }
        mlInferenceTotal.inc({ stage: 'ml', outcome: 'resolved' }, mlResolved);
        mlInferenceTotal.inc(
            { stage: 'ml', outcome: 'unresolved' },
            stillUnclear.length,
        );
        log.debug(
            { mlResolved, remaining: stillUnclear.length },
            'ML inference complete',
        );
        needsHosted = stillUnclear;
    } catch (err) {
        mlEnd();
        mlInferenceTotal.inc({ stage: 'ml', outcome: 'error' });
        log.warn(
            { err },
            'ML service unavailable — escalating to hosted model',
        );
    }

    if (needsHosted.length === 0 || !options.allowHosted) return result;

    const claudeEnd = mlInferenceDuration.startTimer({ stage: 'claude' });
    try {
        const claudeResult = await classifyWithClaude(
            needsHosted,
            options.apiKey,
        );
        claudeEnd();
        let claudeResolved = 0;
        for (const [idx, cat] of claudeResult) {
            result.set(idx, cat);
            claudeResolved++;
        }
        mlInferenceTotal.inc(
            { stage: 'claude', outcome: 'resolved' },
            claudeResolved,
        );
        log.debug({ claudeResolved }, 'Claude inference complete');
    } catch (err) {
        claudeEnd();
        mlInferenceTotal.inc({ stage: 'claude', outcome: 'error' });
        log.warn(
            { err },
            'Claude inference failed — leaving unresolved as other',
        );
    }

    return result;
}
