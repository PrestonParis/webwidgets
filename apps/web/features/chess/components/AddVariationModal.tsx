import { AddVariationModalProps } from '@/features/chess/types/variation';
import { useAddVariation } from '@/features/chess/hooks/useAddVariation';
import { VariationFormFields } from './VariationFormFields';

export function AddVariationModal(props: AddVariationModalProps) {
    const {
        title,
        setTitle,
        pgn,
        setPgn,
        annotation,
        setAnnotation,
        editableStartFen,
        setEditableStartFen,
        saving,
        handleSave,
        isStudyMode,
    } = useAddVariation(props);

    const branchIndex =
        !isStudyMode && 'branchIndex' in props ? props.branchIndex : null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="font-semibold text-zinc-100">
                    {isStudyMode
                        ? 'Add Variation to Study'
                        : `Add Variation at Move ${branchIndex}`}
                </h2>

                <VariationFormFields
                    title={title}
                    onTitleChange={setTitle}
                    pgn={pgn}
                    onPgnChange={setPgn}
                    annotation={annotation}
                    onAnnotationChange={setAnnotation}
                    isStudyMode={isStudyMode}
                    editableStartFen={editableStartFen}
                    onStartFenChange={setEditableStartFen}
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={props.onClose}
                        className="text-sm px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            void handleSave();
                        }}
                        disabled={saving || !title.trim() || !pgn.trim()}
                        className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving…' : 'Save Variation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
