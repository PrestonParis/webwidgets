import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

export const financeAdapter: ImportExportAdapter = {
    id: 'finance_records',
    displayName: 'Finance',
    description:
        'Finance accounts and transactions: export your financial data',
    sourceType: 'finance_records',
    // canImport: false — complex relational data (accounts + transactions) with foreign keys
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('finance_accounts')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'finance_accounts table not found',
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
        const rows: MappedRow[] = [];
        let rowIndex = 0;

        // Export accounts
        const { data: accounts, error: accountError } = await supabase
            .from('finance_accounts')
            .select(
                'id, name, type, balance, currency, institution, created_at',
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (accountError) {
            if (isMissingTableError(accountError)) {
                warnings.push('finance_accounts table not configured');
            } else {
                throw accountError;
            }
        }

        for (const account of accounts ?? []) {
            rows.push({
                rowIndex: rowIndex++,
                data: {
                    record_type: 'account',
                    id: account.id,
                    name: account.name ?? '',
                    type: account.type ?? '',
                    balance: account.balance ?? 0,
                    currency: account.currency ?? 'USD',
                    institution: account.institution ?? '',
                    created_at: account.created_at ?? '',
                    // transaction-specific fields left empty for accounts
                    amount: null,
                    transaction_type: null,
                    category: null,
                    date: null,
                    description: null,
                },
            });
        }

        // Export recent transactions
        let txQuery = supabase
            .from('finance_transactions')
            .select(
                'id, account_id, title, merchant, amount, type, category, occurred_on, notes, created_at',
            )
            .eq('user_id', userId)
            .order('occurred_on', { ascending: false });

        if (options?.limit) txQuery = txQuery.limit(options.limit);
        else txQuery = txQuery.limit(500); // sensible default for runtime reads

        const { data: transactions, error: txError } = await txQuery;

        if (txError) {
            if (isMissingTableError(txError)) {
                warnings.push('finance_transactions table not configured');
            } else {
                throw txError;
            }
        }

        for (const tx of transactions ?? []) {
            rows.push({
                rowIndex: rowIndex++,
                data: {
                    record_type: 'transaction',
                    id: tx.id,
                    account_id: tx.account_id ?? '',
                    description: tx.title ?? tx.merchant ?? '',
                    amount: tx.amount ?? 0,
                    transaction_type: tx.type ?? '',
                    category: tx.category ?? '',
                    date: tx.occurred_on ?? '',
                    notes: tx.notes ?? '',
                    created_at: tx.created_at ?? '',
                    // account-specific fields left empty for transactions
                    name: null,
                    type: null,
                    balance: null,
                    currency: null,
                    institution: null,
                },
            });
        }

        return { rows, totalCount: rows.length, warnings };
    },
};
