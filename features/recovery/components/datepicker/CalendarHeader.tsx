export function CalendarHeader({
    label,
    onPrev,
    onNext,
}: {
    label: string;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={onPrev}>‹</button>
            <span className="text-sm font-bold">{label}</span>
            <button onClick={onNext}>›</button>
        </div>
    );
}
