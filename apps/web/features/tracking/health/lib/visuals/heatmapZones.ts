import type { BodyZoneId } from '@/features/tracking/health/types/health';

export type Shape =
    | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
    | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number };

export const ANTERIOR_ZONES: Array<{ id: BodyZoneId; shape: Shape }> = [
    { id: 'head', shape: { kind: 'ellipse', cx: 50, cy: 15, rx: 12, ry: 14 } },
    { id: 'neck', shape: { kind: 'rect', x: 44, y: 28, w: 12, h: 8, rx: 3 } },
    {
        id: 'left-shoulder',
        shape: { kind: 'ellipse', cx: 26, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'right-shoulder',
        shape: { kind: 'ellipse', cx: 74, cy: 42, rx: 9, ry: 9 },
    },
    { id: 'chest', shape: { kind: 'rect', x: 33, y: 38, w: 34, h: 26, rx: 6 } },
    {
        id: 'left-upper-arm',
        shape: { kind: 'rect', x: 16, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'right-upper-arm',
        shape: { kind: 'rect', x: 73, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'abdomen',
        shape: { kind: 'rect', x: 35, y: 65, w: 30, h: 26, rx: 6 },
    },
    {
        id: 'left-forearm',
        shape: { kind: 'rect', x: 13, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'right-forearm',
        shape: { kind: 'rect', x: 77, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'left-hand',
        shape: { kind: 'ellipse', cx: 17, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'right-hand',
        shape: { kind: 'ellipse', cx: 83, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'left-hip',
        shape: { kind: 'ellipse', cx: 40, cy: 96, rx: 9, ry: 7 },
    },
    {
        id: 'right-hip',
        shape: { kind: 'ellipse', cx: 60, cy: 96, rx: 9, ry: 7 },
    },
    {
        id: 'left-quad',
        shape: { kind: 'rect', x: 32, y: 102, w: 15, h: 38, rx: 6 },
    },
    {
        id: 'right-quad',
        shape: { kind: 'rect', x: 53, y: 102, w: 15, h: 38, rx: 6 },
    },
    {
        id: 'left-knee',
        shape: { kind: 'ellipse', cx: 39, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'right-knee',
        shape: { kind: 'ellipse', cx: 61, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'left-shin',
        shape: { kind: 'rect', x: 33, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'right-shin',
        shape: { kind: 'rect', x: 54, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'left-ankle',
        shape: { kind: 'ellipse', cx: 39, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'right-ankle',
        shape: { kind: 'ellipse', cx: 61, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'left-foot',
        shape: { kind: 'ellipse', cx: 39, cy: 196, rx: 7, ry: 4 },
    },
    {
        id: 'right-foot',
        shape: { kind: 'ellipse', cx: 61, cy: 196, rx: 7, ry: 4 },
    },
];

export const POSTERIOR_ZONES: Array<{ id: BodyZoneId; shape: Shape }> = [
    { id: 'head', shape: { kind: 'ellipse', cx: 50, cy: 15, rx: 12, ry: 14 } },
    { id: 'neck', shape: { kind: 'rect', x: 44, y: 28, w: 12, h: 8, rx: 3 } },
    {
        id: 'right-shoulder',
        shape: { kind: 'ellipse', cx: 26, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'left-shoulder',
        shape: { kind: 'ellipse', cx: 74, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'upper-back',
        shape: { kind: 'rect', x: 33, y: 38, w: 34, h: 26, rx: 6 },
    },
    {
        id: 'right-upper-arm',
        shape: { kind: 'rect', x: 16, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'left-upper-arm',
        shape: { kind: 'rect', x: 73, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'lower-back',
        shape: { kind: 'rect', x: 35, y: 65, w: 30, h: 26, rx: 6 },
    },
    {
        id: 'right-forearm',
        shape: { kind: 'rect', x: 13, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'left-forearm',
        shape: { kind: 'rect', x: 77, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'right-hand',
        shape: { kind: 'ellipse', cx: 17, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'left-hand',
        shape: { kind: 'ellipse', cx: 83, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'right-glute',
        shape: { kind: 'ellipse', cx: 40, cy: 98, rx: 10, ry: 8 },
    },
    {
        id: 'left-glute',
        shape: { kind: 'ellipse', cx: 60, cy: 98, rx: 10, ry: 8 },
    },
    {
        id: 'right-hamstring',
        shape: { kind: 'rect', x: 32, y: 106, w: 15, h: 36, rx: 6 },
    },
    {
        id: 'left-hamstring',
        shape: { kind: 'rect', x: 53, y: 106, w: 15, h: 36, rx: 6 },
    },
    {
        id: 'right-knee',
        shape: { kind: 'ellipse', cx: 39, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'left-knee',
        shape: { kind: 'ellipse', cx: 61, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'right-calf',
        shape: { kind: 'rect', x: 33, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'left-calf',
        shape: { kind: 'rect', x: 54, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'right-ankle',
        shape: { kind: 'ellipse', cx: 39, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'left-ankle',
        shape: { kind: 'ellipse', cx: 61, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'right-foot',
        shape: { kind: 'ellipse', cx: 39, cy: 196, rx: 7, ry: 4 },
    },
    {
        id: 'left-foot',
        shape: { kind: 'ellipse', cx: 61, cy: 196, rx: 7, ry: 4 },
    },
];
