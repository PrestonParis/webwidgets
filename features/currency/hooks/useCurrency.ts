'use client';

import { useEffect, useReducer } from 'react';
import { CurrencyRates } from '@/types/currency';

type State = {
    rates: CurrencyRates | null;
    loading: boolean;
    error: boolean;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: CurrencyRates }
    | { type: 'FETCH_ERROR' };

const initialState: State = {
    rates: null,
    loading: true,
    error: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: false };
        case 'FETCH_SUCCESS':
            return { rates: action.payload, loading: false, error: false };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: true };
        default:
            return state;
    }
}

export function useCurrency(base: string = 'USD') {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        let isMounted = true;

        const fetchRates = async () => {
            dispatch({ type: 'FETCH_START' });

            // Check cache...
            // Fetch data...

            if (isMounted) {
                // dispatch FETCH_SUCCESS or FETCH_ERROR
            }
        };

        fetchRates();

        return () => {
            isMounted = false;
        };
    }, [base]);

    return state;
}
