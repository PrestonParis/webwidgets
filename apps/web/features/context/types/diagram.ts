export interface DiagramNodeState {
    entityId: string;
    x: number;
    y: number;
    selected: boolean;
}

export interface DiagramViewport {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export type DiagramTool = 'select' | 'pan';
