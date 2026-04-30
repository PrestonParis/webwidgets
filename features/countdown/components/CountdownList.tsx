import CountdownItem from './CountdownItem';
import { CountdownListProps } from '@/types/countdown';

export default function CountdownList({
    countdowns,
    onDelete,
}: CountdownListProps) {
    if (countdowns.length === 0) return null;

    return (
        <ul className="space-y-1.5 mb-3">
            {countdowns.map((c) => (
                <CountdownItem key={c.id} countdown={c} onDelete={onDelete} />
            ))}
        </ul>
    );
}
