import type { RegionGeometry } from './svgFrontPaths';

export const BACK_GEOMETRY: RegionGeometry[] = [
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

export const BONE_FRONT_GEOMETRY: RegionGeometry[] = [
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

export const BONE_BACK_GEOMETRY: RegionGeometry[] = [
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

export const TENDON_FRONT_GEOMETRY: RegionGeometry[] = [
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

export const TENDON_BACK_GEOMETRY: RegionGeometry[] = [
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

export const NERVE_FRONT_GEOMETRY: RegionGeometry[] = [
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

export const NERVE_BACK_GEOMETRY: RegionGeometry[] = [
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
