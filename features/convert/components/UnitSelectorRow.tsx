import { ArrowUpDown } from 'lucide-react';

interface Props {
    units: string[];
    fromUnit: string;
    toUnit: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
    onSwap: () => void;
}

const selectClass =
    'flex-1 h-10 px-2 border rounded-md bg-transparent cursor-pointer hover:border-primary transition-colors outline-none';

function UnitSelect({
    value,
    units,
    onChange,
}: {
    value: string;
    units: string[];
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={selectClass}
        >
            {units.map((u) => (
                <option
                    key={u}
                    value={u}
                    className="bg-background text-foreground"
                >
                    {u}
                </option>
            ))}
        </select>
    );
}

export function UnitSelectorRow({
    units,
    fromUnit,
    toUnit,
    onFromChange,
    onToChange,
    onSwap,
}: Props) {
    return (
        <div className="flex items-center gap-2">
            <UnitSelect
                value={fromUnit}
                units={units}
                onChange={onFromChange}
            />
            <button
                type="button"
                onClick={onSwap}
                className="p-2 hover:bg-accent rounded-full transition-all active:scale-95"
                title="Swap Units"
            >
                <ArrowUpDown size={18} />
            </button>
            <UnitSelect value={toUnit} units={units} onChange={onToChange} />
        </div>
    );
}
