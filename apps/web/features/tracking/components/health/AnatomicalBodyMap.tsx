'use client';

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    BODY_REGION_MAP,
    searchRegions,
    type BodyRegion,
    type TissueType,
} from '@/features/tracking/lib/health/bodyRegions';
import {
    getRegionLogs,
    getSeverityColor,
} from '@/features/tracking/lib/health/analytics';
import type {
    InjuryLog,
    InjuryStatus,
} from '@/features/tracking/lib/health/types';
import {
    severityColor,
    type BodyIssue,
} from '@/features/tracking/lib/health/bodyIssues';

// ─── SVG geometry ────────────────────────────────────────────────────────────

interface RegionGeometry {
    id: string;
    d: string;
    badge: { x: number; y: number };
}

type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

const SORENESS_TYPES = new Set(['soreness', 'doms', 'tightness', 'cramp']);

const FRONT_SURFACE =
    'M60 5 C68 5 73 12 73 20 C73 27 68 33 63 35 L65 43 ' +
    'C75 44 85 48 91 58 C97 68 98 83 96 101 C95 114 93 127 91 137 ' +
    'L84 135 C85 123 87 106 88 91 C88 104 87 120 85 136 C83 148 80 158 78 169 ' +
    'C76 188 75 207 74 225 C73 239 73 251 70 256 C67 260 62 259 60 254 ' +
    'C58 259 53 260 50 256 C47 251 47 239 46 225 C45 207 44 188 42 169 ' +
    'C40 158 37 148 35 136 C33 120 32 104 32 91 C33 106 35 123 36 135 ' +
    'L29 137 C27 127 25 114 24 101 C22 83 23 68 29 58 C35 48 45 44 55 43 ' +
    'L57 35 C52 33 47 27 47 20 C47 12 52 5 60 5 Z';

const BACK_SURFACE =
    'M60 5 C68 5 73 12 73 20 C73 27 68 33 63 35 L65 43 ' +
    'C76 44 86 49 92 60 C98 72 99 91 96 110 C93 127 90 139 87 146 ' +
    'L80 143 C82 130 84 113 85 98 C85 114 84 130 82 145 C80 158 78 170 77 184 ' +
    'C76 199 76 216 75 232 C74 246 73 255 70 258 C67 260 62 259 60 254 ' +
    'C58 259 53 260 50 258 C47 255 46 246 45 232 C44 216 44 199 43 184 ' +
    'C42 170 40 158 38 145 C36 130 35 114 35 98 C36 113 38 130 40 143 ' +
    'L33 146 C30 139 27 127 24 110 C21 91 22 72 28 60 C34 49 44 44 55 43 ' +
    'L57 35 C52 33 47 27 47 20 C47 12 52 5 60 5 Z';

const VIEW_SURFACE: Record<'front' | 'back', string> = {
    front: FRONT_SURFACE,
    back: BACK_SURFACE,
};

const IMAGE_LAYER: Record<
    'front' | 'back',
    {
        muscleX: number;
        skeletonX: number;
    }
> = {
    front: { muscleX: -18, skeletonX: 18 },
    back: { muscleX: -215, skeletonX: 18 },
};

const FRONT_GEOMETRY: RegionGeometry[] = [
    {
        id: 'head-front',
        d: 'M60 5 C68 5 73 11 73 19 C73 27 67 33 60 33 C53 33 47 27 47 19 C47 11 52 5 60 5 Z',
        badge: { x: 60, y: 18 },
    },
    {
        id: 'left-eye-front',
        d: 'M53 18 C55 16.8 57.5 16.8 59.2 18 C57.4 19.4 55 19.4 53 18 Z',
        badge: { x: 56, y: 18 },
    },
    {
        id: 'right-eye-front',
        d: 'M60.8 18 C62.5 16.8 65 16.8 67 18 C65 19.4 62.6 19.4 60.8 18 Z',
        badge: { x: 64, y: 18 },
    },
    {
        id: 'nose-front',
        d: 'M59 19.5 L61 19.5 L62 24 L58 24 Z',
        badge: { x: 60, y: 22.5 },
    },
    {
        id: 'mouth-front',
        d: 'M54.5 26 C57.5 28 62.5 28 65.5 26 C64 30.5 56 30.5 54.5 26 Z',
        badge: { x: 60, y: 28 },
    },
    {
        id: 'neck-front',
        d: 'M54 33 C56 35 64 35 66 33 L67 41 C64 44 56 44 53 41 Z',
        badge: { x: 60, y: 38 },
    },
    {
        id: 'left-shoulder-front',
        d: 'M50 42 C44 41 38 43 33 47 C31 49 30 53 31 57 C36 53 43 50 49 50 C50 47 50 44 50 42 Z',
        badge: { x: 39, y: 49 },
    },
    {
        id: 'right-shoulder-front',
        d: 'M70 42 C76 41 82 43 87 47 C89 49 90 53 89 57 C84 53 77 50 71 50 C70 47 70 44 70 42 Z',
        badge: { x: 81, y: 49 },
    },
    {
        id: 'chest-left',
        d: 'M59 46 L59 74 C53 74 47 72 43 68 C41 62 41 56 43 51 C48 48 54 46 59 46 Z',
        badge: { x: 50, y: 60 },
    },
    {
        id: 'chest-right',
        d: 'M61 46 L61 74 C67 74 73 72 77 68 C79 62 79 56 77 51 C72 48 66 46 61 46 Z',
        badge: { x: 70, y: 60 },
    },
    {
        id: 'left-upper-arm-front',
        d: 'M32 58 C30 53 30 50 31 50 C36 53 41 53 42 56 C41 64 39 74 37 84 C34 84 31 82 29 80 C29 72 30 65 32 58 Z',
        badge: { x: 35, y: 70 },
    },
    {
        id: 'right-upper-arm-front',
        d: 'M88 58 C90 53 90 50 89 50 C84 53 79 53 78 56 C79 64 81 74 83 84 C86 84 89 82 91 80 C91 72 90 65 88 58 Z',
        badge: { x: 85, y: 70 },
    },
    {
        id: 'abdomen-upper',
        d: 'M44 75 C48 78 53 79 59 79 L61 79 C67 79 72 78 76 75 L75 92 C70 94 64 95 60 95 C56 95 50 94 45 92 Z',
        badge: { x: 60, y: 86 },
    },
    {
        id: 'abdomen-lower',
        d: 'M45 93 C50 95 56 96 60 96 C64 96 70 95 75 93 L77 112 C72 116 66 118 60 118 C54 118 48 116 43 112 Z',
        badge: { x: 60, y: 106 },
    },
    {
        id: 'left-forearm-front',
        d: 'M29 81 C31 83 34 85 37 85 C36 96 34 108 31 120 C28 120 26 118 24 116 C25 104 27 92 29 81 Z',
        badge: { x: 31, y: 102 },
    },
    {
        id: 'right-forearm-front',
        d: 'M91 81 C89 83 86 85 83 85 C84 96 86 108 89 120 C92 120 94 118 96 116 C95 104 93 92 91 81 Z',
        badge: { x: 89, y: 102 },
    },
    {
        id: 'left-hand-front',
        d: 'M30 121 C33 121 36 121 37 122 C36 128 35 132 33 134 C30 134 27 132 25 130 C26 126 28 123 30 121 Z',
        badge: { x: 31, y: 127 },
    },
    {
        id: 'right-hand-front',
        d: 'M90 121 C87 121 84 121 83 122 C84 128 85 132 87 134 C90 134 93 132 95 130 C94 126 92 123 90 121 Z',
        badge: { x: 89, y: 127 },
    },
    {
        id: 'left-hip-front',
        d: 'M44 114 C50 117 56 118 59 118 L59 134 C53 134 47 132 43 128 C42 123 42 118 44 114 Z',
        badge: { x: 50, y: 124 },
    },
    {
        id: 'right-hip-front',
        d: 'M76 114 C70 117 64 118 61 118 L61 134 C67 134 73 132 77 128 C78 123 78 118 76 114 Z',
        badge: { x: 70, y: 124 },
    },
    {
        id: 'left-quad-front',
        d: 'M43 130 C48 133 54 134 59 134 L58 178 C53 180 47 180 43 178 C42 162 42 146 43 130 Z',
        badge: { x: 50, y: 156 },
    },
    {
        id: 'right-quad-front',
        d: 'M77 130 C72 133 66 134 61 134 L62 178 C67 180 73 180 77 178 C78 162 78 146 77 130 Z',
        badge: { x: 70, y: 156 },
    },
    {
        id: 'left-knee-front',
        d: 'M43 180 C47 182 53 182 58 180 L58 194 C53 196 47 196 43 194 Z',
        badge: { x: 50, y: 187 },
    },
    {
        id: 'right-knee-front',
        d: 'M77 180 C73 182 67 182 62 180 L62 194 C67 196 73 196 77 194 Z',
        badge: { x: 70, y: 187 },
    },
    {
        id: 'left-shin-front',
        d: 'M44 196 C48 198 53 198 57 196 L55 234 C52 235 48 235 46 234 C45 221 44 209 44 196 Z',
        badge: { x: 50, y: 215 },
    },
    {
        id: 'right-shin-front',
        d: 'M76 196 C72 198 67 198 63 196 L65 234 C68 235 72 235 74 234 C75 221 76 209 76 196 Z',
        badge: { x: 70, y: 215 },
    },
    {
        id: 'left-ankle-front',
        d: 'M46 235 C48 236 52 236 55 235 L55 244 C52 245 48 245 46 244 Z',
        badge: { x: 50, y: 240 },
    },
    {
        id: 'right-ankle-front',
        d: 'M74 235 C72 236 68 236 65 235 L65 244 C68 245 72 245 74 244 Z',
        badge: { x: 70, y: 240 },
    },
    {
        id: 'left-foot-front',
        d: 'M46 245 C48 246 53 246 55 245 C56 250 56 254 54 256 C50 257 47 257 45 255 C44 251 44 248 46 245 Z',
        badge: { x: 50, y: 251 },
    },
    {
        id: 'right-foot-front',
        d: 'M74 245 C72 246 67 246 65 245 C64 250 64 254 66 256 C70 257 73 257 75 255 C76 251 76 248 74 245 Z',
        badge: { x: 70, y: 251 },
    },
];

const DENTAL_GEOMETRY: RegionGeometry[] = Array.from(
    { length: 32 },
    (_, index) => {
        const toothNumber = index + 1;
        const upper = toothNumber <= 16;
        const arcadeIndex = upper ? toothNumber - 1 : toothNumber - 17;
        const rowY = upper ? 82 : 126;
        const x = 23 + arcadeIndex * 4.9;
        const crownWidth = arcadeIndex <= 2 || arcadeIndex >= 13 ? 3.4 : 4.2;
        const crownHeight = arcadeIndex >= 4 && arcadeIndex <= 11 ? 10 : 8;
        return {
            id: `tooth-${toothNumber}`,
            d: `M${x.toFixed(1)} ${rowY} C${(x + crownWidth).toFixed(1)} ${rowY - 2} ${(x + crownWidth + 2).toFixed(1)} ${rowY + 2} ${(x + crownWidth).toFixed(1)} ${rowY + crownHeight} C${(x + 1).toFixed(1)} ${rowY + crownHeight + 1} ${(x - 1).toFixed(1)} ${rowY + 2} ${x.toFixed(1)} ${rowY} Z`,
            badge: { x: x + crownWidth / 2, y: rowY + crownHeight / 2 },
        };
    },
);

const BONE_FRONT_GEOMETRY: RegionGeometry[] = [
    {
        id: 'bone-skull-front',
        d: 'M51 8 C58 2 70 6 72 18 C73 28 67 34 60 35 C51 34 46 27 48 17 C48 13 49 10 51 8 Z',
        badge: { x: 60, y: 20 },
    },
    {
        id: 'bone-mandible-front',
        d: 'M53 25 C57 30 63 30 67 25 L65 32 C62 36 57 36 55 32 Z',
        badge: { x: 60, y: 30 },
    },
    {
        id: 'bone-clavicle-left-front',
        d: 'M43 43 C49 41 55 42 60 45 L58 48 C52 46 47 46 42 48 Z',
        badge: { x: 50, y: 45 },
    },
    {
        id: 'bone-clavicle-right-front',
        d: 'M60 45 C65 42 71 41 77 43 L78 48 C73 46 68 46 62 48 Z',
        badge: { x: 70, y: 45 },
    },
    {
        id: 'bone-sternum-front',
        d: 'M58 48 L62 48 L63 82 L57 82 Z',
        badge: { x: 60, y: 64 },
    },
    {
        id: 'bone-ribs-left-front',
        d: 'M42 50 C52 47 58 51 59 63 C58 76 51 83 43 81 C41 70 40 59 42 50 Z',
        badge: { x: 50, y: 66 },
    },
    {
        id: 'bone-ribs-right-front',
        d: 'M78 50 C68 47 62 51 61 63 C62 76 69 83 77 81 C79 70 80 59 78 50 Z',
        badge: { x: 70, y: 66 },
    },
    {
        id: 'bone-humerus-left-front',
        d: 'M32 55 C37 54 40 56 40 63 L36 91 C33 92 30 90 29 87 Z',
        badge: { x: 35, y: 74 },
    },
    {
        id: 'bone-humerus-right-front',
        d: 'M88 55 C83 54 80 56 80 63 L84 91 C87 92 90 90 91 87 Z',
        badge: { x: 85, y: 74 },
    },
    {
        id: 'bone-radius-ulna-left-front',
        d: 'M29 91 C32 93 35 94 37 93 L32 121 C29 122 26 120 24 117 Z',
        badge: { x: 31, y: 106 },
    },
    {
        id: 'bone-radius-ulna-right-front',
        d: 'M91 91 C88 93 85 94 83 93 L88 121 C91 122 94 120 96 117 Z',
        badge: { x: 89, y: 106 },
    },
    {
        id: 'bone-hand-left-front',
        d: 'M25 121 C30 119 35 121 37 124 C36 133 31 138 25 133 Z',
        badge: { x: 31, y: 128 },
    },
    {
        id: 'bone-hand-right-front',
        d: 'M95 121 C90 119 85 121 83 124 C84 133 89 138 95 133 Z',
        badge: { x: 89, y: 128 },
    },
    {
        id: 'bone-pelvis-front',
        d: 'M43 109 C53 116 67 116 77 109 L80 126 C69 136 51 136 40 126 Z',
        badge: { x: 60, y: 122 },
    },
    {
        id: 'bone-femur-left-front',
        d: 'M44 130 C49 133 54 134 58 133 L57 179 C53 181 47 181 43 178 Z',
        badge: { x: 50, y: 155 },
    },
    {
        id: 'bone-femur-right-front',
        d: 'M76 130 C71 133 66 134 62 133 L63 179 C67 181 73 181 77 178 Z',
        badge: { x: 70, y: 155 },
    },
    {
        id: 'bone-patella-left-front',
        d: 'M47 181 C50 180 54 180 57 181 L57 193 C53 195 48 195 44 193 Z',
        badge: { x: 51, y: 187 },
    },
    {
        id: 'bone-patella-right-front',
        d: 'M63 181 C66 180 70 180 73 181 L76 193 C72 195 67 195 63 193 Z',
        badge: { x: 69, y: 187 },
    },
    {
        id: 'bone-tibia-fibula-left-front',
        d: 'M44 196 C49 198 53 198 57 196 L55 235 C52 237 48 237 46 235 Z',
        badge: { x: 50, y: 217 },
    },
    {
        id: 'bone-tibia-fibula-right-front',
        d: 'M76 196 C71 198 67 198 63 196 L65 235 C68 237 72 237 74 235 Z',
        badge: { x: 70, y: 217 },
    },
    {
        id: 'bone-foot-left-front',
        d: 'M45 236 C49 238 54 238 56 236 C58 247 56 257 48 257 C43 254 42 245 45 236 Z',
        badge: { x: 50, y: 249 },
    },
    {
        id: 'bone-foot-right-front',
        d: 'M75 236 C71 238 66 238 64 236 C62 247 64 257 72 257 C77 254 78 245 75 236 Z',
        badge: { x: 70, y: 249 },
    },
];

const BONE_BACK_GEOMETRY: RegionGeometry[] = [
    {
        id: 'bone-skull-back',
        d: 'M50 8 C58 2 70 6 72 18 C73 28 67 34 60 35 C52 34 47 28 48 18 C48 14 49 10 50 8 Z',
        badge: { x: 60, y: 20 },
    },
    {
        id: 'bone-scapula-left-back',
        d: 'M62 49 C72 47 79 54 79 69 C74 78 66 79 62 72 Z',
        badge: { x: 70, y: 63 },
    },
    {
        id: 'bone-scapula-right-back',
        d: 'M58 49 C48 47 41 54 41 69 C46 78 54 79 58 72 Z',
        badge: { x: 50, y: 63 },
    },
    {
        id: 'bone-cervical-spine-back',
        d: 'M57 35 L63 35 L63 50 L57 50 Z',
        badge: { x: 60, y: 43 },
    },
    {
        id: 'bone-thoracic-spine-back',
        d: 'M57 50 L63 50 L64 87 L56 87 Z',
        badge: { x: 60, y: 68 },
    },
    {
        id: 'bone-lumbar-spine-back',
        d: 'M56 87 L64 87 L66 112 L54 112 Z',
        badge: { x: 60, y: 100 },
    },
    {
        id: 'bone-sacrum-coccyx-back',
        d: 'M53 112 C58 116 62 116 67 112 L66 130 C62 136 58 136 54 130 Z',
        badge: { x: 60, y: 123 },
    },
    {
        id: 'bone-pelvis-back',
        d: 'M43 111 C53 118 67 118 77 111 L80 130 C70 139 50 139 40 130 Z',
        badge: { x: 60, y: 126 },
    },
    {
        id: 'bone-femur-left-back',
        d: 'M62 134 C68 136 73 135 77 132 C78 151 78 166 76 179 C72 181 67 181 63 179 Z',
        badge: { x: 70, y: 156 },
    },
    {
        id: 'bone-femur-right-back',
        d: 'M58 134 C52 136 47 135 43 132 C42 151 42 166 44 179 C48 181 53 181 57 179 Z',
        badge: { x: 50, y: 156 },
    },
    {
        id: 'bone-tibia-fibula-left-back',
        d: 'M63 196 C68 198 72 198 76 196 L74 235 C71 237 67 237 65 235 Z',
        badge: { x: 70, y: 217 },
    },
    {
        id: 'bone-tibia-fibula-right-back',
        d: 'M57 196 C52 198 48 198 44 196 L46 235 C49 237 53 237 55 235 Z',
        badge: { x: 50, y: 217 },
    },
];

const TENDON_FRONT_GEOMETRY: RegionGeometry[] = [
    {
        id: 'tendon-biceps-left',
        d: 'M35 55 C36 65 36 76 35 87',
        badge: { x: 35, y: 70 },
    },
    {
        id: 'tendon-biceps-right',
        d: 'M85 55 C84 65 84 76 85 87',
        badge: { x: 85, y: 70 },
    },
    {
        id: 'tendon-patellar-left',
        d: 'M50 181 L50 199',
        badge: { x: 50, y: 190 },
    },
    {
        id: 'tendon-patellar-right',
        d: 'M70 181 L70 199',
        badge: { x: 70, y: 190 },
    },
    {
        id: 'tendon-plantar-fascia-left',
        d: 'M45 249 C49 253 54 253 57 249',
        badge: { x: 51, y: 252 },
    },
    {
        id: 'tendon-plantar-fascia-right',
        d: 'M63 249 C67 253 72 253 75 249',
        badge: { x: 69, y: 252 },
    },
];

const TENDON_BACK_GEOMETRY: RegionGeometry[] = [
    {
        id: 'tendon-rotator-cuff-left',
        d: 'M70 48 C76 55 76 65 70 73',
        badge: { x: 73, y: 61 },
    },
    {
        id: 'tendon-rotator-cuff-right',
        d: 'M50 48 C44 55 44 65 50 73',
        badge: { x: 47, y: 61 },
    },
    {
        id: 'tendon-achilles-left',
        d: 'M70 220 L70 247',
        badge: { x: 70, y: 235 },
    },
    {
        id: 'tendon-achilles-right',
        d: 'M50 220 L50 247',
        badge: { x: 50, y: 235 },
    },
];

const NERVE_FRONT_GEOMETRY: RegionGeometry[] = [
    {
        id: 'nerve-trigeminal-front',
        d: 'M60 18 C54 20 51 24 50 29 M60 18 C66 20 69 24 70 29',
        badge: { x: 60, y: 22 },
    },
    {
        id: 'nerve-vagus-front',
        d: 'M60 30 C60 50 61 70 61 96',
        badge: { x: 61, y: 64 },
    },
    {
        id: 'nerve-brachial-plexus-left',
        d: 'M55 42 C45 50 38 60 34 75',
        badge: { x: 43, y: 57 },
    },
    {
        id: 'nerve-brachial-plexus-right',
        d: 'M65 42 C75 50 82 60 86 75',
        badge: { x: 77, y: 57 },
    },
    {
        id: 'nerve-median-left',
        d: 'M35 72 C32 90 30 110 31 132',
        badge: { x: 32, y: 103 },
    },
    {
        id: 'nerve-median-right',
        d: 'M85 72 C88 90 90 110 89 132',
        badge: { x: 88, y: 103 },
    },
    {
        id: 'nerve-ulnar-left',
        d: 'M39 71 C36 91 34 111 35 130',
        badge: { x: 36, y: 102 },
    },
    {
        id: 'nerve-ulnar-right',
        d: 'M81 71 C84 91 86 111 85 130',
        badge: { x: 84, y: 102 },
    },
    {
        id: 'nerve-femoral-left',
        d: 'M51 120 C48 140 48 160 50 184',
        badge: { x: 50, y: 152 },
    },
    {
        id: 'nerve-femoral-right',
        d: 'M69 120 C72 140 72 160 70 184',
        badge: { x: 70, y: 152 },
    },
];

const NERVE_BACK_GEOMETRY: RegionGeometry[] = [
    {
        id: 'nerve-sciatic-left',
        d: 'M70 118 C73 142 73 166 70 202',
        badge: { x: 72, y: 160 },
    },
    {
        id: 'nerve-sciatic-right',
        d: 'M50 118 C47 142 47 166 50 202',
        badge: { x: 48, y: 160 },
    },
];

const BACK_GEOMETRY: RegionGeometry[] = [
    {
        id: 'head-back',
        d: 'M60 5 C68 5 73 11 73 19 C73 27 67 33 60 33 C53 33 47 27 47 19 C47 11 52 5 60 5 Z',
        badge: { x: 60, y: 18 },
    },
    {
        id: 'neck-back',
        d: 'M54 33 C56 35 64 35 66 33 L67 41 C64 44 56 44 53 41 Z',
        badge: { x: 60, y: 38 },
    },
    {
        id: 'left-shoulder-back',
        d: 'M70 42 C76 41 82 43 87 47 C89 49 90 53 89 57 C84 53 77 50 71 50 C70 47 70 44 70 42 Z',
        badge: { x: 81, y: 49 },
    },
    {
        id: 'right-shoulder-back',
        d: 'M50 42 C44 41 38 43 33 47 C31 49 30 53 31 57 C36 53 43 50 49 50 C50 47 50 44 50 42 Z',
        badge: { x: 39, y: 49 },
    },
    {
        id: 'left-upper-arm-back',
        d: 'M88 58 C90 53 90 50 89 50 C84 53 79 53 78 56 C79 64 81 74 83 84 C86 84 89 82 91 80 C91 72 90 65 88 58 Z',
        badge: { x: 85, y: 70 },
    },
    {
        id: 'right-upper-arm-back',
        d: 'M32 58 C30 53 30 50 31 50 C36 53 41 53 42 56 C41 64 39 74 37 84 C34 84 31 82 29 80 C29 72 30 65 32 58 Z',
        badge: { x: 35, y: 70 },
    },
    {
        id: 'left-forearm-back',
        d: 'M91 81 C89 83 86 85 83 85 C84 96 86 108 89 120 C92 120 94 118 96 116 C95 104 93 92 91 81 Z',
        badge: { x: 89, y: 102 },
    },
    {
        id: 'right-forearm-back',
        d: 'M29 81 C31 83 34 85 37 85 C36 96 34 108 31 120 C28 120 26 118 24 116 C25 104 27 92 29 81 Z',
        badge: { x: 31, y: 102 },
    },
    {
        id: 'left-lat',
        d: 'M61 46 L61 78 C68 77 74 73 78 67 C79 60 79 53 77 49 C72 47 66 46 61 46 Z',
        badge: { x: 71, y: 60 },
    },
    {
        id: 'right-lat',
        d: 'M59 46 L59 78 C52 77 46 73 42 67 C41 60 41 53 43 49 C48 47 54 46 59 46 Z',
        badge: { x: 49, y: 60 },
    },
    {
        id: 'spine-upper-back',
        d: 'M57 44 L63 44 L63 80 L57 80 Z',
        badge: { x: 60, y: 62 },
    },
    {
        id: 'spine-lower-back',
        d: 'M55 81 C58 83 62 83 65 81 L67 110 C64 113 56 113 53 110 Z',
        badge: { x: 60, y: 96 },
    },
    {
        id: 'left-glute',
        d: 'M61 112 C67 113 73 115 77 119 C78 126 76 132 71 135 C66 136 62 135 61 134 Z',
        badge: { x: 70, y: 124 },
    },
    {
        id: 'right-glute',
        d: 'M59 112 C53 113 47 115 43 119 C42 126 44 132 49 135 C54 136 58 135 59 134 Z',
        badge: { x: 50, y: 124 },
    },
    {
        id: 'left-hamstring',
        d: 'M61 135 C66 136 72 135 77 132 C78 148 78 164 77 178 C73 180 67 180 62 178 Z',
        badge: { x: 70, y: 157 },
    },
    {
        id: 'right-hamstring',
        d: 'M59 135 C54 136 48 135 43 132 C42 148 42 164 43 178 C47 180 53 180 58 178 Z',
        badge: { x: 50, y: 157 },
    },
    {
        id: 'left-knee-back',
        d: 'M62 180 C67 182 73 182 77 180 L77 194 C73 196 67 196 62 194 Z',
        badge: { x: 70, y: 187 },
    },
    {
        id: 'right-knee-back',
        d: 'M58 180 C53 182 47 182 43 180 L43 194 C47 196 53 196 58 194 Z',
        badge: { x: 50, y: 187 },
    },
    {
        id: 'left-calf',
        d: 'M63 196 C67 198 72 198 76 196 C76 209 75 221 74 234 C72 235 68 235 65 234 Z',
        badge: { x: 70, y: 215 },
    },
    {
        id: 'right-calf',
        d: 'M57 196 C53 198 48 198 44 196 C44 209 45 221 46 234 C48 235 52 235 55 234 Z',
        badge: { x: 50, y: 215 },
    },
    {
        id: 'left-ankle-back',
        d: 'M65 235 C68 236 72 236 74 235 L74 244 C72 245 68 245 65 244 Z',
        badge: { x: 70, y: 240 },
    },
    {
        id: 'right-ankle-back',
        d: 'M46 235 C48 236 52 236 55 235 L55 244 C52 245 48 245 46 244 Z',
        badge: { x: 50, y: 240 },
    },
    {
        id: 'left-foot-back',
        d: 'M65 245 C67 246 72 246 74 245 C76 248 76 251 75 255 C73 257 70 257 66 256 C64 252 64 248 65 245 Z',
        badge: { x: 70, y: 251 },
    },
    {
        id: 'right-foot-back',
        d: 'M55 245 C53 246 48 246 46 245 C44 248 44 251 45 255 C47 257 50 257 54 256 C56 252 56 248 55 245 Z',
        badge: { x: 50, y: 251 },
    },
];

// ─── color resolution ─────────────────────────────────────────────────────────

const NEUTRAL_LIGHT = '#e5e7eb';
const NEUTRAL_DARK = '#f3f4f6';
const RESOLVED_TINT = '#bbf7d0';

interface RegionVisual {
    fill: string;
    glow: 'none' | 'soreness' | 'injury' | 'issue';
    badge: number;
    resolvedOnly: boolean;
}

function isSorenessLog(injuryType: string): boolean {
    return SORENESS_TYPES.has(injuryType.toLowerCase());
}

const UNRESOLVED: InjuryStatus[] = ['active', 'improving', 'chronic'];

/** Build visual from legacy InjuryLog array */
function resolveRegionVisualFromLogs(logs: InjuryLog[]): RegionVisual {
    if (logs.length === 0) {
        return {
            fill: NEUTRAL_LIGHT,
            glow: 'none',
            badge: 0,
            resolvedOnly: false,
        };
    }
    const active = logs.filter((log) => UNRESOLVED.includes(log.status));
    if (active.length === 0) {
        return {
            fill: RESOLVED_TINT,
            glow: 'none',
            badge: 0,
            resolvedOnly: true,
        };
    }
    let maxSeverity = 0;
    let anyInjury = false;
    for (const log of active) {
        if (log.severity > maxSeverity) maxSeverity = log.severity;
        if (!isSorenessLog(log.injuryType)) anyInjury = true;
    }
    const kind = anyInjury ? 'injury' : 'soreness';
    return {
        fill: getSeverityColor(kind, maxSeverity),
        glow: kind,
        badge: active.length,
        resolvedOnly: false,
    };
}

/** Build visual from new BodyIssue array */
function resolveRegionVisualFromIssues(
    issues: BodyIssue[],
    heatmap: boolean,
): RegionVisual {
    if (issues.length === 0) {
        return {
            fill: heatmap ? '#e5e7eb' : NEUTRAL_LIGHT,
            glow: 'none',
            badge: 0,
            resolvedOnly: false,
        };
    }
    const active = issues.filter((i) => i.status !== 'resolved');
    if (active.length === 0) {
        return {
            fill: RESOLVED_TINT,
            glow: 'none',
            badge: 0,
            resolvedOnly: true,
        };
    }
    const maxSeverity = Math.max(...active.map((i) => i.severity));
    const baseColor = severityColor(maxSeverity);
    return {
        fill: heatmap ? `${baseColor}99` : baseColor, // 60% opacity in heatmap
        glow: 'issue',
        badge: active.length,
        resolvedOnly: false,
    };
}

/** Unified resolver — uses issues if provided, else logs */
function resolveRegionVisual(
    regionId: string,
    injuryLogs: InjuryLog[],
    issues: BodyIssue[] | undefined,
    heatmapMode: boolean,
    activeLayers: Set<string> | undefined,
): RegionVisual {
    const region = BODY_REGION_MAP[regionId];

    // Layer filtering: if any layer is toggled and region has no matching tissue, gray it out
    if (activeLayers && activeLayers.size > 0 && region) {
        const regionTissues = region.supportedTissueTypes as string[];
        const hasActiveLayer = regionTissues.some((t) => activeLayers.has(t));
        if (!hasActiveLayer) {
            return {
                fill: NEUTRAL_DARK,
                glow: 'none',
                badge: 0,
                resolvedOnly: false,
            };
        }
    }

    if (issues !== undefined) {
        const regionIssues = issues.filter((i) => i.regionId === regionId);
        return resolveRegionVisualFromIssues(regionIssues, heatmapMode);
    }

    const logs = getRegionLogs(injuryLogs, regionId);
    return resolveRegionVisualFromLogs(logs);
}

// ─── single region path ──────────────────────────────────────────────────────

interface RegionPathProps {
    region: BodyRegion;
    geometry: RegionGeometry;
    visual: RegionVisual;
    selected: boolean;
    readonly: boolean;
    showLabels: boolean;
    onActivate: (id: string) => void;
    onHover: (id: string | null) => void;
}

const RegionPath = React.memo(function RegionPath({
    region,
    geometry,
    visual,
    selected,
    readonly,
    showLabels,
    onActivate,
    onHover,
}: RegionPathProps) {
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<SVGPathElement>) => {
            if (readonly) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onActivate(region.id);
            }
        },
        [readonly, onActivate, region.id],
    );

    const glowColor =
        visual.glow === 'injury'
            ? '#dc2626'
            : visual.glow === 'soreness'
              ? '#ea580c'
              : visual.glow === 'issue'
                ? '#6366f1'
                : undefined;

    const stroke = selected
        ? '#4f46e5'
        : (glowColor ?? 'rgba(255,255,255,0.7)');
    const strokeWidth = selected ? 1.6 : visual.glow !== 'none' ? 1 : 0.5;
    const isMarked = visual.glow !== 'none' || visual.resolvedOnly || selected;
    const isLineRegion =
        region.supportedTissueTypes.includes('nerve') ||
        region.supportedTissueTypes.includes('tendon');

    return (
        <g>
            <path
                id={geometry.id}
                data-region-id={region.id}
                d={geometry.d}
                fill={visual.fill}
                fillOpacity={isLineRegion ? 0 : isMarked ? 0.58 : 0.001}
                stroke={stroke}
                strokeOpacity={
                    isLineRegion ? (isMarked ? 1 : 0.001) : isMarked ? 1 : 0
                }
                strokeWidth={isLineRegion ? 8 : strokeWidth}
                pointerEvents={isLineRegion ? 'stroke' : 'auto'}
                role="button"
                tabIndex={readonly ? -1 : 0}
                aria-label={region.displayName}
                aria-pressed={selected}
                onClick={readonly ? undefined : () => onActivate(region.id)}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => onHover(region.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(region.id)}
                onBlur={() => onHover(null)}
                className={
                    readonly
                        ? 'outline-none'
                        : 'cursor-pointer outline-none transition-[filter,opacity] duration-150 hover:brightness-110 hover:opacity-90 focus-visible:brightness-110'
                }
                style={
                    glowColor && visual.glow !== 'none'
                        ? { filter: `drop-shadow(0 0 1.5px ${glowColor})` }
                        : undefined
                }
            >
                {!showLabels && <title>{region.displayName}</title>}
            </path>
            {visual.badge > 0 && (
                <g aria-hidden pointerEvents="none">
                    <circle
                        cx={geometry.badge.x}
                        cy={geometry.badge.y}
                        r={3.4}
                        fill={
                            visual.glow === 'injury'
                                ? '#b91c1c'
                                : visual.glow === 'issue'
                                  ? '#4f46e5'
                                  : '#c2410c'
                        }
                        stroke="#fff"
                        strokeWidth={0.6}
                    />
                    <text
                        x={geometry.badge.x}
                        y={geometry.badge.y + 1.5}
                        textAnchor="middle"
                        fontSize={4}
                        fontWeight={700}
                        fill="#fff"
                    >
                        {visual.badge}
                    </text>
                </g>
            )}
        </g>
    );
});

// ─── single view (front or back) ─────────────────────────────────────────────

interface BodyViewProps {
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

function BodyView({
    view,
    label,
    geometry,
    activeView,
    visuals,
    issues,
    surfaceMode,
    selectedRegionId,
    readonly,
    showLabels,
    showSkeleton,
    showMuscles,
    onActivate,
    onSurfaceClick,
    onSurfaceDrawing,
    onHover,
}: BodyViewProps) {
    const [strokePoints, setStrokePoints] = useState<
        Array<{ x: number; y: number }>
    >([]);
    const drawingRef = useRef(false);
    const surfacePath = VIEW_SURFACE[view];
    const imageLayer = IMAGE_LAYER[view];
    const skinPins = useMemo(
        () =>
            (issues ?? []).filter(
                (issue) =>
                    issue.regionType === 'surface' &&
                    issue.skinX !== undefined &&
                    issue.skinY !== undefined &&
                    issue.regionId.includes(`skin-${view}-`),
            ),
        [issues, view],
    );

    function pointerToPercent(event: React.PointerEvent<SVGPathElement>) {
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        };
    }

    function handleSurfacePointerDown(
        event: React.PointerEvent<SVGPathElement>,
    ) {
        if (readonly || !surfaceMode) return;
        const point = pointerToPercent(event);
        if (!point) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drawingRef.current = true;
        setStrokePoints([point]);
    }

    function handleSurfacePointerMove(
        event: React.PointerEvent<SVGPathElement>,
    ) {
        if (!drawingRef.current) return;
        const point = pointerToPercent(event);
        if (!point) return;
        event.preventDefault();
        setStrokePoints((prev) => [...prev, point]);
    }

    function handleSurfacePointerUp(event: React.PointerEvent<SVGPathElement>) {
        if (!drawingRef.current) return;
        const points = strokePoints;
        drawingRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        if (points.length <= 2) {
            const point = points[0] ?? pointerToPercent(event);
            if (point && onSurfaceClick) onSurfaceClick(view, point.x, point.y);
            setStrokePoints([]);
            return;
        }
        const path = points
            .map(
                (point, index) =>
                    `${index === 0 ? 'M' : 'L'}${(point.x * 1.2).toFixed(2)} ${(point.y * 2.6).toFixed(2)}`,
            )
            .join(' ');
        const center = points[Math.floor(points.length / 2)] ?? points[0];
        onSurfaceDrawing?.(view, path, center.x, center.y);
        setStrokePoints([]);
    }

    return (
        <figure className="min-w-0 flex-1">
            <svg
                viewBox="0 0 120 260"
                className="h-auto w-full"
                role="group"
                aria-label={`${label} body map`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id={`anatomy-surface-${view}`}>
                        <path d={surfacePath} />
                    </clipPath>
                </defs>
                {showSkeleton && (
                    <image
                        href={
                            view === 'front'
                                ? '/assets/anatomy/skeleton-front.svg'
                                : '/assets/anatomy/skeleton-back.svg'
                        }
                        x={imageLayer.skeletonX}
                        y={4}
                        width={84}
                        height={252}
                        opacity={showMuscles ? 0.34 : 0.78}
                        preserveAspectRatio="xMidYMid meet"
                        pointerEvents="none"
                        aria-hidden
                        clipPath={`url(#anatomy-surface-${view})`}
                    />
                )}
                {showMuscles && (
                    <image
                        href="/assets/anatomy/muscles-front-back.svg"
                        x={imageLayer.muscleX}
                        y={8}
                        width={352}
                        height={250}
                        opacity={0.92}
                        preserveAspectRatio="xMinYMid meet"
                        pointerEvents="none"
                        aria-hidden
                        clipPath={`url(#anatomy-surface-${view})`}
                    />
                )}
                {activeView === 'tooth' && (
                    <g aria-hidden pointerEvents="none">
                        <path
                            d="M18 74 C30 54 90 54 102 74 C94 96 74 105 60 105 C46 105 26 96 18 74 Z"
                            fill="#f8c7bf"
                            stroke="#ef9a91"
                            strokeWidth={1.4}
                        />
                        <path
                            d="M18 134 C30 154 90 154 102 134 C94 112 74 103 60 103 C46 103 26 112 18 134 Z"
                            fill="#f8c7bf"
                            stroke="#ef9a91"
                            strokeWidth={1.4}
                        />
                        <path
                            d="M22 82 C36 69 84 69 98 82"
                            fill="none"
                            stroke="#d97167"
                            strokeWidth={1.1}
                        />
                        <path
                            d="M22 126 C36 139 84 139 98 126"
                            fill="none"
                            stroke="#d97167"
                            strokeWidth={1.1}
                        />
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-tooth-visible`}
                                d={geo.d}
                                fill="#fffaf0"
                                stroke="#9ca3af"
                                strokeWidth={0.8}
                                strokeLinejoin="round"
                            />
                        ))}
                        <text
                            x={60}
                            y={63}
                            textAnchor="middle"
                            fontSize={6}
                            fontWeight={700}
                            fill="#7f1d1d"
                        >
                            Upper teeth
                        </text>
                        <text
                            x={60}
                            y={153}
                            textAnchor="middle"
                            fontSize={6}
                            fontWeight={700}
                            fill="#7f1d1d"
                        >
                            Lower teeth
                        </text>
                    </g>
                )}
                <path
                    d={surfacePath}
                    fill="none"
                    className="stroke-transparent"
                    strokeWidth={0}
                    strokeLinejoin="round"
                    aria-hidden
                />
                {geometry.map((geo) => {
                    const region = BODY_REGION_MAP[geo.id];
                    if (!region) return null;
                    const visual = visuals[geo.id] ?? {
                        fill: NEUTRAL_LIGHT,
                        glow: 'none' as const,
                        badge: 0,
                        resolvedOnly: false,
                    };
                    return (
                        <RegionPath
                            key={`${view}-${geo.id}`}
                            region={region}
                            geometry={geo}
                            visual={visual}
                            selected={selectedRegionId === geo.id}
                            readonly={readonly}
                            showLabels={showLabels}
                            onActivate={onActivate}
                            onHover={onHover}
                        />
                    );
                })}
                {surfaceMode && (
                    <path
                        d={surfacePath}
                        fill="transparent"
                        stroke="#14b8a6"
                        strokeDasharray="2 2"
                        strokeWidth={0.8}
                        role="button"
                        tabIndex={readonly ? -1 : 0}
                        aria-label={`Place surface marker on ${label.toLowerCase()} view`}
                        onPointerDown={handleSurfacePointerDown}
                        onPointerMove={handleSurfacePointerMove}
                        onPointerUp={handleSurfacePointerUp}
                        onPointerCancel={() => {
                            drawingRef.current = false;
                            setStrokePoints([]);
                        }}
                        className={
                            readonly ? '' : 'cursor-crosshair outline-none'
                        }
                    >
                        <title>
                            Draw or click anywhere on the skin surface to log a
                            rash, bruise, cut, or irritation
                        </title>
                    </path>
                )}
                {activeView === 'nerve' && (
                    <g pointerEvents="none" aria-hidden>
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-visible`}
                                d={geo.d}
                                fill="none"
                                stroke="#38bdf8"
                                strokeDasharray="2 1.5"
                                strokeWidth={0.9}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.9}
                            />
                        ))}
                    </g>
                )}
                {activeView === 'tendon' && (
                    <g pointerEvents="none" aria-hidden>
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-visible`}
                                d={geo.d}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={1.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.95}
                            />
                        ))}
                    </g>
                )}
                {strokePoints.length > 1 && (
                    <path
                        d={strokePoints
                            .map(
                                (point, index) =>
                                    `${index === 0 ? 'M' : 'L'}${(point.x * 1.2).toFixed(2)} ${(point.y * 2.6).toFixed(2)}`,
                            )
                            .join(' ')}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pointerEvents="none"
                    />
                )}
                {skinPins.map((issue) =>
                    issue.skinDrawing ? (
                        <path
                            key={`${issue.id}-drawing`}
                            d={issue.skinDrawing}
                            fill="none"
                            stroke={severityColor(issue.severity)}
                            strokeWidth={2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity={0.9}
                            pointerEvents="none"
                        />
                    ) : null,
                )}
                {skinPins.map((issue) => (
                    <g key={issue.id} pointerEvents="none" aria-hidden>
                        <circle
                            cx={(issue.skinX ?? 0) * 1.2}
                            cy={(issue.skinY ?? 0) * 2.6}
                            r={2.6}
                            fill={severityColor(issue.severity)}
                            stroke="#fff"
                            strokeWidth={0.7}
                        />
                        <circle
                            cx={(issue.skinX ?? 0) * 1.2}
                            cy={(issue.skinY ?? 0) * 2.6}
                            r={4.6}
                            fill="none"
                            stroke={severityColor(issue.severity)}
                            strokeOpacity={0.35}
                            strokeWidth={1}
                        />
                    </g>
                ))}
            </svg>
            <figcaption className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {label}
            </figcaption>
        </figure>
    );
}

// ─── SearchBar sub-component ─────────────────────────────────────────────────

interface SearchBarProps {
    activeView: AnatomyView;
    onSelect: (regionId: string) => void;
}

function SearchBar({ activeView, onSelect }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const results = useMemo(
        () =>
            query.trim().length >= 1
                ? searchRegions(query)
                      .filter((region) =>
                          activeView === 'general'
                              ? true
                              : region.supportedTissueTypes.includes(
                                    activeView,
                                ),
                      )
                      .slice(0, 8)
                : [],
        [activeView, query],
    );

    return (
        <div className="relative mb-2">
            <input
                type="search"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search body region…"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400"
            />
            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                    {results.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onMouseDown={() => {
                                onSelect(r.id);
                                setQuery('');
                                setOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        >
                            {r.displayName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── LayerTogglePanel sub-component ──────────────────────────────────────────

const LAYER_OPTIONS: { id: AnatomyView; label: string }[] = [
    { id: 'surface', label: 'Skin' },
    { id: 'muscle', label: 'Muscle' },
    { id: 'bone', label: 'Bone' },
    { id: 'tooth', label: 'Teeth' },
    { id: 'nerve', label: 'Nerve' },
    { id: 'tendon', label: 'Tendon' },
];

const BODY_MAP_LAYERS_KEY = 'tracking_body_map_layers';
const BODY_MAP_VIEW_KEY = 'tracking_body_map_view';

interface LayerTogglePanelProps {
    activeLayers: Set<string>;
    onChange: (layers: Set<string>) => void;
}

function LayerTogglePanel({ activeLayers, onChange }: LayerTogglePanelProps) {
    function toggle(id: AnatomyView) {
        onChange(new Set([id]));
    }

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {LAYER_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        activeLayers.has(opt.id)
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'border-gray-200 text-gray-400 dark:border-zinc-700 dark:text-zinc-500'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── PanZoomCanvas sub-component ─────────────────────────────────────────────

interface PanZoomState {
    scale: number;
    x: number;
    y: number;
}

interface PanZoomCanvasProps {
    children: React.ReactNode;
    showZoomControls: boolean;
}

function PanZoomCanvas({ children, showZoomControls }: PanZoomCanvasProps) {
    const [pz, setPz] = useState<PanZoomState>({ scale: 1, x: 0, y: 0 });
    const dragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const lastDist = useRef<number | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(BODY_MAP_VIEW_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Partial<PanZoomState>;
            if (
                typeof parsed.scale === 'number' &&
                typeof parsed.x === 'number' &&
                typeof parsed.y === 'number'
            ) {
                setPz({
                    scale: Math.min(4.0, Math.max(0.6, parsed.scale)),
                    x: parsed.x,
                    y: parsed.y,
                });
            }
        } catch {
            // Ignore unavailable or invalid localStorage.
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(BODY_MAP_VIEW_KEY, JSON.stringify(pz));
        } catch {
            // Ignore unavailable localStorage.
        }
    }, [pz]);

    function onWheel(e: React.WheelEvent<HTMLDivElement>) {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setPz((prev) => {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const nextScale = Math.min(4.0, Math.max(0.6, prev.scale * delta));
            const scaleRatio = nextScale / prev.scale;
            return {
                scale: nextScale,
                x: cx - scaleRatio * (cx - prev.x),
                y: cy - scaleRatio * (cy - prev.y),
            };
        });
    }

    // Mouse drag pan
    function onMouseDown(e: React.MouseEvent) {
        dragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
    function onMouseMove(e: React.MouseEvent) {
        if (!dragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        setPz((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
    function onMouseUp() {
        dragging.current = false;
    }

    // Touch support
    function onTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDist.current = Math.hypot(dx, dy);
        } else if (e.touches.length === 1) {
            lastPos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    }
    function onTouchMove(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (lastDist.current !== null) {
                const ratio = dist / lastDist.current;
                setPz((prev) => ({
                    ...prev,
                    scale: Math.min(4.0, Math.max(0.6, prev.scale * ratio)),
                }));
            }
            lastDist.current = dist;
        } else if (e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastPos.current.x;
            const dy = e.touches[0].clientY - lastPos.current.y;
            lastPos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            setPz((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
    }
    function onTouchEnd() {
        lastDist.current = null;
    }

    function zoom(factor: number) {
        setPz((prev) => ({
            ...prev,
            scale: Math.min(4.0, Math.max(0.6, prev.scale * factor)),
        }));
    }
    function reset() {
        setPz({ scale: 1, x: 0, y: 0 });
    }

    return (
        <div
            className="relative overflow-hidden touch-none select-none"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                style={{
                    transform: `translate(${pz.x}px, ${pz.y}px) scale(${pz.scale})`,
                    transformOrigin: '0 0',
                    willChange: 'transform',
                }}
            >
                {children}
            </div>

            {showZoomControls && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <button
                        type="button"
                        onClick={() => zoom(1.25)}
                        aria-label="Zoom in"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={() => zoom(0.8)}
                        aria-label="Zoom out"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        aria-label="Reset zoom"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[9px] text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        ↺
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export interface AnatomicalBodyMapProps {
    // existing (legacy)
    injuryLogs: InjuryLog[];
    selectedRegionId?: string | null;
    onRegionClick: (regionId: string) => void;
    readonly?: boolean;
    showLabels?: boolean;
    filterTissueType?: TissueType | null;
    filterStatus?: InjuryStatus | null;
    className?: string;
    // NEW props
    issues?: BodyIssue[];
    heatmapMode?: boolean;
    activeLayers?: Set<string>;
    onLayersChange?: (layers: Set<string>) => void;
    showSearch?: boolean;
    showLayerPanel?: boolean;
    showZoomControls?: boolean;
    onSurfaceClick?: (view: 'front' | 'back', x: number, y: number) => void;
    onSurfaceDrawing?: (
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) => void;
}

function passesFilters(
    log: InjuryLog,
    tissue: TissueType | null | undefined,
    status: InjuryStatus | null | undefined,
): boolean {
    if (tissue && log.tissueType !== tissue) return false;
    if (status && log.status !== status) return false;
    return true;
}

const DEFAULT_LAYERS = new Set(['muscle']);

function activeViewFromLayers(layers: Set<string>): AnatomyView {
    const first = Array.from(layers).find((layer) =>
        LAYER_OPTIONS.some((option) => option.id === layer),
    );
    return (first as AnatomyView | undefined) ?? 'muscle';
}

function geometryForView(
    view: 'front' | 'back',
    activeView: AnatomyView,
): RegionGeometry[] {
    if (activeView === 'surface') return [];
    if (activeView === 'tooth') return view === 'front' ? DENTAL_GEOMETRY : [];
    if (activeView === 'bone')
        return view === 'front' ? BONE_FRONT_GEOMETRY : BONE_BACK_GEOMETRY;
    if (activeView === 'nerve')
        return view === 'front' ? NERVE_FRONT_GEOMETRY : NERVE_BACK_GEOMETRY;
    if (activeView === 'tendon')
        return view === 'front' ? TENDON_FRONT_GEOMETRY : TENDON_BACK_GEOMETRY;
    const base = view === 'front' ? FRONT_GEOMETRY : BACK_GEOMETRY;
    return base.filter((geo) =>
        BODY_REGION_MAP[geo.id]?.supportedTissueTypes.includes(activeView),
    );
}

function AnatomicalBodyMapBase({
    injuryLogs,
    selectedRegionId,
    onRegionClick,
    readonly = false,
    showLabels = false,
    filterTissueType = null,
    filterStatus = null,
    className,
    issues,
    heatmapMode = false,
    activeLayers: externalLayers,
    onLayersChange,
    showSearch = false,
    showLayerPanel = false,
    showZoomControls = false,
    onSurfaceClick,
    onSurfaceDrawing,
}: AnatomicalBodyMapProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [internalLayers, setInternalLayers] =
        useState<Set<string>>(DEFAULT_LAYERS);

    useEffect(() => {
        if (externalLayers) return;
        try {
            const raw = localStorage.getItem(BODY_MAP_LAYERS_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as string[];
            if (Array.isArray(parsed)) setInternalLayers(new Set(parsed));
        } catch {
            // Ignore unavailable or invalid localStorage.
        }
    }, [externalLayers]);

    const activeLayers = externalLayers ?? internalLayers;
    const activeView = activeViewFromLayers(activeLayers);

    function handleLayersChange(layers: Set<string>) {
        if (onLayersChange) {
            onLayersChange(layers);
        } else {
            setInternalLayers(layers);
        }
        try {
            localStorage.setItem(
                BODY_MAP_LAYERS_KEY,
                JSON.stringify(Array.from(layers)),
            );
        } catch {
            // Ignore unavailable localStorage.
        }
    }

    const filteredLogs = useMemo(
        () =>
            injuryLogs.filter((log) =>
                passesFilters(log, filterTissueType, filterStatus),
            ),
        [injuryLogs, filterTissueType, filterStatus],
    );

    const visuals = useMemo(() => {
        const result: Record<string, RegionVisual> = {};
        const layersForCalc = new Set<string>([activeView]);
        for (const region of Object.values(BODY_REGION_MAP)) {
            result[region.id] = resolveRegionVisual(
                region.id,
                filteredLogs,
                issues,
                heatmapMode,
                layersForCalc,
            );
        }
        return result;
    }, [filteredLogs, issues, heatmapMode, activeView]);

    const hoveredRegion = hovered ? BODY_REGION_MAP[hovered] : undefined;
    const surfaceMode = activeView === 'surface';
    const frontGeometry = geometryForView('front', activeView);
    const backGeometry = geometryForView('back', activeView);

    const mapContent = (
        <div className="flex items-start gap-3">
            <BodyView
                view="front"
                label={activeView === 'tooth' ? 'Teeth' : 'Front'}
                geometry={frontGeometry}
                activeView={activeView}
                visuals={visuals}
                issues={issues}
                surfaceMode={surfaceMode}
                selectedRegionId={selectedRegionId}
                readonly={readonly}
                showLabels={showLabels}
                showSkeleton={activeView === 'bone'}
                showMuscles={activeView === 'muscle'}
                onActivate={onRegionClick}
                onSurfaceClick={onSurfaceClick}
                onSurfaceDrawing={onSurfaceDrawing}
                onHover={setHovered}
            />
            {activeView !== 'tooth' && (
                <BodyView
                    view="back"
                    label="Back"
                    geometry={backGeometry}
                    activeView={activeView}
                    visuals={visuals}
                    issues={issues}
                    surfaceMode={surfaceMode}
                    selectedRegionId={selectedRegionId}
                    readonly={readonly}
                    showLabels={showLabels}
                    showSkeleton={activeView === 'bone'}
                    showMuscles={activeView === 'muscle'}
                    onActivate={onRegionClick}
                    onSurfaceClick={onSurfaceClick}
                    onSurfaceDrawing={onSurfaceDrawing}
                    onHover={setHovered}
                />
            )}
        </div>
    );

    return (
        <div className={className}>
            {showSearch && (
                <SearchBar activeView={activeView} onSelect={onRegionClick} />
            )}

            {showZoomControls ? (
                <PanZoomCanvas showZoomControls={showZoomControls}>
                    {mapContent}
                </PanZoomCanvas>
            ) : (
                mapContent
            )}

            {(hoveredRegion || showLabels) && (
                <p
                    className="mt-1 min-h-4 text-center text-[11px] font-medium text-gray-600 dark:text-zinc-300"
                    aria-live="polite"
                >
                    {hoveredRegion?.displayName ??
                        (showLabels
                            ? activeView === 'surface'
                                ? 'Draw or tap the skin surface to log a rash, bruise, cut, or irritation'
                                : `Hover or tap a ${activeView} region to log`
                            : '')}
                </p>
            )}

            {showLayerPanel && (
                <LayerTogglePanel
                    activeLayers={new Set([activeView])}
                    onChange={handleLayersChange}
                />
            )}
        </div>
    );
}

const AnatomicalBodyMap = React.memo(AnatomicalBodyMapBase);
export default AnatomicalBodyMap;
