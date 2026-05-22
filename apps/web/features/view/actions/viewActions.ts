export const VIEW_ACTIONS = [
    {
        id: 'view.annotate',
        label: 'Annotate',
        actionEngineId: 'data.save_bookmark',
        destructiveLevel: 'safe',
    },
    {
        id: 'view.export',
        label: 'Export',
        actionEngineId: 'data.export',
        destructiveLevel: 'safe',
    },
    {
        id: 'view.add_to_research',
        label: 'Add to Research',
        actionEngineId: 'research.add_item',
        destructiveLevel: 'safe',
    },
    {
        id: 'view.generate_summary',
        label: 'Generate Summary',
        actionEngineId: 'ai.summarize',
        destructiveLevel: 'safe',
    },
    {
        id: 'view.create_timeline_event',
        label: 'Create Timeline Event',
        actionEngineId: 'workflow.trigger',
        destructiveLevel: 'warning',
    },
];
