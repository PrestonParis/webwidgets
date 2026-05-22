'use client';

import { useState } from 'react';
import CategorySelector from '@/features/convert/components/CategorySelector';
import UnitConverter from '@/features/convert/components/UnitConverter';
import { ArrowLeftRight } from 'lucide-react';
import ConverterWidget from '@/features/convert/components/ConverterWidget';
import { cn } from '@/lib/utils/utils';

type ConverterSection = 'general-units' | 'file-types';

export default function UnitConvertPage() {
    const [category, setCategory] = useState('Length');
    const [section, setSection] = useState<ConverterSection>('general-units');

    return (
        <div className="min-h-screen p-10 bg-background">
            <div className="text-center mb-8">
                <ArrowLeftRight className="mx-auto mb-2" />
                <h1 className="text-3xl font-bold">Converter</h1>
            </div>

            <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
                <SectionButton
                    active={section === 'general-units'}
                    onClick={() => setSection('general-units')}
                >
                    General Units
                </SectionButton>
                <SectionButton
                    active={section === 'file-types'}
                    onClick={() => setSection('file-types')}
                >
                    File Conversion
                </SectionButton>
            </div>

            <div className="mt-8">
                {section === 'general-units' ? (
                    <div className="space-y-8">
                        <CategorySelector
                            selected={category}
                            onSelect={setCategory}
                        />
                        <UnitConverter category={category} />
                    </div>
                ) : (
                    <div className="mx-auto max-w-2xl">
                        <ConverterWidget fullPage />
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionButton({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors',
                active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}
