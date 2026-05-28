export type CalcMode =
    | 'basic'
    | 'scientific'
    | 'programmer'
    | 'financial'
    | 'datetime';
export type AngleUnit = 'deg' | 'rad' | 'grad';
export type ProgrammerBase = 2 | 8 | 10 | 16;

export interface HistoryEntry {
    id: string;
    expression: string;
    result: string;
    timestamp: number;
    mode: CalcMode;
    pinned: boolean;
    note?: string;
}

export interface CalcSettings {
    precision: number;
    liveMode: boolean;
    angleUnit: AngleUnit;
    mode: CalcMode;
    programmerBase: ProgrammerBase;
}

export const DEFAULT_SETTINGS: CalcSettings = {
    precision: 10,
    liveMode: false,
    angleUnit: 'deg',
    mode: 'basic',
    programmerBase: 10,
};

export interface FinancialInputs {
    // Compound interest
    principal: string;
    rate: string;
    periods: string;
    compoundFreq: '1' | '4' | '12' | '365';
    // Loan
    loanAmount: string;
    loanRate: string;
    loanTerm: string;
    // Percentage change
    fromValue: string;
    toValue: string;
}

export const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
    principal: '',
    rate: '',
    periods: '',
    compoundFreq: '12',
    loanAmount: '',
    loanRate: '',
    loanTerm: '',
    fromValue: '',
    toValue: '',
};

export interface DateTimeInputs {
    date1: string;
    date2: string;
    addDate: string;
    years: string;
    months: string;
    days: string;
    hours: string;
    minutes: string;
}

export const DEFAULT_DATETIME_INPUTS: DateTimeInputs = {
    date1: '',
    date2: '',
    addDate: '',
    years: '',
    months: '',
    days: '',
    hours: '',
    minutes: '',
};

export interface ProgrammerInputs {
    value: string;
    base: ProgrammerBase;
}

export const DEFAULT_PROGRAMMER_INPUTS: ProgrammerInputs = {
    value: '',
    base: 10,
};

export interface CalcPersistedState {
    history: HistoryEntry[];
    memory: number;
    settings: CalcSettings;
}

// Represents a full calculator state slice used by useCalculator
export interface CalcState {
    expression: string;
    result: string;
    error: string | null;
    isResultShown: boolean;
    memory: number;
    memoryHasValue: boolean;
    settings: CalcSettings;
    history: HistoryEntry[];
    exprStack: string[]; // undo history
    redoStack: string[];
    financialInputs: FinancialInputs;
    dateTimeInputs: DateTimeInputs;
    programmerInputs: ProgrammerInputs;
}
