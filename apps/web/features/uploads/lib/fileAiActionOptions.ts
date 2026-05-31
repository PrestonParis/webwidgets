import type { ArtifactType } from '@/features/artifacts/types/artifact';

export type FileAiActionType =
    | 'document_summary'
    | 'data_table_summary'
    | 'cheatsheet'
    | 'study_guide'
    | 'report'
    | 'action_plan';

export const FILE_AI_ACTIONS: Array<{
    type: FileAiActionType;
    label: string;
    artifactType: ArtifactType;
    description: string;
}> = [
    {
        type: 'document_summary',
        label: 'Document Summary',
        artifactType: 'summary',
        description: 'Summarize selected files and supporting workspace data.',
    },
    {
        type: 'data_table_summary',
        label: 'Data Table Summary',
        artifactType: 'report',
        description: 'Analyze selected widget exports, metrics, and tables.',
    },
    {
        type: 'cheatsheet',
        label: 'Cheatsheet',
        artifactType: 'cheatsheet',
        description: 'Turn selected material into a compact reference sheet.',
    },
    {
        type: 'study_guide',
        label: 'Study Guide',
        artifactType: 'study_guide',
        description: 'Create a guided learning document from selected sources.',
    },
    {
        type: 'report',
        label: 'Report',
        artifactType: 'report',
        description: 'Generate a polished report from files and app data.',
    },
    {
        type: 'action_plan',
        label: 'Action Plan',
        artifactType: 'action_plan',
        description: 'Extract decisions, tasks, and next steps.',
    },
];

export function getFileAiAction(type: FileAiActionType) {
    return FILE_AI_ACTIONS.find((action) => action.type === type);
}
