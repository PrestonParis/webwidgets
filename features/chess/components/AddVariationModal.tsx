import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { GameVariation, VariationInsert } from '@/types/chess';
import { AddVariationModalProps } from '@/types/chess';
import { STARTING_FEN } from '@/features/chess/constants';

export function AddVariationModal(props: AddVariationModalProps) {
    const isStudyMode = 'studyId' in props;

    const [title, setTitle] = useState('');
    const [pgn, setPgn] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [editableStartFen, setEditableStartFen] = useState(STARTING_FEN);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !pgn.trim()) return;
        setSaving(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setSaving(false);
            return;
        }

        let insertData: VariationInsert;

        if (isStudyMode) {
            insertData = {
                user_id: user.id,
                title: title.trim(),
                pgn: pgn.trim(),
                annotation: annotation.trim() || null,
                study_id: props.studyId,
                start_fen: editableStartFen.trim() || STARTING_FEN,
            };
        } else {
            insertData = {
                user_id: user.id,
                title: title.trim(),
                pgn: pgn.trim(),
                annotation: annotation.trim() || null,
                game_id: props.gameId,
                start_fen: props.startFen,
                branch_move_index: props.branchIndex,
            };
        }

        if (isStudyMode) {
            insertData.study_id = props.studyId;
            insertData.start_fen = editableStartFen.trim() || STARTING_FEN;
        } else {
            insertData.game_id = props.gameId;
            insertData.start_fen = props.startFen;
            insertData.branch_move_index = props.branchIndex;
        }

        const { data, error } = await supabase
            .from('chess_variations')
            .insert(insertData)
            .select()
            .single();

        setSaving(false);
        if (!error && data) {
            props.onSaved(data as GameVariation);
            props.onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="font-semibold text-zinc-100">
                    {isStudyMode
                        ? 'Add Variation to Study'
                        : `Add Variation at Move ${props.branchIndex}`}
                </h2>

                <input
                    placeholder="Title (e.g. 'Ruy Lopez: Berlin Defense')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />

                {/* Show FEN input only for study mode */}
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
                                setEditableStartFen(
                                    e.target.value || STARTING_FEN,
                                )
                            }
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
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
                        onChange={(e) => setPgn(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                </div>

                <textarea
                    placeholder="Annotation / explanation (optional)"
                    value={annotation}
                    onChange={(e) => setAnnotation(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={props.onClose}
                        className="text-sm px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
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
