import { STARTING_FEN } from '@/features/chess/constants';

interface Props {
    title: string;
    onTitleChange: (v: string) => void;
    pgn: string;
    onPgnChange: (v: string) => void;
    annotation: string;
    onAnnotationChange: (v: string) => void;
    isStudyMode: boolean;
    editableStartFen: string;
    onStartFenChange: (v: string) => void;
}

const inputClass =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500';

export function VariationFormFields({
    title,
    onTitleChange,
    pgn,
    onPgnChange,
    annotation,
    onAnnotationChange,
    isStudyMode,
    editableStartFen,
    onStartFenChange,
}: Props) {
    return (
        <>
            <input
                placeholder="Title (e.g. 'Ruy Lopez: Berlin Defense')"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className={inputClass}
            />

            {isStudyMode && (
                <div>
                    <label className="text-xs text-zinc-500 block mb-1">
                        Starting FEN (leave blank for starting position)
                    </label>
                    <input
                        placeholder={STARTING_FEN}
                        value={
                            editableStartFen === STARTING_FEN
                                ? ''
                                : editableStartFen
                        }
                        onChange={(e) =>
                            onStartFenChange(e.target.value || STARTING_FEN)
                        }
                        className={`${inputClass} font-mono`}
                    />
                </div>
            )}

            <div>
                <label className="text-xs text-zinc-500 block mb-1">
                    PGN moves (just the moves, e.g. e4 e5 Nf3 Nc6)
                </label>
                <textarea
                    placeholder="e4 e5 Nf3 Nc6 Bb5 a6..."
                    value={pgn}
                    onChange={(e) => onPgnChange(e.target.value)}
                    rows={3}
                    className={`${inputClass} font-mono`}
                />
            </div>

            <textarea
                placeholder="Annotation / explanation (optional)"
                value={annotation}
                onChange={(e) => onAnnotationChange(e.target.value)}
                rows={2}
                className={inputClass}
            />
        </>
    );
}
