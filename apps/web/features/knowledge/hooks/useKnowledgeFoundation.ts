import { KNOWLEDGE_WIDGETS } from '@/features/knowledge/lib/knowledgeRegistry';

export function useKnowledgeFoundation() {
    return { widgets: KNOWLEDGE_WIDGETS };
}
