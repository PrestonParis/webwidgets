export interface RegionGeometry {
    id: string;
    d: string;
    badge: { x: number; y: number };
}

export const SORENESS_TYPES = new Set([
    'soreness',
    'doms',
    'tightness',
    'cramp',
]);

export const FRONT_SURFACE =
    'M60 5 C68 5 73 12 73 20 C73 27 68 33 63 35 L65 43 ' +
    'C75 44 85 48 91 58 C97 68 98 83 96 101 C95 114 93 127 91 137 ' +
    'L84 135 C85 123 87 106 88 91 C88 104 87 120 85 136 C83 148 80 158 78 169 ' +
    'C76 188 75 207 74 225 C73 239 73 251 70 256 C67 260 62 259 60 254 ' +
    'C58 259 53 260 50 256 C47 251 47 239 46 225 C45 207 44 188 42 169 ' +
    'C40 158 37 148 35 136 C33 120 32 104 32 91 C33 106 35 123 36 135 ' +
    'L29 137 C27 127 25 114 24 101 C22 83 23 68 29 58 C35 48 45 44 55 43 ' +
    'L57 35 C52 33 47 27 47 20 C47 12 52 5 60 5 Z';

export const BACK_SURFACE =
    'M60 5 C68 5 73 12 73 20 C73 27 68 33 63 35 L65 43 ' +
    'C76 44 86 49 92 60 C98 72 99 91 96 110 C93 127 90 139 87 146 ' +
    'L80 143 C82 130 84 113 85 98 C85 114 84 130 82 145 C80 158 78 170 77 184 ' +
    'C76 199 76 216 75 232 C74 246 73 255 70 258 C67 260 62 259 60 254 ' +
    'C58 259 53 260 50 258 C47 255 46 246 45 232 C44 216 44 199 43 184 ' +
    'C42 170 40 158 38 145 C36 130 35 114 35 98 C36 113 38 130 40 143 ' +
    'L33 146 C30 139 27 127 24 110 C21 91 22 72 28 60 C34 49 44 44 55 43 ' +
    'L57 35 C52 33 47 27 47 20 C47 12 52 5 60 5 Z';

export const VIEW_SURFACE: Record<'front' | 'back', string> = {
    front: FRONT_SURFACE,
    back: BACK_SURFACE,
};

export const IMAGE_LAYER: Record<
    'front' | 'back',
    { muscleX: number; skeletonX: number }
> = {
    front: { muscleX: -18, skeletonX: 18 },
    back: { muscleX: -215, skeletonX: 18 },
};

export const FRONT_GEOMETRY: RegionGeometry[] = [
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

export const DENTAL_GEOMETRY: RegionGeometry[] = Array.from(
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
