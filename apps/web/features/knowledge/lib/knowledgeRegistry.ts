export const KNOWLEDGE_WIDGETS = [
    {
        id: 'quick-note',
        title: 'Quick note',
        description: 'Capture notes, drafts, and archive fragments.',
        status: 'Ready shell',
    },
    {
        id: 'journal-prompt',
        title: 'Journal prompt',
        description: 'Reflection prompts connected to future daily review.',
        status: 'Scaffold',
    },
    {
        id: 'recent-notes',
        title: 'Recent notes',
        description:
            'Recent knowledge items across notes, journal, and drafts.',
        status: 'Scaffold',
    },
    {
        id: 'research-queue',
        title: 'Research queue',
        description: 'Questions, sources, and synthesis tasks.',
        status: 'Scaffold',
    },
    {
        id: 'on-this-day',
        title: 'On this day',
        description: 'Archive resurfacing for dated journal and note entries.',
        status: 'Coming soon',
    },
    {
        id: 'source-collector',
        title: 'Source collector',
        description:
            'Manual source capture today, integration expansion later.',
        status: 'Scaffold',
    },
] as const;
