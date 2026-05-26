import type {
    DueDose,
    DoseStatus,
    SupplementDefinition,
    SupplementLog,
    TimeOfDayGroup,
} from './types';

function dateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function timeMinutes(time: string): number {
    const [h = '0', m = '0'] = time.split(':');
    return Number(h) * 60 + Number(m);
}

function groupFor(time: string): TimeOfDayGroup {
    const minutes = timeMinutes(time);
    if (minutes < 12 * 60) return 'morning';
    if (minutes < 17 * 60) return 'afternoon';
    if (minutes < 21 * 60) return 'evening';
    return 'night';
}

function appliesOn(definition: SupplementDefinition, date: Date): boolean {
    const schedule = definition.schedule;
    if (schedule.paused || schedule.archived) return false;
    const key = dateKey(date);
    if (schedule.startDate && key < schedule.startDate) return false;
    if (schedule.endDate && key > schedule.endDate) return false;
    return schedule.daysOfWeek.includes(date.getDay());
}

function logMatches(
    log: SupplementLog,
    definition: SupplementDefinition,
    date: string,
    time: string,
): boolean {
    if (log.date !== date) return false;
    const sameSupplement =
        log.supplementId === definition.id ||
        log.name.toLowerCase() === definition.name.toLowerCase();
    if (!sameSupplement) return false;
    if (!log.time) return true;
    return Math.abs(timeMinutes(log.time) - timeMinutes(time)) <= 90;
}

export function calculateDueDoses(
    definitions: SupplementDefinition[],
    logs: SupplementLog[],
    reference = new Date(),
): DueDose[] {
    const date = dateKey(reference);
    const nowMinutes = reference.getHours() * 60 + reference.getMinutes();
    const due: DueDose[] = [];
    for (const definition of definitions) {
        if (!appliesOn(definition, reference)) continue;
        for (const time of definition.schedule.times) {
            const log = logs.find((candidate) =>
                logMatches(candidate, definition, date, time),
            );
            const status: DoseStatus =
                log?.status ??
                (timeMinutes(time) < nowMinutes ? 'missed' : 'planned');
            due.push({
                id: `${definition.id}-${date}-${time}`,
                supplement: definition,
                date,
                time,
                group: groupFor(time),
                status,
                overdue: status === 'missed',
                ...(log !== undefined && { log }),
            });
        }
    }
    return due.sort((a, b) => timeMinutes(a.time) - timeMinutes(b.time));
}

export function calculateNextDose(
    definitions: SupplementDefinition[],
    logs: SupplementLog[],
    reference = new Date(),
): DueDose | null {
    const today = calculateDueDoses(definitions, logs, reference).find(
        (dose) => dose.status === 'planned',
    );
    if (today) return today;
    for (let offset = 1; offset <= 14; offset += 1) {
        const next = new Date(reference);
        next.setDate(reference.getDate() + offset);
        next.setHours(0, 0, 0, 0);
        const due = calculateDueDoses(definitions, logs, next).find(
            (dose) => dose.status === 'planned' || dose.status === 'missed',
        );
        if (due) return { ...due, status: 'planned', overdue: false };
    }
    return null;
}

export function markMissedPlannedDoses(doses: DueDose[]): DueDose[] {
    return doses.map((dose) =>
        dose.status === 'planned' && dose.overdue
            ? { ...dose, status: 'missed' }
            : dose,
    );
}

export function scheduleLabel(definition: SupplementDefinition): string {
    const days =
        definition.schedule.daysOfWeek.length === 7
            ? 'Daily'
            : `${definition.schedule.daysOfWeek.length} days/week`;
    const food = definition.schedule.takeWithFood
        ? ' · with food'
        : definition.schedule.takeOnEmptyStomach
          ? ' · empty stomach'
          : '';
    return `${days} · ${definition.schedule.times.join(', ')}${food}`;
}
