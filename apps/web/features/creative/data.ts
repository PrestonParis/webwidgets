import {
    BoxSelect,
    Download,
    Image,
    MessageSquare,
    MousePointer2,
    PenLine,
    Shapes,
    Type,
} from 'lucide-react';
import type {
    CreativeExportTarget,
    CreativeTool,
} from './types';

export const creativeTools: {
    id: CreativeTool;
    label: string;
    icon: typeof MousePointer2;
}[] = [
    { id: 'select', label: 'Select', icon: MousePointer2 },
    { id: 'pen', label: 'Pen', icon: PenLine },
    { id: 'shape', label: 'Shape', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'image', label: 'Image', icon: Image },
    { id: 'comment', label: 'Comment', icon: MessageSquare },
];

export const creativeExports: CreativeExportTarget[] = [
    {
        id: 'png',
        label: 'PNG',
        description: 'Raster image for sharing and previews.',
        ready: true,
    },
    {
        id: 'svg',
        label: 'SVG',
        description: 'Editable vector handoff for design systems.',
        ready: true,
    },
    {
        id: 'pdf',
        label: 'PDF',
        description: 'Printable document and review artifact.',
        ready: false,
    },
    {
        id: 'widget',
        label: 'Widget',
        description: 'Convert the composition into a dashboard widget draft.',
        ready: true,
    },
];

export const selectIcon = BoxSelect;
export const downloadIcon = Download;
