import { create } from 'zustand';

export interface FolderEntry {
    id: string;
    name: string;
}

interface FolderRegistryState {
    folders: FolderEntry[];
    register: (folders: FolderEntry[]) => void;
}

export const useFolderRegistry = create<FolderRegistryState>((set) => ({
    folders: [],
    register: (folders) => set({ folders }),
}));
