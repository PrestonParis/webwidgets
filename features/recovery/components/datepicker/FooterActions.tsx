import { FooterActionsProps } from '@/features/recovery/types/recovery';

export function FooterActions({ onCancel, onSave }: FooterActionsProps) {
    return (
        <div className="flex gap-2 px-3 pb-3">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={onSave}>Save start date</button>
        </div>
    );
}
