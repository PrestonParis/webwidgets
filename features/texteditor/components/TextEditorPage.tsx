'use client';

import { useState } from 'react';
import { ModeSelector } from '@/features/texteditor/components/ModeSelector';
import { NoteEditorPage } from '@/features/texteditor/components/NoteEditorPage';
import { ScratchpadPage } from '@/features/texteditor/components/ScratchpadPage';
import { TE_STYLES } from '@/features/texteditor/constants';
import type { TextEditorMode } from '@/features/texteditor/types';

function TextEditorHeader({
    mode,
    onModeChange,
}: {
    mode: TextEditorMode;
    onModeChange: (mode: TextEditorMode) => void;
}) {
    return (
        <header className="flex items-center justify-between px-6 py-3 border-b border-stone-100 dark:border-zinc-800/60 shrink-0 bg-stone-50/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <span className="text-sm font-semibold text-stone-800 dark:text-zinc-200 tracking-tight">
                TextEditor
            </span>
            <ModeSelector mode={mode} onChange={onModeChange} />
            <div className="w-24" />
        </header>
    );
}

export default function TextEditorPage({
    initialMode = 'document',
}: {
    initialMode?: TextEditorMode;
}) {
    const [mode, setMode] = useState<TextEditorMode>(initialMode);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: TE_STYLES }} />
            <div className="flex flex-col h-screen bg-white dark:bg-zinc-900">
                <TextEditorHeader mode={mode} onModeChange={setMode} />
                <div className="flex flex-1 overflow-hidden">
                    {mode === 'scratchpad' ? (
                        <div className="flex-1 overflow-y-auto">
                            <ScratchpadPage />
                        </div>
                    ) : (
                        <NoteEditorPage noteType={mode} />
                    )}
                </div>
            </div>
        </>
    );
}
