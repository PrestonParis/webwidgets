import { supabase } from '@/lib/db/supabase';
import DatePicker from '@/features/ui/datepicker/DatePicker';

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
                onChange={(iso) => {
                    void (async () => {
                        await supabase
                            .from('recovery_profiles')
                            .update({ start_time: iso })
                            .eq('id', trackerId);
                        onUpdate(iso);
                    })();
                }}
                onCancel={onCancel}
            />
        </div>
    );
}
