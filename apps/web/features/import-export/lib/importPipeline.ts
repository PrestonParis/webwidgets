import type {
    ImportJob,
    ImportMapping,
    ValidationResult,
} from '@/features/import-export/types/importExport';

export interface ImportPreview {
    job: ImportJob;
    mappings: ImportMapping[];
    validationResults: ValidationResult[];
    duplicateCount: number;
}

export function validateImportMappings(
    mappings: ImportMapping[],
): ValidationResult[] {
    return mappings.map((mapping, index) => {
        const base = {
            valid:
                mapping.sourceColumn.length > 0 &&
                mapping.targetField.length > 0,
            rowNumber: index + 1,
        };
        return mapping.sourceColumn.length > 0
            ? base
            : { ...base, message: 'Missing source column' };
    });
}

export function createImportPreview(job: ImportJob): ImportPreview {
    return {
        job,
        mappings: job.mappings,
        validationResults: validateImportMappings(job.mappings),
        duplicateCount: 0,
    };
}
