import { supabase } from '@/lib/db/supabase';
import { ChessStudy, StudyChapter } from '@/features/chess/types/chess';
import {
    StudyVariation,
    Variation,
    VariationInsert,
} from '@/features/chess/types/variation';

export const studyService = {
    async fetchStudy(studyId: string) {
        const result = await supabase
            .from('chess_studies')
            .select('*')
            .eq('id', studyId)
            .single();

        if (result.error) throw result.error;
        return result.data as ChessStudy;
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
        const result = await supabase
            .from('chess_variations')
            .insert(insertData)
            .select()
            .single();

        if (result.error) throw result.error;
        return result.data as Variation;
    },

    // Chapter CRUD
    async fetchChapters(studyId: string) {
        const { data, error } = await supabase
            .from('study_chapters')
            .select('*')
            .eq('study_id', studyId)
            .order('position', { ascending: true });

        if (error) throw error;
        return (data as StudyChapter[]) ?? [];
    },

    async createChapter(
        studyId: string,
        userId: string,
        title: string,
        position: number,
    ) {
        const result = await supabase
            .from('study_chapters')
            .insert({
                study_id: studyId,
                user_id: userId,
                title,
                pgn: '',
                position,
            })
            .select()
            .single();

        if (result.error) throw result.error;
        return result.data as StudyChapter;
    },

    async updateChapterPgn(chapterId: string, pgn: string) {
        const { error } = await supabase
            .from('study_chapters')
            .update({ pgn })
            .eq('id', chapterId);

        if (error) throw error;
    },

    async updateChapterTitle(chapterId: string, title: string) {
        const { error } = await supabase
            .from('study_chapters')
            .update({ title })
            .eq('id', chapterId);

        if (error) throw error;
    },

    async deleteChapter(chapterId: string) {
        const { error } = await supabase
            .from('study_chapters')
            .delete()
            .eq('id', chapterId);

        if (error) throw error;
    },
};
