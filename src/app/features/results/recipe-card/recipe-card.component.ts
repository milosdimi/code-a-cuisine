import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../../core/models/recipe.model';

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

  get styleLabel(): string { return STYLE_LABELS[this.recipe.cookingStyle] ?? this.recipe.cookingStyle; }
  get timeLabel():  string { return TIME_LABELS[this.recipe.cookingTime]   ?? this.recipe.cookingTime;  }
  get topMissing(): string[] { return this.recipe.missingIngredients.slice(0, 3); }
}
