import type {
    ExerciseEntry,
    WorkoutSession,
} from '@/features/tracking/types/fitness';
import type { WorkoutTemplate } from '@/features/tracking/types/fitnessTemplates';
import { calculateWorkoutTotals } from '../normalize';

export function buildManualWorkout(input: {
    id?: string;
    date: string;
    title: string;
    workoutType: WorkoutSession['workoutType'];
    durationMinutes: number;
    exercises: ExerciseEntry[];
    notes?: string;
}): Omit<WorkoutSession, 'rawEntry'> {
    const totals = calculateWorkoutTotals(input.exercises);
    return {
        id: input.id ?? `manual-${input.date}-${Date.now()}`,
        date: input.date,
        durationMinutes: input.durationMinutes,
        workoutType: input.workoutType,
        title: input.title,
        exercises: input.exercises,
        ...totals,
        ...(input.notes !== undefined && { notes: input.notes }),
        tags: [],
        source: 'manual',
        createdAt: new Date().toISOString(),
    };
}

export function workoutFromTemplate(
    template: WorkoutTemplate,
    date: string,
): Omit<WorkoutSession, 'rawEntry'> {
    const exercises: ExerciseEntry[] = template.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        category: 'strength',
        muscleGroups: [],
        equipment: [],
        sets: exercise.targetSets.map((set) => ({
            setType: set.setType,
            completed: false,
            ...(set.reps !== undefined && { reps: set.reps }),
            ...(set.weight !== undefined && { weight: set.weight }),
            ...(set.durationSeconds !== undefined && {
                durationSeconds: set.durationSeconds,
            }),
            ...(set.distance !== undefined && { distance: set.distance }),
            ...(set.rpe !== undefined && { rpe: set.rpe }),
        })),
        ...(exercise.notes !== undefined && { notes: exercise.notes }),
    }));
    return buildManualWorkout({
        date,
        title: template.name,
        workoutType: template.workoutType,
        durationMinutes: 0,
        exercises,
    });
}
