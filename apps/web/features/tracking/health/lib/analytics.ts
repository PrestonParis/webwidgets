export {
    normalizeBodyMap,
    normalizeBiometrics,
    normalizeAllergies,
    normalizeSickness,
    normalizeHealthEntry,
    normalizeHealthEntries,
    normalizeInjuryLogs,
    getRegionLogs,
} from './analyticsNormalize';
export {
    getActiveBodyZones,
    getBiometricSeries,
    buildBodyMapMetadata,
    computeHealthAnalytics,
    getActiveRegionSummaries,
    computeBodyMapAnalytics,
} from './analyticsSelectors';
export type { HealthAnalytics } from './analyticsSelectors';
export {
    getSeverityColor,
    detectRedFlags,
    hasRedFlags,
    buildNewInjuryLog,
    injuryLogToMetadata,
    applyInjuryStatus,
    findInjuryEntryId,
} from './analyticsInjury';
