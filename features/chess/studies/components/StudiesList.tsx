import StudyCard from '@/features/chess/studies/components/StudyCard';
import { StudiesListProps } from '@/features/chess/studies/types/studies';

export default function StudiesList({ studies, onDelete }: StudiesListProps) {
    return (
        <div className="space-y-3">
            {studies.map((s) => (
                <StudyCard key={s.id} study={s} onDelete={onDelete} />
            ))}
        </div>
    );
}
