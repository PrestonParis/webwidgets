import { NextResponse } from 'next/server';
import {
    convertTextFile,
    FileConversionError,
    getOutputFilename,
    getOutputMimeType,
} from '@/features/files/conversion/conversionService';
import { isFileConversionFormat } from '@/features/files/conversion/conversionRegistry';

const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const fromFormat = String(formData.get('fromFormat') ?? '');
        const toFormat = String(formData.get('toFormat') ?? '');

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: 'Upload a file to convert.' },
                { status: 400 },
            );
        }

        if (
            !isFileConversionFormat(fromFormat) ||
            !isFileConversionFormat(toFormat)
        ) {
            return NextResponse.json(
                { error: 'Choose valid source and target file formats.' },
                { status: 400 },
            );
        }

        if (file.size > MAX_TEXT_FILE_BYTES) {
            return NextResponse.json(
                { error: 'Text conversion is limited to 5 MB files for now.' },
                { status: 413 },
            );
        }

        const converted = await convertTextFile({
            input: await file.text(),
            from: fromFormat,
            to: toFormat,
        });

        const filename = getOutputFilename(file.name, toFormat);

        return new Response(converted, {
            status: 200,
            headers: {
                'Content-Type': getOutputMimeType(toFormat),
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        if (error instanceof FileConversionError) {
            return NextResponse.json({ error: error.message }, { status: 422 });
        }

        return NextResponse.json(
            { error: 'File conversion failed.' },
            { status: 500 },
        );
    }
}
