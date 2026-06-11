export type ConversionKind = 'document' | 'image';

export type ConversionJobStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type ConversionExtension =
    | 'doc'
    | 'docx'
    | 'rtf'
    | 'ppt'
    | 'pptx'
    | 'xls'
    | 'xlsx'
    | 'ods'
    | 'odp'
    | 'odt'
    | 'html'
    | 'htm'
    | 'md'
    | 'markdown'
    | 'txt'
    | 'pdf'
    | 'csv'
    | 'tsv'
    | 'json'
    | 'rst'
    | 'epub'
    | 'png'
    | 'jpg'
    | 'jpeg'
    | 'webp'
    | 'gif'
    | 'tiff'
    | 'bmp'
    | 'svg';

export interface SupportedConversion {
    kind: ConversionKind;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    label: string;
    worker: 'worker-docs' | 'worker-images';
    workerFamily?: 'documents' | 'images';
    engine?:
        | 'libreoffice'
        | 'libreoffice-pdf'
        | 'pandoc'
        | 'native'
        | 'native-data'
        | 'pdftotext'
        | 'pdftohtml'
        | 'pdftoepub'
        | 'pdftoppm-png'
        | 'pdftoppm-jpg';
    lossy?: boolean;
    notes?: string;
    warnings?: string[];
}

export interface CreateConversionJobRequest {
    originalFileName: string;
    sourceMime: string;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    fileSizeBytes: number;
    userId?: string;
}

export interface CreateConversionJobResponse {
    jobId: string;
    inputObjectKey: string;
    uploadUrl?: string;
    uploadMethod: 'PUT' | 'POST';
    statusUrl: string;
}

export interface ConversionJob {
    id: string;
    status: ConversionJobStatus;
    kind: ConversionKind;
    originalFileName: string;
    sourceMime: string;
    sourceExtension: ConversionExtension;
    targetExtension: ConversionExtension;
    fileSizeBytes: number;
    userId?: string;
    inputObjectKey: string;
    outputObjectKey?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DownloadUrlResponse {
    downloadUrl: string;
}
