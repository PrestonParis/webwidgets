'use client';

import { FileCog } from 'lucide-react';
import ConverterWidget from '@/features/convert/components/ConverterWidget';

export function ConverterPageClient() {
    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto mb-8 max-w-3xl text-center">
                <FileCog className="mx-auto mb-3 h-7 w-7 text-amber-500" />
                <h1 className="text-3xl font-bold">File Converter</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Lightweight text conversions stay local. Office, PDF, and
                    image routes are sent to the conversion service when
                    supported.
                </p>
            </div>
            <ConverterWidget fullPage />
        </main>
    );
}
