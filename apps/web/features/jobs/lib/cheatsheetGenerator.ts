import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getModelKey } from '@/features/jobs/lib/modelKeyHelper';
import { sharedLlmKey } from '@/lib/llm/sharedKeys';

export interface CheatsheetInput {
    title: string;
    sourceText: string;
    userId: string;
    sourceFileId?: string;
    sourceDocumentId?: string;
}

export interface CheatsheetResult {
    title: string;
    content: string; // markdown
}

const CHEATSHEET_PROMPT = `You are a study assistant. Given source text, generate a structured cheatsheet in Markdown format with these sections:

## Summary
(2-3 sentence overview)

## Key Concepts
(bulleted list of main ideas)

## Definitions
(term: definition format)

## Important Facts
(bulleted list)

## Likely Review Points
(what someone would be tested on)

## Quick Review
(5-7 bullet summary)

Source text:
---
{text}
---

Return only the Markdown cheatsheet.`;

// NOTE: BullMQ is used only in the conversion service. Job execution in the web app
// is synchronous in the API route handler for Stage 1 (jobs are small enough).
// Switch to a proper queue when job volume increases.

export async function generateCheatsheet(
    supabase: SupabaseClient,
    input: CheatsheetInput,
): Promise<CheatsheetResult> {
    const cheatsheetTitle = `Cheatsheet: ${input.title}`;

    try {
        // 1. Attempt to get LLM key — user key first, then env fallback
        const apiKey =
            (await getModelKey(supabase, input.userId, 'anthropic').catch(
                () => null,
            )) ??
            sharedLlmKey('ANTHROPIC_API_KEY') ??
            null;

        if (!apiKey) {
            // Return placeholder when no key is available
            return {
                title: cheatsheetTitle,
                content: buildPlaceholder(input.title, input.sourceText),
            };
        }

        // 2. Truncate very long source text to stay within context limits
        const truncatedText = input.sourceText.slice(0, 60_000);
        const prompt = CHEATSHEET_PROMPT.replace('{text}', truncatedText);

        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        const firstBlock = response.content[0];
        const content =
            firstBlock?.type === 'text'
                ? firstBlock.text
                : buildPlaceholder(input.title, input.sourceText);

        return { title: cheatsheetTitle, content };
    } catch (err) {
        // Never throw — return an error artifact marker instead
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        return {
            title: cheatsheetTitle,
            content: `<!-- PLACEHOLDER: No AI key configured. Replace with real generation. -->\n\n# ${cheatsheetTitle}\n\n> **Generation failed:** ${errMsg}\n\nPlease retry after ensuring your Anthropic API key is configured in Settings.`,
        };
    }
}

function buildPlaceholder(title: string, sourceText: string): string {
    const preview = sourceText.slice(0, 200).replace(/\n/g, ' ');
    return `<!-- PLACEHOLDER: No AI key configured. Replace with real generation. -->

# Cheatsheet: ${title}

> This is a placeholder cheatsheet. Configure your Anthropic API key in Settings to generate real content.

## Summary
*(AI-generated summary will appear here)*

## Key Concepts
- *(Key concepts from the source material)*

## Source Preview
\`\`\`
${preview}${sourceText.length > 200 ? '...' : ''}
\`\`\`

## Quick Review
- *(Quick review bullets will appear here)*
`;
}
