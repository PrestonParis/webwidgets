export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'range';

export interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    options?: string[]; // for 'select'
    min?: number; // for 'range' / 'number'
    max?: number;
    step?: number;
    unit?: string;
    required?: boolean;
}

export interface CustomCategoryDef {
    id: string; // URL-safe slug, used as the category value in DB
    label: string;
    emoji: string;
    color: string; // tailwind color name: indigo, teal, rose, etc.
    fields: FieldDef[];
    createdAt: string; // ISO date
}
