import { Tracker } from './recovery';

export interface AddictionPickerProps {
    existingTrackers: Tracker[];
    activeCategory: string | null;
    selectedAddiction: string;
    onCategoryChange: (cat: string | null) => void;
    onSelect: (addiction: string) => void;
}
