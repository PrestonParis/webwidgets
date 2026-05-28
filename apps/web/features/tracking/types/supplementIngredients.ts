export interface Ingredient {
    name: string;
    amount?: number;
    unit?: string;
    active: boolean;
}

export interface DietaryFlags {
    vegan?: boolean;
    vegetarian?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
    soyFree?: boolean;
    nutFree?: boolean;
    shellfishFree?: boolean;
}
