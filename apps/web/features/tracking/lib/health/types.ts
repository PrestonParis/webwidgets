import type { TissueType, RegionSide } from './bodyRegions';

// Muscle/body zone identifiers
export type BodyZoneId =
    | 'head'
    | 'neck'
    | 'left-shoulder'
    | 'right-shoulder'
    | 'left-upper-arm'
    | 'right-upper-arm'
    | 'left-forearm'
    | 'right-forearm'
    | 'left-hand'
    | 'right-hand'
    | 'chest'
    | 'upper-back'
    | 'lower-back'
    | 'abdomen'
    | 'left-hip'
    | 'right-hip'
    | 'left-glute'
    | 'right-glute'
    | 'left-quad'
    | 'right-quad'
    | 'left-hamstring'
    | 'right-hamstring'
    | 'left-knee'
    | 'right-knee'
    | 'left-calf'
    | 'right-calf'
    | 'left-shin'
    | 'right-shin'
    | 'left-ankle'
    | 'right-ankle'
    | 'left-foot'
    | 'right-foot';

export type PainType = 'soreness' | 'injury';
export type Severity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type SicknessType =
    | 'cold'
    | 'flu'
    | 'gi'
    | 'migraine'
    | 'allergy'
    | 'headache'
    | 'fatigue'
    | 'other';
export type AllergyTrigger =
    | 'pollen'
    | 'dust'
    | 'pet'
    | 'food'
    | 'mold'
    | 'medication'
    | 'insect'
    | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe';
export type TemperatureUnit = 'F' | 'C';

export interface BodyZoneEntry {
    type: PainType;
    intensity: Severity;
    timestamp: string; // ISO string
    notes?: string;
}

export type BodyMap = Partial<Record<BodyZoneId, BodyZoneEntry>>;

export interface BiometricDataPoint {
    date: string; // YYYY-MM-DD
    hrv?: number; // ms
    rhr?: number; // bpm
}

export interface AllergyLog {
    trigger: AllergyTrigger;
    severity: AllergySeverity;
    symptoms: string;
    timestamp: string;
}

export interface SicknessLog {
    type: SicknessType;
    medicationTaken: boolean;
    temperature?: number;
    temperatureUnit: TemperatureUnit;
    notes?: string;
    timestamp: string;
}

export interface HealthLogEntry {
    id: string;
    date: string;
    energyLevel?: Severity;
    sleepQuality?: Severity;
    bodyMap?: BodyMap;
    biometrics?: BiometricDataPoint;
    allergies?: AllergyLog[];
    sickness?: SicknessLog;
    notes?: string;
}

export type HealthViewMode = 'summary' | 'body' | 'biometrics' | 'history';
export type BiometricWindow = '7d' | '30d' | '90d';

export const BODY_ZONE_IDS: BodyZoneId[] = [
    'head',
    'neck',
    'left-shoulder',
    'right-shoulder',
    'left-upper-arm',
    'right-upper-arm',
    'left-forearm',
    'right-forearm',
    'left-hand',
    'right-hand',
    'chest',
    'upper-back',
    'lower-back',
    'abdomen',
    'left-hip',
    'right-hip',
    'left-glute',
    'right-glute',
    'left-quad',
    'right-quad',
    'left-hamstring',
    'right-hamstring',
    'left-knee',
    'right-knee',
    'left-calf',
    'right-calf',
    'left-shin',
    'right-shin',
    'left-ankle',
    'right-ankle',
    'left-foot',
    'right-foot',
];

export const BODY_ZONE_LABELS: Record<BodyZoneId, string> = {
    head: 'Head',
    neck: 'Neck',
    'left-shoulder': 'Left shoulder',
    'right-shoulder': 'Right shoulder',
    'left-upper-arm': 'Left upper arm',
    'right-upper-arm': 'Right upper arm',
    'left-forearm': 'Left forearm',
    'right-forearm': 'Right forearm',
    'left-hand': 'Left hand',
    'right-hand': 'Right hand',
    chest: 'Chest',
    'upper-back': 'Upper back',
    'lower-back': 'Lower back',
    abdomen: 'Abdomen',
    'left-hip': 'Left hip',
    'right-hip': 'Right hip',
    'left-glute': 'Left glute',
    'right-glute': 'Right glute',
    'left-quad': 'Left quad',
    'right-quad': 'Right quad',
    'left-hamstring': 'Left hamstring',
    'right-hamstring': 'Right hamstring',
    'left-knee': 'Left knee',
    'right-knee': 'Right knee',
    'left-calf': 'Left calf',
    'right-calf': 'Right calf',
    'left-shin': 'Left shin',
    'right-shin': 'Right shin',
    'left-ankle': 'Left ankle',
    'right-ankle': 'Right ankle',
    'left-foot': 'Left foot',
    'right-foot': 'Right foot',
};

export function isBodyZoneId(value: string): value is BodyZoneId {
    return (BODY_ZONE_IDS as string[]).includes(value);
}

// ─── comprehensive injury-logging model ─────────────────────────────────────
// The detailed injury system (AnatomicalBodyMap + InjuryLogDrawer) layers on
// top of the legacy BodyZone model. Injury logs are stored as an `injuryLogs`
// array in a health TrackingEntry's metadata, so the simpler `bodyMap` field is
// left untouched.

// Pain quality descriptors
export type PainQuality =
    | 'sharp'
    | 'dull'
    | 'throbbing'
    | 'burning'
    | 'stabbing'
    | 'aching'
    | 'tight'
    | 'tingling'
    | 'numb'
    | 'radiating';

export const PAIN_QUALITIES: PainQuality[] = [
    'sharp',
    'dull',
    'throbbing',
    'burning',
    'stabbing',
    'aching',
    'tight',
    'tingling',
    'numb',
    'radiating',
];

// Onset pattern
export type InjuryOnset = 'sudden' | 'gradual' | 'unknown';

// Status lifecycle
export type InjuryStatus = 'active' | 'improving' | 'resolved' | 'chronic';

export const INJURY_STATUSES: InjuryStatus[] = [
    'active',
    'improving',
    'resolved',
    'chronic',
];

// Red flags that trigger a safety warning
export type RedFlag =
    | 'severe_swelling'
    | 'deformity'
    | 'numbness_loss_of_function'
    | 'head_injury'
    | 'spreading_infection'
    | 'severe_unexplained_pain'
    | 'loss_of_consciousness'
    | 'chest_pain_shortness_breath';

export const RED_FLAG_LABELS: Record<RedFlag, string> = {
    severe_swelling: 'Severe swelling',
    deformity: 'Visible deformity',
    numbness_loss_of_function: 'Numbness or loss of function',
    head_injury: 'Head injury',
    spreading_infection: 'Signs of spreading infection',
    severe_unexplained_pain: 'Severe unexplained pain',
    loss_of_consciousness: 'Loss of consciousness',
    chest_pain_shortness_breath: 'Chest pain or shortness of breath',
};

// Full injury log
export interface InjuryLog {
    id: string;
    bodyRegionId: string;
    tissueType: TissueType;
    /** 'soreness' | 'strain' | 'sprain' | 'bruise' etc — open string for flexibility. */
    injuryType: string;
    severity: number; // 1–10
    painQualities: PainQuality[];
    onset: InjuryOnset;
    cause?: string;
    symptoms: string;
    mobilityImpact: number; // 1–10, 1 = no impact
    hasSwelling: boolean;
    hasBruising: boolean;
    hasBleeding: boolean;
    notes?: string;
    status: InjuryStatus;
    createdAt: string; // ISO
    updatedAt: string;
    resolvedAt?: string;
    redFlags: RedFlag[];
}

/** Draft shape used by the drawer before an id / timestamps are assigned. */
export type InjuryLogDraft = Omit<InjuryLog, 'id' | 'createdAt' | 'updatedAt'>;

// Aggregated per-region summary
export interface RegionSummary {
    regionId: string;
    activeLogCount: number;
    maxSeverity: number;
    lastLoggedAt: string;
    hasRedFlags: boolean;
    tissueTypes: TissueType[];
}

// Analytics for the body map
export interface BodyMapAnalytics {
    totalActive: number;
    mostSevereRegion?: RegionSummary;
    recentlyLogged: RegionSummary[]; // last 7 days
    unresolvedCount: number;
    leftRightImbalance: {
        leftCount: number;
        rightCount: number;
        imbalanceScore: number;
    };
    sorenessVsInjuryRatio: { soreness: number; injury: number };
}

// Tissue-type display metadata
export interface TissueTypeConfig {
    id: TissueType;
    label: string;
    description: string;
    commonInjuryTypes: string[];
    icon: string; // lucide icon name
}

export const TISSUE_TYPE_CONFIGS: TissueTypeConfig[] = [
    {
        id: 'surface',
        label: 'Surface',
        description: 'Skin and surface tissue — cuts, bruises, burns, rashes.',
        commonInjuryTypes: [
            'cut',
            'bruise',
            'burn',
            'rash',
            'swelling',
            'blister',
            'abrasion',
        ],
        icon: 'Bandage',
    },
    {
        id: 'muscle',
        label: 'Muscle',
        description: 'Muscle tissue — soreness, strains, cramps, tightness.',
        commonInjuryTypes: [
            'soreness',
            'strain',
            'cramp',
            'tightness',
            'DOMS',
            'tear',
        ],
        icon: 'Activity',
    },
    {
        id: 'tendon',
        label: 'Tendon & Joint',
        description:
            'Tendons, ligaments and joints — sprains, tendinitis, instability.',
        commonInjuryTypes: [
            'tendinitis',
            'sprain',
            'instability',
            'stiffness',
            'rupture concern',
        ],
        icon: 'Link',
    },
    {
        id: 'bone',
        label: 'Bone',
        description: 'Bone — impact pain, shin splints, fracture concerns.',
        commonInjuryTypes: [
            'impact pain',
            'shin splint',
            'stress fracture concern',
            'bruise',
        ],
        icon: 'Bone',
    },
    {
        id: 'nerve',
        label: 'Nerve',
        description:
            'Nerve tissue — numbness, tingling, radiating or shooting pain.',
        commonInjuryTypes: [
            'numbness',
            'tingling',
            'radiating pain',
            'burning',
            'shooting',
        ],
        icon: 'Zap',
    },
    {
        id: 'general',
        label: 'General',
        description: 'General or unspecified pain.',
        commonInjuryTypes: ['general pain', 'unknown'],
        icon: 'CircleHelp',
    },
];

export const TISSUE_TYPE_CONFIG_MAP: Record<TissueType, TissueTypeConfig> =
    TISSUE_TYPE_CONFIGS.reduce(
        (acc, config) => {
            acc[config.id] = config;
            return acc;
        },
        {} as Record<TissueType, TissueTypeConfig>,
    );

// Re-export tissue/side types so health consumers have one import surface.
export type { TissueType, RegionSide };
