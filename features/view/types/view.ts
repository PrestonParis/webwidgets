import type {
    NormalizedViewDocument,
    ViewAnnotation,
    ViewFileRef,
    ViewLayer,
    ViewRenderStrategy,
} from '@/features/view/schemas/viewSchemas';

export interface ViewRendererContract {
    id: string;
    label: string;
    mimeTypes: string[];
    strategy: ViewRenderStrategy;
    editing: 'none' | 'text' | 'annotation' | 'metadata' | 'layers';
    analysis:
        | 'none'
        | 'metadata'
        | 'text'
        | 'visual'
        | 'syntax'
        | 'placeholder_ai';
    exportFormats: string[];
    annotation: boolean;
    preview: boolean;
    securityRestrictions: string[];
    performance: 'light' | 'medium' | 'heavy';
}

export interface ViewParserContract {
    id: string;
    label: string;
    mimeTypes: string[];
    parse: (input: ViewParseInput) => Promise<NormalizedViewDocument>;
}

export interface ViewParseInput {
    file: ViewFileRef;
    text?: string;
    bytes?: ArrayBuffer;
}

export interface ViewAnalysisResult {
    fileId: string;
    entities: string[];
    stats: Record<string, number>;
    timelines: Array<{ label: string; date: string }>;
    warnings: string[];
    overlays: ViewLayer[];
}

export interface ViewStateSnapshot {
    activeFile: ViewFileRef | null;
    document: NormalizedViewDocument | null;
    annotations: ViewAnnotation[];
    layers: ViewLayer[];
    zoom: number;
    pan: { x: number; y: number };
    selectedLayerId: string | null;
}
