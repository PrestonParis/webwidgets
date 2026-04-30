import { useState, useMemo } from 'react';
import { getUnits } from '@/types/unitconvert';
import { convert, formatResult } from './useConvert';

export function useConverterWidget() {
    const [category, setCategory] = useState('Length');
    const [fromUnit, setFromUnit] = useState(() => getUnits('Length')[0]);
    const [toUnit, setToUnit] = useState(() => getUnits('Length')[1]);
    const [fromValue, setFromValue] = useState('1');
    const [toValue, setToValue] = useState('');
    const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from');

    const units = useMemo(() => getUnits(category), [category]);
    const validFrom = units.includes(fromUnit) ? fromUnit : (units[0] ?? '');
    const validTo = units.includes(toUnit)
        ? toUnit
        : (units[1] ?? units[0] ?? '');

    const derivedTo = useMemo(
        () => formatResult(convert(category, fromValue, validFrom, validTo)),
        [category, fromValue, validFrom, validTo],
    );
    const derivedFrom = useMemo(
        () => formatResult(convert(category, toValue, validTo, validFrom)),
        [category, toValue, validTo, validFrom],
    );

    const conversionRate = useMemo(
        () => formatResult(convert(category, '1', validFrom, validTo)),
        [category, validFrom, validTo],
    );

    const displayFrom = lastEdited === 'from' ? fromValue : derivedFrom || '';
    const displayTo = lastEdited === 'to' ? toValue : derivedTo || '';

    const handleFromChange = (v: string) => {
        setLastEdited('from');
        setFromValue(v);
    };
    const handleToChange = (v: string) => {
        setLastEdited('to');
        setToValue(v);
    };

    const handleCategoryChange = (cat: string) => {
        const newUnits = getUnits(cat);
        setCategory(cat);
        setFromUnit(newUnits[0] ?? '');
        setToUnit(newUnits[1] ?? newUnits[0] ?? '');
        setFromValue('1');
        setToValue('');
        setLastEdited('from');
    };

    const handleSwap = () => {
        setFromUnit(validTo);
        setToUnit(validFrom);
        setFromValue(displayTo);
        setToValue('');
        setLastEdited('from');
    };

    return {
        category,
        units,
        validFrom,
        validTo,
        displayFrom,
        displayTo,
        conversionRate,
        handleFromChange,
        handleToChange,
        handleCategoryChange,
        handleSwap,
        setFromUnit,
        setToUnit,
    };
}
