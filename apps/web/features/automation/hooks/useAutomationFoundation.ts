import { AUTOMATION_WIDGETS } from '@/features/automation/lib/automationRegistry';

export function useAutomationFoundation() {
    return { widgets: AUTOMATION_WIDGETS };
}
