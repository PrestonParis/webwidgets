import { SupabaseClient } from '@supabase/supabase-js';
import { classifyEmails, ClassifyOptions } from './classifyEmails';
import { z } from 'zod';

type ParsedEmail = { id: string; sender: string; subject: string };
type CategoryEntry = { category: string; is_manual: boolean };

const classificationSchema = z.object({
    email_id: z.string(),
    sender: z.string(),
    category: z.string(),
    is_manual: z.boolean(),
});
const classificationsSchema = z.array(classificationSchema);

export async function resolveClassifications(
    supabase: SupabaseClient,
    userId: string,
    parsed: ParsedEmail[],
    classifyOptions: ClassifyOptions = { useAI: false },
): Promise<Map<string, CategoryEntry>> {
    const emailIds = parsed.map((e) => e.id);
    const senders = [...new Set(parsed.map((e) => e.sender))];

    const { data: existing } = await supabase
        .from('email_classifications')
        .select('email_id, sender, category, is_manual')
        .eq('user_id', userId)
        .or(
            `email_id.in.(${emailIds.map((id) => `"${id}"`).join(',')}),` +
                `sender.in.(${senders.map((s) => `"${s}"`).join(',')})`,
        );

    const parsedExisting = classificationsSchema.safeParse(existing);
    const rows = parsedExisting.success ? parsedExisting.data : [];
    const byId = new Map(rows.map((c) => [c.email_id, c]));
    const bySender = new Map(rows.map((c) => [c.sender, c]));

    const categoryMap = new Map<string, CategoryEntry>();
    const needsAI: {
        idx: number;
        id: string;
        sender: string;
        subject: string;
    }[] = [];

    for (let i = 0; i < parsed.length; i++) {
        const email = parsed[i];
        if (!email) continue;
        const hit = byId.get(email.id) ?? bySender.get(email.sender);
        if (hit) {
            categoryMap.set(email.id, {
                category: hit.category,
                is_manual: hit.is_manual,
            });
        } else {
            needsAI.push({ idx: i, ...email });
        }
    }

    if (needsAI.length > 0) {
        const predictions = await classifyEmails(
            needsAI.map(({ idx, sender, subject }) => ({
                idx,
                sender,
                subject,
            })),
            classifyOptions,
        );

        const toInsert = needsAI.map(({ idx, id, sender, subject }) => ({
            user_id: userId,
            email_id: id,
            sender,
            subject,
            category: predictions.get(idx) ?? 'other',
            is_manual: false,
        }));

        await supabase.from('email_classifications').upsert(toInsert, {
            onConflict: 'user_id,email_id',
            ignoreDuplicates: true,
        });

        for (const row of toInsert) {
            categoryMap.set(row.email_id, {
                category: row.category,
                is_manual: false,
            });
        }
    }

    return categoryMap;
}
