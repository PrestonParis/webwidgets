// Anatomical body-region registry — public API.
// Data is split into regions/ sub-files to stay under the 300-LOC limit.

export type {
    RegionSide,
    RegionView,
    TissueType,
    BodyRegion,
} from '@/features/tracking/health/types/regions';
import type { BodyRegion } from '@/features/tracking/health/types/regions';

import { FRONT_UPPER_REGIONS } from './regions/frontUpperRegions';
import {
    FRONT_LOWER_REGIONS,
    TOOTH_REGIONS,
} from './regions/frontLowerRegions';
import { BACK_REGIONS } from './regions/backRegions';
import { BONE_REGIONS } from './regions/boneRegions';
import { TENDON_REGIONS, NERVE_REGIONS } from './regions/nerveAndTendonRegions';

export const BODY_REGIONS: BodyRegion[] = [
    ...FRONT_UPPER_REGIONS,
    ...FRONT_LOWER_REGIONS,
    ...BACK_REGIONS,
    ...TOOTH_REGIONS,
    ...BONE_REGIONS,
    ...TENDON_REGIONS,
    ...NERVE_REGIONS,
];

export const BODY_REGION_MAP: Record<string, BodyRegion> = BODY_REGIONS.reduce(
    (acc, region) => {
        acc[region.id] = region;
        return acc;
    },
    {} as Record<string, BodyRegion>,
);

export function getRegionsByView(view: 'front' | 'back'): BodyRegion[] {
    return BODY_REGIONS.filter(
        (region) => region.view === view || region.view === 'both',
    );
}

export function getRegion(regionId: string): BodyRegion | undefined {
    return BODY_REGION_MAP[regionId];
}

export function getRegionLabel(regionId: string): string {
    return BODY_REGION_MAP[regionId]?.displayName ?? regionId;
}

export function getAdjacentRegions(regionId: string): BodyRegion[] {
    const region = BODY_REGION_MAP[regionId];
    if (!region) return [];
    return BODY_REGIONS.filter(
        (candidate) =>
            candidate.id !== region.id &&
            candidate.view === region.view &&
            candidate.parentRegion !== undefined &&
            candidate.parentRegion === region.parentRegion,
    );
}

export function searchRegions(query: string): BodyRegion[] {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return BODY_REGIONS.filter(
        (region) =>
            region.displayName.toLowerCase().includes(term) ||
            region.id.includes(term) ||
            region.aliases.some((alias) => alias.toLowerCase().includes(term)),
    );
}

export function isBodyRegionId(value: string): boolean {
    return value in BODY_REGION_MAP;
}
