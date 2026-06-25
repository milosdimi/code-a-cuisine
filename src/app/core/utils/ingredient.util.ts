import { RecipeIngredient } from '../models/recipe.model';
import { UserIngredient } from '../models/ingredient.model';

/** Normalizes an ingredient name for fuzzy comparison (case, accents, whitespace). */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Strips common plural suffixes for DE/EN ingredient names. */
function stemIngredientName(name: string): string {
  return name.replace(/(chen|eln|en|n|e|s)$/, '');
}

/** Returns true when two ingredient names likely refer to the same item. */
export function ingredientNamesMatch(a: string, b: string): boolean {
  const left = normalizeIngredientName(a);
  const right = normalizeIngredientName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (stemIngredientName(left) === stemIngredientName(right)) return true;
  return left.includes(right) || right.includes(left);
}

/** Checks whether a recipe ingredient came from the user's Step 1 list. */
export function isUserIngredient(name: string, userIngredients: UserIngredient[]): boolean {
  return userIngredients.some(u => ingredientNamesMatch(u.name, name));
}

/**
 * Splits recipe ingredients into user-provided vs AI-added extras.
 * Prefers the Step 1 ingredient list; falls back to `missingIngredients` names
 * when viewing saved recipes without an active session.
 */
export function splitRecipeIngredients(
  recipeIngredients: RecipeIngredient[],
  userIngredients: UserIngredient[],
  missingIngredientNames: string[] = []
): { your: RecipeIngredient[]; extra: RecipeIngredient[] } {
  if (userIngredients.length > 0) {
    const your: RecipeIngredient[] = [];
    const extra: RecipeIngredient[] = [];
    for (const ing of recipeIngredients) {
      (isUserIngredient(ing.name, userIngredients) ? your : extra).push(ing);
    }
    return { your, extra };
  }

  if (missingIngredientNames.length > 0) {
    const your: RecipeIngredient[] = [];
    const extra: RecipeIngredient[] = [];
    for (const ing of recipeIngredients) {
      const isExtra = missingIngredientNames.some(m => ingredientNamesMatch(m, ing.name));
      (isExtra ? extra : your).push(ing);
    }
    return { your, extra };
  }

  return { your: recipeIngredients, extra: [] };
}