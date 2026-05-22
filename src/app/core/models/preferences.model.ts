import { CookingStyle, CookingTime, DietType } from './recipe.model';
import { UserIngredient } from './ingredient.model';

export interface UserPreferences {
  ingredients: UserIngredient[];
  servings: number;
  cookingTime: CookingTime;
  cookingStyle: CookingStyle;
  diet: DietType;
  helpers: number;
}
