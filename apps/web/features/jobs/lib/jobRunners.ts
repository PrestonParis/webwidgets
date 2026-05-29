// Register all job runners here.
// Import order controls registration order — first matching runner wins.
// NOTE: BullMQ is used only in the conversion service.
// All runners here execute synchronously for Stage 1.

import '@/features/jobs/lib/documentParsingRunner';
import '@/features/jobs/lib/cheatsheetGenerationRunner';
