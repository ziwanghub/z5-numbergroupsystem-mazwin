export interface RecipeStep {
    id: string;             // Unique ID for this step instance (UUID)
    moduleKey: string;      // logical key (e.g. "digits-group")
    params: Record<string, any>; // Config for this module
    isDisabled?: boolean;   // Allow toggling steps without deleting
}

export interface UserRecipe {
    id: string;             // UUID
    name: string;           // Display Name (e.g. "สูตรหวยเทพ")
    description?: string;   // Optional notes
    version: number;        // Schema version (e.g. 1)
    steps: RecipeStep[];    // The logic chain
    createdAt: number;      // Timestamp
    updatedAt: number;      // Last modified timestamp
    author?: string;        // For social sharing later
    tags?: string[];        // Organization tags
}
