import type { SurfacePoint } from '@/features/tracking/health/types/bodyView';

export function pointsToSurfacePath(points: SurfacePoint[]) {
    return points
        .map(
            (point, index) =>
                `${index === 0 ? 'M' : 'L'}${(point.x * 1.2).toFixed(2)} ${(point.y * 2.6).toFixed(2)}`,
        )
        .join(' ');
}
