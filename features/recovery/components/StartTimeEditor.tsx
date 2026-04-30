import { supabase } from '@/lib/db/supabase';
import DatePicker from './datepicker/DatePicker';

interface StartTimeEditorProps {
    trackerId: string;
    startTime: string;
    onUpdate: (iso: string) => void;
    onCancel: () => void;
}

export default function StartTimeEditor({
    trackerId,
    startTime,
    onUpdate,
    onCancel,
}: StartTimeEditorProps) {
    return (
        <div className="flex justify-center">
            <DatePicker
                value={startTime}
                onChange={async (iso) => {
                    await supabase
                        .from('recovery_profiles')
                        .update({ start_time: iso })
                        .eq('id', trackerId);
                    onUpdate(iso);
                }}
                onCancel={onCancel}
            />
        </div>
    );
}
