'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    createKnowledgeItem,
    listKnowledgeItems,
} from '@/features/knowledge/services/knowledgeService';
import type { KnowledgeItem } from '@/features/knowledge/types/knowledge';

export function useKnowledgeItems() {
    const { userId } = useAuth();
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setItems(await listKnowledgeItems(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listKnowledgeItems(userId).then((next) => {
            if (active) setItems(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createItem = useCallback(
        async (input: Omit<KnowledgeItem, 'id' | 'userId' | 'createdAt'>) => {
            if (!userId) return null;
            const item = await createKnowledgeItem({ ...input, userId });
            setItems((current) => [item, ...current]);
            return item;
        },
        [userId],
    );

    return { items, loading, reload, createItem };
}
