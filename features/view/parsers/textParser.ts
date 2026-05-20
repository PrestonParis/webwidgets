import { marked } from 'marked';
import { sanitizeRichText } from '@/features/view/security/contentSecurity';
import type { ViewParseInput } from '@/features/view/types/view';
import {
    inferCodeLanguage,
    normalizedDocument,
} from '@/features/view/parsers/parserUtils';

export async function parseTextLikeFile(input: ViewParseInput) {
    const text = input.text ?? '';
    const language = inferCodeLanguage(input.file.name, input.file.mimeType);
    const isMarkdown =
        input.file.mimeType.includes('markdown') ||
        input.file.name.endsWith('.md');
    const strategy = isMarkdown
        ? 'markdown_html'
        : language === 'text'
          ? 'plain_text'
          : 'code_block';
    const html = isMarkdown
        ? sanitizeRichText(await marked.parse(text))
        : undefined;

    return normalizedDocument({
        file: input.file,
        strategy,
        searchableText: text,
        renderable: {
            text,
            html,
            language,
            lineCount: text.split('\n').length,
        },
        metadata: { language, characterCount: text.length },
        analysisHints: [
            'metadata-inspection',
            'text-statistics',
            language === 'text'
                ? 'entity-extraction-placeholder'
                : 'syntax-analysis',
        ],
        sanitized: isMarkdown,
    });
}
