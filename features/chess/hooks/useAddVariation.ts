import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import {
    AddVariationModalProps,
    GameVariation,
    StudyVariation,
    VariationInsert,
} from '@/features/chess/types/chess';
import { STARTING_FEN } from '@/features/chess/constants';
import { studyService } from '@/features/chess/studies/api/studyService';

export function useAddVariation(props: AddVariationModalProps) {
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

        const base = {
            user_id: user.id,
            title: title.trim(),
            pgn: pgn.trim(),
            annotation: annotation.trim() || null,
        };

        const insertData: VariationInsert = isStudyMode
            ? {
                  ...base,
                  study_id: props.studyId,
                  start_fen: editableStartFen.trim() || STARTING_FEN,
              }
            : {
                  ...base,
                  game_id: props.gameId,
                  start_fen: props.startFen,
                  branch_move_index: props.branchIndex,
              };

        try {
            const data = await studyService.saveVariation(insertData);
            if (isStudyMode) props.onSaved(data as StudyVariation);
            else props.onSaved(data as GameVariation);
            props.onClose();
        } finally {
            setSaving(false);
        }
    };

    return {
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
    };
}
