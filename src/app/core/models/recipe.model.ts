export type CookingStyle = 'german' | 'italian' | 'japanese' | 'indian' | 'gourmet' | 'fusion';
export type CookingTime  = 'quick' | 'medium' | 'elaborate';
export type DietType     = 'none' | 'vegetarian' | 'vegan' | 'keto';
export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'Stück' | 'TL' | 'EL';

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: IngredientUnit;
}

export interface CookingStep {
  stepNumber: number;
  description: string;
  durationMinutes?: number;
  isParallel: boolean;
  parallelWith?: number[];
}

export interface NutritionInfo {
  caloriesPerPortion: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface HelperTask {
  helperIndex: number;
  stepNumber: number;
  description: string;
}

export interface Recipe {
  id?: string;
  title: string;
  cookingStyle: CookingStyle;
  cookingTime: CookingTime;
  servings: number;
  ingredients: RecipeIngredient[];
  missingIngredients: string[];
  steps: CookingStep[];
  nutrition: NutritionInfo;
  helpers: HelperTask[][];
  createdAt: Date;
  ipAddress?: string;
}
