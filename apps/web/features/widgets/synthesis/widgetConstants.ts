import type { WidgetBuilderStepId } from './widgetTypes';

export interface WidgetBuilderStepConfig {
    id: WidgetBuilderStepId;
    label: string;
    description: string;
    optional: boolean;
}

export const BUILDER_STEPS: WidgetBuilderStepConfig[] = [
    {
        id: 'purpose',
        label: 'Purpose',
        description: 'What this widget does',
        optional: false,
    },
    {
        id: 'data_source',
        label: 'Data Source',
        description: 'Where data comes from',
        optional: false,
    },
    {
        id: 'transform',
        label: 'Transform',
        description: 'Clean and reshape data',
        optional: true,
    },
    {
        id: 'layout',
        label: 'Layout',
        description: 'Overall widget structure',
        optional: false,
    },
    {
        id: 'components',
        label: 'Components',
        description: 'UI building blocks',
        optional: false,
    },
    {
        id: 'actions',
        label: 'Actions',
        description: 'What users can do',
        optional: true,
    },
    {
        id: 'automations',
        label: 'Automations',
        description: 'Automatic behaviors',
        optional: true,
    },
    {
        id: 'permissions',
        label: 'Permissions',
        description: 'Access review',
        optional: false,
    },
    {
        id: 'preview',
        label: 'Preview',
        description: 'Test your widget',
        optional: false,
    },
    {
        id: 'save',
        label: 'Save',
        description: 'Name and add to dashboard',
        optional: false,
    },
];
