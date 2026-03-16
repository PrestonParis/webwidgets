// Global types

declare module 'react-plotly.js' {
    import { PlotParams } from 'react-plotly.js';
    import React from 'react';
    const Plot: React.ComponentType<PlotParams>;
    export default Plot;
}

declare module 'plotly.js' {
    export interface Data {
        [key: string]: unknown;
    }
    export interface Layout {
        [key: string]: unknown;
    }
    export interface Figure {
        data: Data[];
        layout: Partial<Layout>;
    }
}