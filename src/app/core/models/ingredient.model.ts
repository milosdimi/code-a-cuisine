import { IngredientUnit } from './recipe.model';

export interface UserIngredient {
  name: string;
  amount: number;
  unit: IngredientUnit;
}
