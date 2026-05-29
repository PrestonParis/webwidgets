import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

export const memoryDecksAdapter: ImportExportAdapter = {
    id: 'memory_decks',
    displayName: 'Memory Decks',
    description:
        'Memorization decks — deck summaries with card counts and due review stats',
    sourceType: 'memory_decks',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('memory_decks')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'memory_decks table not found',
                    };
                }
                return { available: false, message: error.message };
            }
            return { available: true };
        } catch (e) {
            return {
                available: false,
                message: e instanceof Error ? e.message : 'Unknown error',
            };
        }
    },

    async exportData(
        userId: string,
        options?: ExportOptions,
    ): Promise<ExportResult> {
        const { supabase } = await createClients();
        const warnings: string[] = [];

        // Fetch all decks for the user
        let deckQuery = supabase
            .from('memory_decks')
            .select('id, title, domain, description, status, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.limit) deckQuery = deckQuery.limit(options.limit);

        const { data: decks, error: deckError } = await deckQuery;
        if (deckError) {
            if (isMissingTableError(deckError)) {
                warnings.push('memory_decks table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw deckError;
        }

        if (!decks || decks.length === 0) {
            return { rows: [], totalCount: 0, warnings };
        }

        const deckIds = decks.map((d) => d.id as string);
        const now = new Date().toISOString();

        // Fetch card counts and due counts in one query per deck would be N+1.
        // Instead fetch all cards for the user's decks in two queries:
        // 1. Total cards per deck
        // 2. Due cards (due_date <= now) per deck
        const { data: allCards, error: cardError } = await supabase
            .from('memory_cards')
            .select('deck_id, due_date, status')
            .in('deck_id', deckIds)
            .eq('user_id', userId);

        if (cardError && !isMissingTableError(cardError)) {
            warnings.push(`Could not fetch card counts: ${cardError.message}`);
        }
        if (cardError && isMissingTableError(cardError)) {
            warnings.push(
                'memory_cards table not configured — card counts will be 0',
            );
        }

        const cards = (allCards ?? []) as {
            deck_id: string;
            due_date: string | null;
            status: string | null;
        }[];

        // Aggregate per-deck stats
        const deckStats: Record<
            string,
            { card_count: number; due_count: number; mastered_count: number }
        > = {};
        for (const c of cards) {
            const stats = deckStats[c.deck_id] ?? {
                card_count: 0,
                due_count: 0,
                mastered_count: 0,
            };
            stats.card_count++;
            if (c.due_date && c.due_date <= now) stats.due_count++;
            if (c.status === 'mastered') stats.mastered_count++;
            deckStats[c.deck_id] = stats;
        }

        const rows: MappedRow[] = decks.map((deck, i) => {
            const stats = deckStats[deck.id as string] ?? {
                card_count: 0,
                due_count: 0,
                mastered_count: 0,
            };
            return {
                rowIndex: i,
                data: {
                    id: deck.id,
                    title: deck.title ?? '',
                    domain: deck.domain ?? '',
                    description: deck.description ?? '',
                    status: deck.status ?? 'active',
                    card_count: stats.card_count,
                    due_count: stats.due_count,
                    mastered_count: stats.mastered_count,
                    created_at: deck.created_at ?? '',
                },
            };
        });

        return { rows, totalCount: rows.length, warnings };
    },
};
