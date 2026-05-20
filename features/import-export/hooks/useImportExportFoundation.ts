export function useImportExportFoundation() {
    return {
        formats: ['CSV', 'Excel', 'Google Sheets placeholder', 'JSON export'],
        duplicateStrategies: ['skip', 'replace', 'merge', 'create_new'],
    };
}
