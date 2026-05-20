import type { ViewAnnotation } from '@/features/view/schemas/viewSchemas';

export function createAnnotation(
    input: Omit<ViewAnnotation, 'id' | 'createdAt'>,
): ViewAnnotation {
    return {
        ...input,
        id: `annotation-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
    };
}

export function addAnnotation(
    annotations: ViewAnnotation[],
    annotation: ViewAnnotation,
) {
    return [...annotations, annotation];
}

export function removeAnnotation(
    annotations: ViewAnnotation[],
    annotationId: string,
) {
    return annotations.filter((annotation) => annotation.id !== annotationId);
}
