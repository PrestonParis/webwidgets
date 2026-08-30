import type {
    Candidate,
    CommandTask,
    SourceHealth,
    TimelineChange,
} from '../types/commandCenter';

const IMPAIRED = new Set(['stale', 'failing', 'reconnect_required']);

export function changesSince(
    items: TimelineChange[],
    lastSeenAt: string | null,
) {
    if (!lastSeenAt) return items;
    return items.filter((item) => item.occurredAt > lastSeenAt);
}

export function pendingCandidates(items: Candidate[]) {
    return items.filter((item) =>
        ['proposed', 'edited', 'approved'].includes(item.state),
    );
}

export function nextTasks(items: CommandTask[]) {
    return items
        .filter((item) => !item.completed)
        .toSorted((left, right) =>
            (left.due_at ?? '9999').localeCompare(right.due_at ?? '9999'),
        );
}

export function impairedSources(items: SourceHealth[]) {
    return items.filter((item) => IMPAIRED.has(item.health));
}

export function candidateOutcomes(items: Candidate[]) {
    return items.filter(
        (item) =>
            item.execution && ['completed', 'failed'].includes(item.state),
    );
}
