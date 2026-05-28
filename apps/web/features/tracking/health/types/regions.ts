export type RegionSide = 'left' | 'right' | 'center';
export type RegionView = 'front' | 'back' | 'both';
export type TissueType =
    | 'surface'
    | 'muscle'
    | 'tendon'
    | 'bone'
    | 'nerve'
    | 'tooth'
    | 'general';

export interface BodyRegion {
    id: string;
    displayName: string;
    side: RegionSide;
    view: RegionView;
    parentRegion?: string;
    supportedTissueTypes: TissueType[];
    svgPathId: string;
    aliases: string[];
    mirrorRegionId?: string;
}

export const LIMB_TISSUE: TissueType[] = [
    'surface',
    'muscle',
    'tendon',
    'bone',
    'nerve',
    'general',
];
export const JOINT_TISSUE: TissueType[] = [
    'surface',
    'tendon',
    'bone',
    'nerve',
    'general',
];
export const MUSCLE_TISSUE: TissueType[] = [
    'muscle',
    'tendon',
    'surface',
    'general',
];
export const BONE_TISSUE: TissueType[] = [
    'bone',
    'surface',
    'tendon',
    'general',
];
export const HEAD_TISSUE: TissueType[] = [
    'surface',
    'bone',
    'nerve',
    'general',
];
export const CORE_TISSUE: TissueType[] = [
    'muscle',
    'surface',
    'nerve',
    'general',
];
