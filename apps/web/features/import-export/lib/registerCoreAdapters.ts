import { registerAdapter } from '@/features/import-export/lib/adapterRegistry';
import { activityAdapter } from '@/features/import-export/adapters/activityAdapter';
import { calendarEventsAdapter } from '@/features/import-export/adapters/calendarEventsAdapter';
import { collaborationHandoffsAdapter } from '@/features/import-export/adapters/collaborationHandoffsAdapter';
import { contextEntriesAdapter } from '@/features/import-export/adapters/contextEntriesAdapter';
import { countdownAdapter } from '@/features/import-export/adapters/countdownAdapter';
import { documentsAdapter } from '@/features/import-export/adapters/documentsAdapter';
import { filesAdapter } from '@/features/import-export/adapters/filesAdapter';
import { financeAdapter } from '@/features/import-export/adapters/financeAdapter';
import { habitAdapter } from '@/features/import-export/adapters/habitAdapter';
import { journalAdapter } from '@/features/import-export/adapters/journalAdapter';
import { memoryDecksAdapter } from '@/features/import-export/adapters/memoryDecksAdapter';
import { moodAdapter } from '@/features/import-export/adapters/moodAdapter';
import { recoveryAdapter } from '@/features/import-export/adapters/recoveryAdapter';
import { todosAdapter } from '@/features/import-export/adapters/todosAdapter';
import { trackingEntriesAdapter } from '@/features/import-export/adapters/trackingEntriesAdapter';

export function registerCoreImportExportAdapters(): void {
    [
        trackingEntriesAdapter,
        todosAdapter,
        collaborationHandoffsAdapter,
        contextEntriesAdapter,
        activityAdapter,
        filesAdapter,
        documentsAdapter,
        calendarEventsAdapter,
        journalAdapter,
        moodAdapter,
        habitAdapter,
        recoveryAdapter,
        financeAdapter,
        countdownAdapter,
        memoryDecksAdapter,
    ].forEach(registerAdapter);
}
