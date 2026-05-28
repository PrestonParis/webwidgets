import type { FileConversionAdapter } from '@/features/files/conversion/types';

export const fileConversionProviders: Record<
    FileConversionAdapter,
    {
        label: string;
        notes: string;
        url?: string;
        billing: 'local' | 'free-tier' | 'paid-production';
    }
> = {
    'local-marked': {
        label: 'Local Markdown',
        notes: 'Built-in Markdown and sanitization path.',
        billing: 'local',
    },
    'local-text': {
        label: 'Local Text',
        notes: 'Built-in plain text and conservative HTML transforms.',
        billing: 'local',
    },
    pandoc: {
        label: 'Pandoc',
        notes: 'Local universal document converter adapter candidate.',
        url: 'https://pandoc.org/',
        billing: 'local',
    },
    libreoffice: {
        label: 'LibreOffice',
        notes: 'Local office document conversion adapter candidate.',
        url: 'https://www.libreoffice.org/',
        billing: 'local',
    },
    mammoth: {
        label: 'Mammoth',
        notes: 'Local DOCX to HTML/Markdown adapter candidate.',
        url: 'https://github.com/mwilliamson/mammoth.js',
        billing: 'local',
    },
    cloudconvert: {
        label: 'CloudConvert',
        notes: 'Hosted conversion API for documents, media, archives, and images.',
        url: 'https://cloudconvert.com/apis/file-conversion',
        billing: 'paid-production',
    },
    convertapi: {
        label: 'ConvertAPI',
        notes: 'Hosted conversion API with broad document and PDF routes.',
        url: 'https://www.convertapi.com/',
        billing: 'paid-production',
    },
    zamzar: {
        label: 'Zamzar',
        notes: 'Hosted conversion API with broad format coverage.',
        url: 'https://developers.zamzar.com/docs',
        billing: 'paid-production',
    },
    cloudmersive: {
        label: 'Cloudmersive',
        notes: 'Hosted document, PDF, image, and data conversion APIs.',
        url: 'https://api.cloudmersive.com/docs/convert.asp',
        billing: 'paid-production',
    },
    pdfco: {
        label: 'PDF.co',
        notes: 'Hosted PDF extraction, generation, and conversion APIs.',
        url: 'https://pdf.co/',
        billing: 'paid-production',
    },
    groupdocs: {
        label: 'GroupDocs Conversion Cloud',
        notes: 'Hosted conversion API for Office, PDF, OpenDocument, images, and more.',
        url: 'https://docs.groupdocs.cloud/conversion/overview/',
        billing: 'paid-production',
    },
    aspose: {
        label: 'Aspose',
        notes: 'Hosted and SDK-based document, HTML, PDF, and image conversion APIs.',
        url: 'https://www.aspose.com/',
        billing: 'paid-production',
    },
    'adobe-pdf-services': {
        label: 'Adobe PDF Services',
        notes: 'Hosted PDF creation, export, and extraction APIs.',
        url: 'https://developer.adobe.com/document-services/',
        billing: 'paid-production',
    },
    nutrient: {
        label: 'Nutrient',
        notes: 'Hosted document converter API for Office and PDF workflows.',
        url: 'https://www.nutrient.io/api/converter-api/',
        billing: 'paid-production',
    },
    pdfrest: {
        label: 'pdfRest',
        notes: 'Hosted PDF-focused conversion and document processing APIs.',
        url: 'https://pdfrest.com/',
        billing: 'paid-production',
    },
};

export const availableTextAdapters: FileConversionAdapter[] = [
    'local-marked',
    'local-text',
];

export const hostedUniversalAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'groupdocs',
    'aspose',
];

export const officeAdapters: FileConversionAdapter[] = [
    'libreoffice',
    'pandoc',
    ...hostedUniversalAdapters,
    'cloudmersive',
    'nutrient',
];

export const pdfAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'cloudmersive',
    'pdfco',
    'groupdocs',
    'aspose',
    'adobe-pdf-services',
    'nutrient',
    'pdfrest',
];

export const imageAdapters: FileConversionAdapter[] = [
    'cloudconvert',
    'convertapi',
    'zamzar',
    'cloudmersive',
    'groupdocs',
    'aspose',
];
