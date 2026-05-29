import { useState, useMemo } from 'react';
import { getUnits } from '@/features/convert/types/unitconvert';
import { convert, formatResult } from './useConvert';
import { useCurrency } from '@/features/currency/hooks/useCurrency';

export function useConverterWidget() {
    const [category, setCategory] = useState('Length');
    const [fromUnit, setFromUnit] = useState(() => getUnits('Length')[0] ?? '');
    const [toUnit, setToUnit] = useState(() => getUnits('Length')[1] ?? '');
    const [fromValue, setFromValue] = useState('1');
    const [toValue, setToValue] = useState('');
    const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from');

    const isCurrency = category === 'Currency';

    const units = useMemo(() => getUnits(category), [category]);
    const validFrom = units.includes(fromUnit) ? fromUnit : (units[0] ?? '');
    const validTo = units.includes(toUnit)
        ? toUnit
        : (units[1] ?? units[0] ?? '');

    // Always called unconditionally — null base means skip fetch
    const { rates, loading: ratesLoading } = useCurrency(
        isCurrency ? validFrom : null,
    );

    // For currency: direct exchange rate from live data
    const currencyRate = useMemo(() => {
        if (!isCurrency || !rates) return null;
        return rates.rates[validTo] ?? null;
    }, [isCurrency, rates, validTo]);

    const derivedTo = useMemo(() => {
        if (isCurrency) {
            if (currencyRate === null) return '';
            const n = parseFloat(fromValue);
            return isNaN(n) ? '' : formatResult(n * currencyRate);
        }
        return formatResult(convert(category, fromValue, validFrom, validTo));
    }, [isCurrency, currencyRate, fromValue, category, validFrom, validTo]);

    const derivedFrom = useMemo(() => {
        if (isCurrency) {
            if (currencyRate === null) return '';
            const n = parseFloat(toValue);
            return isNaN(n) ? '' : formatResult(n / currencyRate);
        }
        return formatResult(convert(category, toValue, validTo, validFrom));
    }, [isCurrency, currencyRate, toValue, category, validTo, validFrom]);

    const conversionRate = useMemo(() => {
        if (isCurrency) {
            return currencyRate !== null ? formatResult(currencyRate) : '';
        }
        return formatResult(convert(category, '1', validFrom, validTo));
    }, [isCurrency, currencyRate, category, validFrom, validTo]);

    const rateDate = isCurrency ? (rates?.date ?? null) : null;

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
        ratesLoading,
        rateDate,
        handleFromChange,
        handleToChange,
        handleCategoryChange,
        handleSwap,
        setFromUnit,
        setToUnit,
    };
}
