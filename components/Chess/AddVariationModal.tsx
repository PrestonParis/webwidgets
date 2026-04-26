import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChessVariation } from '@/types/chess';

export function AddVariationModal({
    gameId,
    branchIndex,
    startFen,
    onClose,
    onSaved,
}: {
    gameId: string;
    branchIndex: number;
    startFen: string;
    onClose: () => void;
    onSaved: (v: ChessVariation) => void;
}) {
    const [title, setTitle] = useState('');
    const [pgn, setPgn] = useState('');
    const [annotation, setAnnotation] = useState('');
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

        const { data, error } = await supabase
            .from('chess_variations')
            .insert({
                user_id: user.id,
                game_id: gameId,
                title: title.trim(),
                pgn: pgn.trim(),
                start_fen: startFen,
                branch_move_index: branchIndex,
                annotation: annotation.trim() || null,
            })
            .select()
            .single();

        setSaving(false);
        if (!error && data) {
            onSaved(data as ChessVariation);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-4">
                <h2 className="font-semibold text-zinc-100">
                    Add Variation at Move {branchIndex}
                </h2>
                <input
                    placeholder="Title (e.g. 'Aggressive Knight Sacrifice')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                    placeholder="PGN moves (e.g. Nf6 d4 e5 ...)"
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
                />
                <textarea
                    placeholder="Annotation / explanation (optional)"
                    value={annotation}
                    onChange={(e) => setAnnotation(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
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
