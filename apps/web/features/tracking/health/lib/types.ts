import type { TissueType, RegionSide } from './bodyRegions';

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
export type HealthViewMode = 'summary' | 'body' | 'biometrics' | 'history';
export type BiometricWindow = '7d' | '30d' | '90d';
export type InjuryOnset = 'sudden' | 'gradual' | 'unknown';
export type InjuryStatus = 'active' | 'improving' | 'resolved' | 'chronic';

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

export type RedFlag =
    | 'severe_swelling'
    | 'deformity'
    | 'numbness_loss_of_function'
    | 'head_injury'
    | 'spreading_infection'
    | 'severe_unexplained_pain'
    | 'loss_of_consciousness'
    | 'chest_pain_shortness_breath';

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

export const INJURY_STATUSES: InjuryStatus[] = [
    'active',
    'improving',
    'resolved',
    'chronic',
];

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

export interface BodyZoneEntry {
    type: PainType;
    intensity: Severity;
    timestamp: string;
    notes?: string;
}

export type BodyMap = Partial<Record<BodyZoneId, BodyZoneEntry>>;

export interface BiometricDataPoint {
    date: string;
    hrv?: number;
    rhr?: number;
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

export interface InjuryLog {
    id: string;
    bodyRegionId: string;
    tissueType: TissueType;
    injuryType: string;
    severity: number;
    painQualities: PainQuality[];
    onset: InjuryOnset;
    cause?: string;
    symptoms: string;
    mobilityImpact: number;
    hasSwelling: boolean;
    hasBruising: boolean;
    hasBleeding: boolean;
    notes?: string;
    status: InjuryStatus;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    redFlags: RedFlag[];
}

export type InjuryLogDraft = Omit<InjuryLog, 'id' | 'createdAt' | 'updatedAt'>;

export interface RegionSummary {
    regionId: string;
    activeLogCount: number;
    maxSeverity: number;
    lastLoggedAt: string;
    hasRedFlags: boolean;
    tissueTypes: TissueType[];
}

export interface BodyMapAnalytics {
    totalActive: number;
    mostSevereRegion?: RegionSummary;
    recentlyLogged: RegionSummary[];
    unresolvedCount: number;
    leftRightImbalance: {
        leftCount: number;
        rightCount: number;
        imbalanceScore: number;
    };
    sorenessVsInjuryRatio: { soreness: number; injury: number };
}

export { BODY_ZONE_IDS, BODY_ZONE_LABELS, isBodyZoneId } from './bodyZoneData';
export type { TissueTypeConfig } from './tissueTypeConfigs';
export {
    TISSUE_TYPE_CONFIGS,
    TISSUE_TYPE_CONFIG_MAP,
} from './tissueTypeConfigs';
export type { TissueType, RegionSide };
