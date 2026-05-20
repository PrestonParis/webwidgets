import type { TextEditorMode } from '@/features/texteditor/types';
import Header from '@/features/ui/components/Header';
import TextEditorPage from '@/features/texteditor/components/TextEditorPage';

const VALID_MODES: TextEditorMode[] = ['document', 'journal', 'scratchpad'];

function toMode(raw: string | undefined): TextEditorMode {
    return VALID_MODES.includes(raw as TextEditorMode)
        ? (raw as TextEditorMode)
        : 'document';
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>;
}) {
    const params = await searchParams;
    const mode = toMode(params.mode);

    return (
        <>
            <Header />
            <TextEditorPage initialMode={mode} />
        </>
    );
}
