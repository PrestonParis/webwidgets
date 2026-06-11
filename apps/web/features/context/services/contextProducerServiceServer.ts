import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { ingestContextNode } from './contextService';

export async function ingestFinanceTransactionContext(
    userId: string,
    tx: {
        id: string;
        title: string;
        amount: number;
        type: string;
        category: string;
    },
): Promise<void> {
    try {
        const { supabase } = await createClients();
        const sign =
            tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↕';
        await ingestContextNode(supabase, userId, {
            entityId: `finance_tx:${tx.id}`,
            type: 'artifact',
            label: tx.title,
            summary: `${sign}$${Math.abs(tx.amount).toFixed(2)} · ${tx.category}`,
            data: {
                transactionId: tx.id,
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
            },
            tags: ['finance', tx.type, tx.category],
            sourceType: 'finance_records',
            sourceId: tx.id,
            sourceTable: 'finance_transactions',
            createdByType: 'user',
            status: 'active',
            permissions: ['private'],
        });
    } catch {
        // silently ignore — context ingestion is non-critical
    }
}

export async function ingestDocumentContext(
    supabase: SupabaseClient,
    userId: string,
    doc: { id: string; title?: string; content?: string; type?: string },
): Promise<void> {
    try {
        const snippet = (doc.content ?? '').slice(0, 200);
        await ingestContextNode(supabase, userId, {
            entityId: `document:${doc.id}`,
            type: 'document',
            label: doc.title ?? 'Document',
            summary: snippet,
            data: { documentId: doc.id },
            tags: ['document'],
            sourceType: 'documents',
            sourceId: doc.id,
            sourceTable: 'journal_entries',
            createdByType: 'user',
            status: 'active',
            permissions: ['private', 'ai'],
        });
    } catch {
        // silently ignore
    }
}
