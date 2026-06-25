import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Recipe, RecipeIngredient } from '../../../core/models/recipe.model';
import { UserIngredient } from '../../../core/models/ingredient.model';
import { splitRecipeIngredients } from '../../../core/utils/ingredient.util';

const STYLE_LABELS: Record<string, string> = {
  german:   'Deutsche Küche',
  italian:  'Italienische Küche',
  japanese: 'Japanische Küche',
  indian:   'Indische Küche',
  gourmet:  'Gourmet',
  fusion:   'Fusion'
};

const TIME_LABELS: Record<string, string> = {
  quick:     'Schnell',
  medium:    'Mittel',
  elaborate: 'Aufwendig'
};

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss'
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Input() userIngredients: UserIngredient[] = [];

  /** Display label for the recipe's cooking style (e.g. "Italienische Küche"). */
  get styleLabel(): string { return STYLE_LABELS[this.recipe.cookingStyle] ?? this.recipe.cookingStyle; }
  /** Display label for the cooking time category (e.g. "Schnell"). */
  get timeLabel():  string { return TIME_LABELS[this.recipe.cookingTime]   ?? this.recipe.cookingTime;  }
  /** Up to 5 user-provided ingredients used in this recipe. */
  get topYourIngredients(): RecipeIngredient[] {
    return splitRecipeIngredients(
      this.recipe.ingredients,
      this.userIngredients,
      this.recipe.missingIngredients
    ).your.slice(0, 5);
  }
  /** Up to 3 extra ingredients (AI-added) shown on the card as hints. */
  get topExtraIngredients(): RecipeIngredient[] {
    return splitRecipeIngredients(
      this.recipe.ingredients,
      this.userIngredients,
      this.recipe.missingIngredients
    ).extra.slice(0, 3);
  }
}
