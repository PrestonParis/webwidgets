import StudyCard from './StudyCard';
import { StudiesListProps } from '@/types/chess';

export default function StudiesList({ studies, onDelete }: StudiesListProps) {
    return (
        <div className="space-y-3">
            {studies.map((s) => (
                <StudyCard key={s.id} study={s} onDelete={onDelete} />
            ))}
        </div>
    );
}
