// Backward-compatibility re-export — the real implementation is in useImportExport
export { useImportExport as useImportExportFoundation } from './useImportExport';

export function useImportExportLegacy() {
    return {
        formats: ['CSV', 'JSON'],
        duplicateStrategies: ['skip', 'overwrite', 'keep_both', 'merge'],
    };
}
