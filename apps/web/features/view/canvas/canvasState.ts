export interface ViewCanvasTransform {
    zoom: number;
    pan: { x: number; y: number };
    selectedObjectIds: string[];
    snapping: boolean;
}

export const defaultCanvasTransform: ViewCanvasTransform = {
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedObjectIds: [],
    snapping: false,
};

export function zoomCanvas(
    state: ViewCanvasTransform,
    delta: number,
): ViewCanvasTransform {
    return {
        ...state,
        zoom: Math.max(
            0.2,
            Math.min(4, Number((state.zoom + delta).toFixed(2))),
        ),
    };
}
