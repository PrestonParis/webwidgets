// Anatomical body-region registry for the interactive injury / soreness map.
//
// Every region rendered on the SVG body map has a single source-of-truth entry
// here. SVG path geometry lives in the AnatomicalBodyMap component; this file is
// the pure data layer (no React, no DOM) that the component, analytics, and
// search all consume.

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
    /** Stable identifier, e.g. 'left-quad-front', 'spine-upper-back'. */
    id: string;
    /** Human-readable label, e.g. 'Left Quadricep'. */
    displayName: string;
    side: RegionSide;
    /** Which anatomical view the region appears in. */
    view: RegionView;
    /** Parent grouping (e.g. 'left-leg') for roll-ups. */
    parentRegion?: string;
    /** Tissue types that can plausibly be injured in this region. */
    supportedTissueTypes: TissueType[];
    /** CSS id applied to the corresponding SVG <path>/<ellipse>. */
    svgPathId: string;
    /** Search aliases, e.g. ['quad', 'thigh', 'quadricep']. */
    aliases: string[];
    /** The opposite side's region id, when one exists. */
    mirrorRegionId?: string;
}

// Tissue-type presets used across most regions.
const LIMB_TISSUE: TissueType[] = [
    'surface',
    'muscle',
    'tendon',
    'bone',
    'nerve',
    'general',
];
const JOINT_TISSUE: TissueType[] = [
    'surface',
    'tendon',
    'bone',
    'nerve',
    'general',
];
const MUSCLE_TISSUE: TissueType[] = ['muscle', 'tendon', 'surface', 'general'];
const BONE_TISSUE: TissueType[] = ['bone', 'surface', 'tendon', 'general'];
const HEAD_TISSUE: TissueType[] = ['surface', 'bone', 'nerve', 'general'];
const CORE_TISSUE: TissueType[] = ['muscle', 'surface', 'nerve', 'general'];

// ─── front (anterior) regions ───────────────────────────────────────────────

const FRONT_REGIONS: BodyRegion[] = [
    {
        id: 'head-front',
        displayName: 'Head (Front)',
        side: 'center',
        view: 'front',
        supportedTissueTypes: HEAD_TISSUE,
        svgPathId: 'rg-head-front',
        aliases: ['head', 'face', 'forehead', 'skull'],
    },
    {
        id: 'left-eye-front',
        displayName: 'Left Eye',
        side: 'left',
        view: 'front',
        parentRegion: 'head-front',
        supportedTissueTypes: ['surface', 'nerve', 'general'],
        svgPathId: 'rg-left-eye-front',
        aliases: ['eye', 'left eye', 'eyelid', 'orbit', 'vision'],
        mirrorRegionId: 'right-eye-front',
    },
    {
        id: 'right-eye-front',
        displayName: 'Right Eye',
        side: 'right',
        view: 'front',
        parentRegion: 'head-front',
        supportedTissueTypes: ['surface', 'nerve', 'general'],
        svgPathId: 'rg-right-eye-front',
        aliases: ['eye', 'right eye', 'eyelid', 'orbit', 'vision'],
        mirrorRegionId: 'left-eye-front',
    },
    {
        id: 'nose-front',
        displayName: 'Nose',
        side: 'center',
        view: 'front',
        parentRegion: 'head-front',
        supportedTissueTypes: ['surface', 'bone', 'nerve', 'general'],
        svgPathId: 'rg-nose-front',
        aliases: ['nose', 'nasal', 'sinus'],
    },
    {
        id: 'mouth-front',
        displayName: 'Mouth / Jaw',
        side: 'center',
        view: 'front',
        parentRegion: 'head-front',
        supportedTissueTypes: ['surface', 'bone', 'nerve', 'tooth', 'general'],
        svgPathId: 'rg-mouth-front',
        aliases: ['mouth', 'jaw', 'mandible', 'teeth', 'tooth', 'gum'],
    },
    {
        id: 'neck-front',
        displayName: 'Neck (Front)',
        side: 'center',
        view: 'front',
        supportedTissueTypes: [
            'muscle',
            'tendon',
            'nerve',
            'surface',
            'general',
        ],
        svgPathId: 'rg-neck-front',
        aliases: ['neck', 'throat', 'cervical'],
    },
    {
        id: 'left-shoulder-front',
        displayName: 'Left Shoulder',
        side: 'left',
        view: 'front',
        parentRegion: 'left-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-shoulder-front',
        aliases: ['shoulder', 'deltoid', 'delt', 'rotator cuff'],
        mirrorRegionId: 'right-shoulder-front',
    },
    {
        id: 'right-shoulder-front',
        displayName: 'Right Shoulder',
        side: 'right',
        view: 'front',
        parentRegion: 'right-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-shoulder-front',
        aliases: ['shoulder', 'deltoid', 'delt', 'rotator cuff'],
        mirrorRegionId: 'left-shoulder-front',
    },
    {
        id: 'left-upper-arm-front',
        displayName: 'Left Upper Arm',
        side: 'left',
        view: 'front',
        parentRegion: 'left-arm',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-upper-arm-front',
        aliases: ['bicep', 'biceps', 'upper arm', 'arm'],
        mirrorRegionId: 'right-upper-arm-front',
    },
    {
        id: 'right-upper-arm-front',
        displayName: 'Right Upper Arm',
        side: 'right',
        view: 'front',
        parentRegion: 'right-arm',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-upper-arm-front',
        aliases: ['bicep', 'biceps', 'upper arm', 'arm'],
        mirrorRegionId: 'left-upper-arm-front',
    },
    {
        id: 'left-forearm-front',
        displayName: 'Left Forearm',
        side: 'left',
        view: 'front',
        parentRegion: 'left-arm',
        supportedTissueTypes: LIMB_TISSUE,
        svgPathId: 'rg-left-forearm-front',
        aliases: ['forearm', 'wrist flexor', 'arm'],
        mirrorRegionId: 'right-forearm-front',
    },
    {
        id: 'right-forearm-front',
        displayName: 'Right Forearm',
        side: 'right',
        view: 'front',
        parentRegion: 'right-arm',
        supportedTissueTypes: LIMB_TISSUE,
        svgPathId: 'rg-right-forearm-front',
        aliases: ['forearm', 'wrist flexor', 'arm'],
        mirrorRegionId: 'left-forearm-front',
    },
    {
        id: 'left-hand-front',
        displayName: 'Left Hand',
        side: 'left',
        view: 'front',
        parentRegion: 'left-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-hand-front',
        aliases: ['hand', 'palm', 'fingers', 'wrist'],
        mirrorRegionId: 'right-hand-front',
    },
    {
        id: 'right-hand-front',
        displayName: 'Right Hand',
        side: 'right',
        view: 'front',
        parentRegion: 'right-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-hand-front',
        aliases: ['hand', 'palm', 'fingers', 'wrist'],
        mirrorRegionId: 'left-hand-front',
    },
    {
        id: 'chest-left',
        displayName: 'Left Chest',
        side: 'left',
        view: 'front',
        parentRegion: 'chest',
        supportedTissueTypes: ['muscle', 'surface', 'bone', 'general'],
        svgPathId: 'rg-chest-left',
        aliases: ['chest', 'pec', 'pectoral', 'breast'],
        mirrorRegionId: 'chest-right',
    },
    {
        id: 'chest-right',
        displayName: 'Right Chest',
        side: 'right',
        view: 'front',
        parentRegion: 'chest',
        supportedTissueTypes: ['muscle', 'surface', 'bone', 'general'],
        svgPathId: 'rg-chest-right',
        aliases: ['chest', 'pec', 'pectoral', 'breast'],
        mirrorRegionId: 'chest-left',
    },
    {
        id: 'abdomen-upper',
        displayName: 'Upper Abdomen',
        side: 'center',
        view: 'front',
        parentRegion: 'core',
        supportedTissueTypes: CORE_TISSUE,
        svgPathId: 'rg-abdomen-upper',
        aliases: ['abdomen', 'abs', 'stomach', 'core', 'upper abs'],
    },
    {
        id: 'abdomen-lower',
        displayName: 'Lower Abdomen',
        side: 'center',
        view: 'front',
        parentRegion: 'core',
        supportedTissueTypes: CORE_TISSUE,
        svgPathId: 'rg-abdomen-lower',
        aliases: ['abdomen', 'abs', 'lower abs', 'pelvis', 'core'],
    },
    {
        id: 'left-hip-front',
        displayName: 'Left Hip',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-hip-front',
        aliases: ['hip', 'hip flexor', 'groin'],
        mirrorRegionId: 'right-hip-front',
    },
    {
        id: 'right-hip-front',
        displayName: 'Right Hip',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-hip-front',
        aliases: ['hip', 'hip flexor', 'groin'],
        mirrorRegionId: 'left-hip-front',
    },
    {
        id: 'left-quad-front',
        displayName: 'Left Quadricep',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-quad-front',
        aliases: ['quad', 'thigh', 'quadricep', 'leg'],
        mirrorRegionId: 'right-quad-front',
    },
    {
        id: 'right-quad-front',
        displayName: 'Right Quadricep',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-quad-front',
        aliases: ['quad', 'thigh', 'quadricep', 'leg'],
        mirrorRegionId: 'left-quad-front',
    },
    {
        id: 'left-knee-front',
        displayName: 'Left Knee',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-knee-front',
        aliases: ['knee', 'patella', 'kneecap', 'acl', 'meniscus'],
        mirrorRegionId: 'right-knee-front',
    },
    {
        id: 'right-knee-front',
        displayName: 'Right Knee',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-knee-front',
        aliases: ['knee', 'patella', 'kneecap', 'acl', 'meniscus'],
        mirrorRegionId: 'left-knee-front',
    },
    {
        id: 'left-shin-front',
        displayName: 'Left Shin',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: BONE_TISSUE,
        svgPathId: 'rg-left-shin-front',
        aliases: ['shin', 'tibia', 'shin splint', 'lower leg'],
        mirrorRegionId: 'right-shin-front',
    },
    {
        id: 'right-shin-front',
        displayName: 'Right Shin',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: BONE_TISSUE,
        svgPathId: 'rg-right-shin-front',
        aliases: ['shin', 'tibia', 'shin splint', 'lower leg'],
        mirrorRegionId: 'left-shin-front',
    },
    {
        id: 'left-ankle-front',
        displayName: 'Left Ankle',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-ankle-front',
        aliases: ['ankle', 'sprain'],
        mirrorRegionId: 'right-ankle-front',
    },
    {
        id: 'right-ankle-front',
        displayName: 'Right Ankle',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-ankle-front',
        aliases: ['ankle', 'sprain'],
        mirrorRegionId: 'left-ankle-front',
    },
    {
        id: 'left-foot-front',
        displayName: 'Left Foot',
        side: 'left',
        view: 'front',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-foot-front',
        aliases: ['foot', 'toes', 'arch', 'plantar'],
        mirrorRegionId: 'right-foot-front',
    },
    {
        id: 'right-foot-front',
        displayName: 'Right Foot',
        side: 'right',
        view: 'front',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-foot-front',
        aliases: ['foot', 'toes', 'arch', 'plantar'],
        mirrorRegionId: 'left-foot-front',
    },
];

// ─── back (posterior) regions ───────────────────────────────────────────────

const BACK_REGIONS: BodyRegion[] = [
    {
        id: 'head-back',
        displayName: 'Head (Back)',
        side: 'center',
        view: 'back',
        supportedTissueTypes: HEAD_TISSUE,
        svgPathId: 'rg-head-back',
        aliases: ['head', 'skull', 'occiput', 'back of head'],
    },
    {
        id: 'neck-back',
        displayName: 'Neck (Back)',
        side: 'center',
        view: 'back',
        supportedTissueTypes: [
            'muscle',
            'tendon',
            'nerve',
            'surface',
            'general',
        ],
        svgPathId: 'rg-neck-back',
        aliases: ['neck', 'cervical', 'nape', 'trap'],
    },
    {
        id: 'left-shoulder-back',
        displayName: 'Left Shoulder (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-shoulder-back',
        aliases: ['shoulder', 'rear delt', 'rotator cuff', 'scapula'],
        mirrorRegionId: 'right-shoulder-back',
    },
    {
        id: 'right-shoulder-back',
        displayName: 'Right Shoulder (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-arm',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-shoulder-back',
        aliases: ['shoulder', 'rear delt', 'rotator cuff', 'scapula'],
        mirrorRegionId: 'left-shoulder-back',
    },
    {
        id: 'left-upper-arm-back',
        displayName: 'Left Upper Arm (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-arm',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-upper-arm-back',
        aliases: ['tricep', 'triceps', 'upper arm', 'arm'],
        mirrorRegionId: 'right-upper-arm-back',
    },
    {
        id: 'right-upper-arm-back',
        displayName: 'Right Upper Arm (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-arm',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-upper-arm-back',
        aliases: ['tricep', 'triceps', 'upper arm', 'arm'],
        mirrorRegionId: 'left-upper-arm-back',
    },
    {
        id: 'left-forearm-back',
        displayName: 'Left Forearm (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-arm',
        supportedTissueTypes: LIMB_TISSUE,
        svgPathId: 'rg-left-forearm-back',
        aliases: ['forearm', 'wrist extensor', 'arm'],
        mirrorRegionId: 'right-forearm-back',
    },
    {
        id: 'right-forearm-back',
        displayName: 'Right Forearm (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-arm',
        supportedTissueTypes: LIMB_TISSUE,
        svgPathId: 'rg-right-forearm-back',
        aliases: ['forearm', 'wrist extensor', 'arm'],
        mirrorRegionId: 'left-forearm-back',
    },
    {
        id: 'spine-upper-back',
        displayName: 'Upper Spine',
        side: 'center',
        view: 'back',
        parentRegion: 'spine',
        supportedTissueTypes: ['bone', 'muscle', 'nerve', 'tendon', 'general'],
        svgPathId: 'rg-spine-upper-back',
        aliases: ['upper back', 'thoracic', 'spine', 'mid back'],
    },
    {
        id: 'spine-lower-back',
        displayName: 'Lower Spine',
        side: 'center',
        view: 'back',
        parentRegion: 'spine',
        supportedTissueTypes: ['bone', 'muscle', 'nerve', 'tendon', 'general'],
        svgPathId: 'rg-spine-lower-back',
        aliases: ['lower back', 'lumbar', 'spine', 'sciatica'],
    },
    {
        id: 'left-lat',
        displayName: 'Left Lat',
        side: 'left',
        view: 'back',
        parentRegion: 'back',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-lat',
        aliases: ['lat', 'latissimus', 'back', 'side back'],
        mirrorRegionId: 'right-lat',
    },
    {
        id: 'right-lat',
        displayName: 'Right Lat',
        side: 'right',
        view: 'back',
        parentRegion: 'back',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-lat',
        aliases: ['lat', 'latissimus', 'back', 'side back'],
        mirrorRegionId: 'left-lat',
    },
    {
        id: 'left-glute',
        displayName: 'Left Glute',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-glute',
        aliases: ['glute', 'buttock', 'gluteus', 'hip'],
        mirrorRegionId: 'right-glute',
    },
    {
        id: 'right-glute',
        displayName: 'Right Glute',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-glute',
        aliases: ['glute', 'buttock', 'gluteus', 'hip'],
        mirrorRegionId: 'left-glute',
    },
    {
        id: 'left-hamstring',
        displayName: 'Left Hamstring',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-hamstring',
        aliases: ['hamstring', 'thigh', 'leg', 'hammy'],
        mirrorRegionId: 'right-hamstring',
    },
    {
        id: 'right-hamstring',
        displayName: 'Right Hamstring',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-hamstring',
        aliases: ['hamstring', 'thigh', 'leg', 'hammy'],
        mirrorRegionId: 'left-hamstring',
    },
    {
        id: 'left-knee-back',
        displayName: 'Left Knee (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-knee-back',
        aliases: ['knee', 'back of knee', 'popliteal'],
        mirrorRegionId: 'right-knee-back',
    },
    {
        id: 'right-knee-back',
        displayName: 'Right Knee (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-knee-back',
        aliases: ['knee', 'back of knee', 'popliteal'],
        mirrorRegionId: 'left-knee-back',
    },
    {
        id: 'left-calf',
        displayName: 'Left Calf',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-left-calf',
        aliases: ['calf', 'gastrocnemius', 'lower leg', 'achilles'],
        mirrorRegionId: 'right-calf',
    },
    {
        id: 'right-calf',
        displayName: 'Right Calf',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: MUSCLE_TISSUE,
        svgPathId: 'rg-right-calf',
        aliases: ['calf', 'gastrocnemius', 'lower leg', 'achilles'],
        mirrorRegionId: 'left-calf',
    },
    {
        id: 'left-ankle-back',
        displayName: 'Left Ankle (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-ankle-back',
        aliases: ['ankle', 'achilles', 'heel'],
        mirrorRegionId: 'right-ankle-back',
    },
    {
        id: 'right-ankle-back',
        displayName: 'Right Ankle (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-ankle-back',
        aliases: ['ankle', 'achilles', 'heel'],
        mirrorRegionId: 'left-ankle-back',
    },
    {
        id: 'left-foot-back',
        displayName: 'Left Foot (Back)',
        side: 'left',
        view: 'back',
        parentRegion: 'left-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-left-foot-back',
        aliases: ['foot', 'heel', 'sole'],
        mirrorRegionId: 'right-foot-back',
    },
    {
        id: 'right-foot-back',
        displayName: 'Right Foot (Back)',
        side: 'right',
        view: 'back',
        parentRegion: 'right-leg',
        supportedTissueTypes: JOINT_TISSUE,
        svgPathId: 'rg-right-foot-back',
        aliases: ['foot', 'heel', 'sole'],
        mirrorRegionId: 'left-foot-back',
    },
];

const TOOTH_REGIONS: BodyRegion[] = Array.from({ length: 32 }, (_, index) => {
    const toothNumber = index + 1;
    return {
        id: `tooth-${toothNumber}`,
        displayName: `Tooth ${toothNumber}`,
        side:
            toothNumber <= 8 || (toothNumber >= 25 && toothNumber <= 32)
                ? 'right'
                : 'left',
        view: 'front',
        parentRegion: 'mouth-front',
        supportedTissueTypes: ['tooth', 'nerve', 'bone', 'general'],
        svgPathId: `rg-tooth-${toothNumber}`,
        aliases: [
            'tooth',
            'teeth',
            'dental',
            'gum',
            `tooth ${toothNumber}`,
            `#${toothNumber}`,
        ],
    };
});

function makeRegion(
    id: string,
    displayName: string,
    regionType: TissueType,
    view: RegionView,
    aliases: string[] = [],
    side: RegionSide = 'center',
    parentRegion?: string,
): BodyRegion {
    return {
        id,
        displayName,
        side,
        view,
        ...(parentRegion && { parentRegion }),
        supportedTissueTypes: [regionType, 'general'],
        svgPathId: `rg-${id}`,
        aliases: [displayName.toLowerCase(), ...aliases],
    };
}

const BONE_REGIONS: BodyRegion[] = [
    makeRegion('bone-skull-front', 'Skull', 'bone', 'front', [
        'cranium',
        'head',
    ]),
    makeRegion('bone-mandible-front', 'Mandible', 'bone', 'front', ['jaw']),
    makeRegion(
        'bone-clavicle-left-front',
        'Left Clavicle',
        'bone',
        'front',
        ['collarbone'],
        'left',
    ),
    makeRegion(
        'bone-clavicle-right-front',
        'Right Clavicle',
        'bone',
        'front',
        ['collarbone'],
        'right',
    ),
    makeRegion('bone-sternum-front', 'Sternum', 'bone', 'front', [
        'breastbone',
    ]),
    makeRegion(
        'bone-ribs-left-front',
        'Left Ribs',
        'bone',
        'front',
        ['rib cage'],
        'left',
    ),
    makeRegion(
        'bone-ribs-right-front',
        'Right Ribs',
        'bone',
        'front',
        ['rib cage'],
        'right',
    ),
    makeRegion(
        'bone-humerus-left-front',
        'Left Humerus',
        'bone',
        'front',
        ['upper arm bone'],
        'left',
    ),
    makeRegion(
        'bone-humerus-right-front',
        'Right Humerus',
        'bone',
        'front',
        ['upper arm bone'],
        'right',
    ),
    makeRegion(
        'bone-radius-ulna-left-front',
        'Left Radius / Ulna',
        'bone',
        'front',
        ['forearm bones'],
        'left',
    ),
    makeRegion(
        'bone-radius-ulna-right-front',
        'Right Radius / Ulna',
        'bone',
        'front',
        ['forearm bones'],
        'right',
    ),
    makeRegion(
        'bone-hand-left-front',
        'Left Carpals / Metacarpals / Phalanges',
        'bone',
        'front',
        ['hand bones', 'fingers'],
        'left',
    ),
    makeRegion(
        'bone-hand-right-front',
        'Right Carpals / Metacarpals / Phalanges',
        'bone',
        'front',
        ['hand bones', 'fingers'],
        'right',
    ),
    makeRegion('bone-pelvis-front', 'Pelvis', 'bone', 'front', [
        'ilium',
        'pubis',
        'ischium',
    ]),
    makeRegion(
        'bone-femur-left-front',
        'Left Femur',
        'bone',
        'front',
        ['thigh bone'],
        'left',
    ),
    makeRegion(
        'bone-femur-right-front',
        'Right Femur',
        'bone',
        'front',
        ['thigh bone'],
        'right',
    ),
    makeRegion(
        'bone-patella-left-front',
        'Left Patella',
        'bone',
        'front',
        ['kneecap'],
        'left',
    ),
    makeRegion(
        'bone-patella-right-front',
        'Right Patella',
        'bone',
        'front',
        ['kneecap'],
        'right',
    ),
    makeRegion(
        'bone-tibia-fibula-left-front',
        'Left Tibia / Fibula',
        'bone',
        'front',
        ['shin bones'],
        'left',
    ),
    makeRegion(
        'bone-tibia-fibula-right-front',
        'Right Tibia / Fibula',
        'bone',
        'front',
        ['shin bones'],
        'right',
    ),
    makeRegion(
        'bone-foot-left-front',
        'Left Tarsals / Metatarsals / Phalanges',
        'bone',
        'front',
        ['foot bones', 'toes'],
        'left',
    ),
    makeRegion(
        'bone-foot-right-front',
        'Right Tarsals / Metatarsals / Phalanges',
        'bone',
        'front',
        ['foot bones', 'toes'],
        'right',
    ),
    makeRegion('bone-skull-back', 'Skull (Back)', 'bone', 'back', [
        'occiput',
        'head',
    ]),
    makeRegion(
        'bone-scapula-left-back',
        'Left Scapula',
        'bone',
        'back',
        ['shoulder blade'],
        'left',
    ),
    makeRegion(
        'bone-scapula-right-back',
        'Right Scapula',
        'bone',
        'back',
        ['shoulder blade'],
        'right',
    ),
    makeRegion(
        'bone-cervical-spine-back',
        'Cervical Vertebrae',
        'bone',
        'back',
        ['neck spine', 'c spine'],
    ),
    makeRegion(
        'bone-thoracic-spine-back',
        'Thoracic Vertebrae',
        'bone',
        'back',
        ['upper spine', 't spine'],
    ),
    makeRegion('bone-lumbar-spine-back', 'Lumbar Vertebrae', 'bone', 'back', [
        'lower spine',
        'l spine',
    ]),
    makeRegion('bone-sacrum-coccyx-back', 'Sacrum / Coccyx', 'bone', 'back', [
        'tailbone',
    ]),
    makeRegion('bone-pelvis-back', 'Pelvis (Back)', 'bone', 'back', [
        'ilium',
        'sacrum',
    ]),
    makeRegion(
        'bone-femur-left-back',
        'Left Femur (Back)',
        'bone',
        'back',
        ['thigh bone'],
        'left',
    ),
    makeRegion(
        'bone-femur-right-back',
        'Right Femur (Back)',
        'bone',
        'back',
        ['thigh bone'],
        'right',
    ),
    makeRegion(
        'bone-tibia-fibula-left-back',
        'Left Tibia / Fibula (Back)',
        'bone',
        'back',
        ['lower leg bones'],
        'left',
    ),
    makeRegion(
        'bone-tibia-fibula-right-back',
        'Right Tibia / Fibula (Back)',
        'bone',
        'back',
        ['lower leg bones'],
        'right',
    ),
];

const TENDON_REGIONS: BodyRegion[] = [
    makeRegion(
        'tendon-rotator-cuff-left',
        'Left Rotator Cuff Tendons',
        'tendon',
        'back',
        ['supraspinatus', 'infraspinatus'],
        'left',
    ),
    makeRegion(
        'tendon-rotator-cuff-right',
        'Right Rotator Cuff Tendons',
        'tendon',
        'back',
        ['supraspinatus', 'infraspinatus'],
        'right',
    ),
    makeRegion(
        'tendon-biceps-left',
        'Left Biceps Tendon',
        'tendon',
        'front',
        ['biceps tendon'],
        'left',
    ),
    makeRegion(
        'tendon-biceps-right',
        'Right Biceps Tendon',
        'tendon',
        'front',
        ['biceps tendon'],
        'right',
    ),
    makeRegion(
        'tendon-patellar-left',
        'Left Patellar Tendon',
        'tendon',
        'front',
        ['knee tendon'],
        'left',
    ),
    makeRegion(
        'tendon-patellar-right',
        'Right Patellar Tendon',
        'tendon',
        'front',
        ['knee tendon'],
        'right',
    ),
    makeRegion(
        'tendon-achilles-left',
        'Left Achilles Tendon',
        'tendon',
        'back',
        ['achilles'],
        'left',
    ),
    makeRegion(
        'tendon-achilles-right',
        'Right Achilles Tendon',
        'tendon',
        'back',
        ['achilles'],
        'right',
    ),
    makeRegion(
        'tendon-plantar-fascia-left',
        'Left Plantar Fascia',
        'tendon',
        'front',
        ['plantar fascia', 'foot arch'],
        'left',
    ),
    makeRegion(
        'tendon-plantar-fascia-right',
        'Right Plantar Fascia',
        'tendon',
        'front',
        ['plantar fascia', 'foot arch'],
        'right',
    ),
];

const NERVE_REGIONS: BodyRegion[] = [
    makeRegion('nerve-trigeminal-front', 'Trigeminal Nerve', 'nerve', 'front', [
        'face nerve',
    ]),
    makeRegion(
        'nerve-brachial-plexus-left',
        'Left Brachial Plexus',
        'nerve',
        'front',
        ['shoulder nerve'],
        'left',
    ),
    makeRegion(
        'nerve-brachial-plexus-right',
        'Right Brachial Plexus',
        'nerve',
        'front',
        ['shoulder nerve'],
        'right',
    ),
    makeRegion(
        'nerve-median-left',
        'Left Median Nerve',
        'nerve',
        'front',
        ['hand nerve'],
        'left',
    ),
    makeRegion(
        'nerve-median-right',
        'Right Median Nerve',
        'nerve',
        'front',
        ['hand nerve'],
        'right',
    ),
    makeRegion(
        'nerve-ulnar-left',
        'Left Ulnar Nerve',
        'nerve',
        'front',
        ['funny bone'],
        'left',
    ),
    makeRegion(
        'nerve-ulnar-right',
        'Right Ulnar Nerve',
        'nerve',
        'front',
        ['funny bone'],
        'right',
    ),
    makeRegion(
        'nerve-femoral-left',
        'Left Femoral Nerve',
        'nerve',
        'front',
        ['front thigh nerve'],
        'left',
    ),
    makeRegion(
        'nerve-femoral-right',
        'Right Femoral Nerve',
        'nerve',
        'front',
        ['front thigh nerve'],
        'right',
    ),
    makeRegion(
        'nerve-sciatic-left',
        'Left Sciatic Nerve',
        'nerve',
        'back',
        ['sciatica'],
        'left',
    ),
    makeRegion(
        'nerve-sciatic-right',
        'Right Sciatic Nerve',
        'nerve',
        'back',
        ['sciatica'],
        'right',
    ),
    makeRegion('nerve-vagus-front', 'Vagus Nerve', 'nerve', 'front', ['vagal']),
];

export const BODY_REGIONS: BodyRegion[] = [
    ...FRONT_REGIONS,
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

/** Adjacent regions within the same parent group (for the drawer's region switcher). */
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

/** Case-insensitive search across display names and aliases. */
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
