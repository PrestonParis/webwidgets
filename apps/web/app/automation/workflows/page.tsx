import { WorkflowActionPage } from '@/features/automation/components/WorkflowActionPage';
import { AuthGuard } from '@/features/inbox/components/AuthGuard';
export default function Page() {
    return (
        <AuthGuard>
            <WorkflowActionPage />
        </AuthGuard>
    );
}
