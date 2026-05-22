import { DEVELOPER_TOOLS } from '@/features/developer/lib/developerToolRegistry';

export function useDeveloperTools() {
    return { tools: DEVELOPER_TOOLS };
}
