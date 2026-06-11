import type { BodyIssue } from '@/features/tracking/health/lib/bodyIssues';
import type { RegionGeometry } from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import type { RegionVisual } from '@/features/tracking/health/lib/visuals/regionVisual';

export type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

export interface BodyViewProps {
    view: 'front' | 'back';
    label: string;
    geometry: RegionGeometry[];
    activeView: AnatomyView;
    visuals: Record<string, RegionVisual>;
    issues?: BodyIssue[];
    surfaceMode: boolean;
    selectedRegionId: string | null | undefined;
    readonly: boolean;
    showLabels: boolean;
    showSkeleton: boolean;
    showMuscles: boolean;
    onActivate: (id: string) => void;
    onSurfaceClick?: (view: 'front' | 'back', x: number, y: number) => void;
    onSurfaceDrawing?: (
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) => void;
    onHover: (id: string | null) => void;
}

export type SurfacePoint = { x: number; y: number };
