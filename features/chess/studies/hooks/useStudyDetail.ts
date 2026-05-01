'use client';

import { useEffect, useState } from 'react';
import type { ChessStudy, StudyVariation } from '@/features/chess/types/chess';
import { studyService } from '@/features/chess/studies/api/studyService';

export function useStudyDetail(studyId: string | undefined) {
    const [study, setStudy] = useState<ChessStudy | null>(null);
    const [variations, setVariations] = useState<StudyVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVariation, setActiveVariation] =
        useState<StudyVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!studyId) return;

        Promise.all([
            studyService.fetchStudy(studyId),
            studyService.fetchStudyVariations(studyId),
        ]).then(([studyData, varData]) => {
            setStudy(studyData);
            setVariations(varData);
            setLoading(false);
        });
    }, [studyId]);

    const handleVariationSaved = (v: StudyVariation) => {
        setVariations((prev) => [...prev, v]);
        setShowAddModal(false);
    };

    const handleVariationDelete = async (id: string) => {
        await studyService.deleteStudyVariation(id);
        setVariations((prev) => prev.filter((v) => v.id !== id));
        if (activeVariation?.id === id) setActiveVariation(null);
    };

    return {
        study,
        variations,
        loading,
        activeVariation,
        setActiveVariation,
        showAddModal,
        setShowAddModal,
        handleVariationSaved,
        handleVariationDelete,
    };
}
