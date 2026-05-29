export interface ViewFile {
    id: string;
    userId: string;
    name: string;
    extension: string;
    mimeType: string;
    sizeBytes: number;
    s3Key: string;
    folderId: string | null;
    sourceType: 'upload' | 'import' | 'converted' | 'generated';
    sourceLabel: string;
    uploadedAt: string;
    updatedAt: string;
    lastOpenedAt: string | null;
    previewStatus: 'none' | 'pending' | 'ready' | 'failed';
    tags: string[];
    notes: string | null;
    favorite: boolean;
    archived: boolean;
    deletedAt: string | null;
}

export interface ViewFolder {
    id: string;
    userId: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export type ViewLayout = 'grid' | 'list';
export type ViewSortField =
    | 'name'
    | 'type'
    | 'size'
    | 'uploadedAt'
    | 'updatedAt';
export type ViewSortDir = 'asc' | 'desc';

export interface ViewFilterState {
    search: string;
    mimeCategory: string | null;
    folderId: string | null;
    showArchived: boolean;
    showFavorites: boolean;
    sourceType: ViewFile['sourceType'] | null;
}
