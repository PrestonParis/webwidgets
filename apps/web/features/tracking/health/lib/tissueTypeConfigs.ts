import type { TissueType } from './bodyRegions';

export interface TissueTypeConfig {
    id: TissueType;
    label: string;
    description: string;
    commonInjuryTypes: string[];
    icon: string;
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
