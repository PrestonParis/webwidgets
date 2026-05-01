import { supabase } from '@/lib/db/supabase';
import {
    ChessStudy,
    StudyVariation,
    Variation,
    VariationInsert,
} from '@/features/chess/types/chess';

export const studyService = {
    async fetchStudy(studyId: string) {
        const { data, error } = await supabase
            .from('chess_studies')
            .select('*')
            .eq('id', studyId)
            .single();

        if (error) throw error;
        return data as ChessStudy;
    },

    async fetchStudyVariations(studyId: string) {
        const { data, error } = await supabase
            .from('chess_variations')
            .select('*')
            .eq('study_id', studyId)
            .order('created_at');

        if (error) throw error;
        return (data as StudyVariation[]) ?? [];
    },

    async deleteStudyVariation(id: string) {
        const { error } = await supabase
            .from('chess_variations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async saveVariation(insertData: VariationInsert) {
        const { data, error } = await supabase
            .from('chess_variations')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return data as Variation;
    },
};
