export type FileConversionFormat =
    | 'doc'
    | 'docx'
    | 'pdf'
    | 'md'
    | 'html'
    | 'txt'
    | 'rtf'
    | 'odt'
    | 'epub'
    | 'csv'
    | 'json'
    | 'xml'
    | 'xlsx'
    | 'xls'
    | 'pptx'
    | 'ppt'
    | 'png'
    | 'jpg'
    | 'webp'
    | 'svg'
    | 'tiff'
    | 'gif'
    | 'zip'
    | 'unknown';

export type FileConversionStatus = 'available' | 'adapter-needed';

export type FileConversionAdapter =
    | 'local-marked'
    | 'local-text'
    | 'pandoc'
    | 'libreoffice'
    | 'mammoth'
    | 'cloudconvert'
    | 'convertapi'
    | 'zamzar'
    | 'cloudmersive'
    | 'pdfco'
    | 'groupdocs'
    | 'aspose'
    | 'adobe-pdf-services'
    | 'nutrient'
    | 'pdfrest';

export type FileConversionFormatMeta = {
    id: FileConversionFormat;
    label: string;
    extension: string;
    mimeType: string;
    accept: string;
};

export type FileConversionCapability = {
    from: FileConversionFormat;
    to: FileConversionFormat;
    label: string;
    status: FileConversionStatus;
    adapters: FileConversionAdapter[];
    notes: string;
};

export type FileConversionRequest = {
    file: File;
    from: FileConversionFormat;
    to: FileConversionFormat;
};

export type TextConversionInput = {
    input: string;
    from: FileConversionFormat;
    to: FileConversionFormat;
};
