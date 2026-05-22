export type KnowledgeItemKind =
    | 'note'
    | 'journal'
    | 'draft'
    | 'transcript'
    | 'audio-dump'
    | 'archive'
    | 'research-task';

export interface KnowledgeSource {
    id: string;
    label: string;
    url?: string;
    provider?: 'manual' | 'obsidian' | 'youtube' | 'google-docs';
}

export interface KnowledgeItem {
    id: string;
    userId: string;
    kind: KnowledgeItemKind;
    title: string;
    body: string;
    tags: string[];
    collectionIds: string[];
    sources: KnowledgeSource[];
    createdAt: string;
}

export interface KnowledgeCollection {
    id: string;
    userId: string;
    name: string;
    description?: string;
}
