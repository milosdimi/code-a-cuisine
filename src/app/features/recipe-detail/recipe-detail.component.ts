import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { RecipeService } from '../../core/services/recipe.service';
import { Recipe, RecipeIngredient, HelperTask } from '../../core/models/recipe.model';

const STYLE_LABELS: Record<string, string> = {
  german:   'Deutsche Küche',  italian:  'Italienische Küche',
  japanese: 'Japanische Küche', indian:   'Indische Küche',
  gourmet:  'Gourmet',          fusion:   'Fusion'
};
const TIME_LABELS: Record<string, string> = {
  quick: 'Schnell (< 20 Min)', medium: 'Mittel (20–45 Min)', elaborate: 'Aufwendig (45+ Min)'
};

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = true;
  error = '';
  activeHelper = 0;
  servingsMultiplier = 1;
  baseServings = 1;

  constructor(
    private route: ActivatedRoute,
    private firebase: FirebaseService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    // Try in-memory first (faster), fall back to Firestore
    this.recipeService.generatedRecipes$.subscribe(recipes => {
      const found = recipes.find(r => r.id === id);
      if (found) {
        this.setRecipe(found);
      } else {
        this.loadFromFirestore(id);
      }
    });
  }

  private loadFromFirestore(id: string): void {
    this.firebase.getRecipeById(id).subscribe({
      next: recipe => {
        if (recipe) {
          this.setRecipe(recipe);
        } else {
          this.error = 'Rezept nicht gefunden.';
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = 'Rezept konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  private setRecipe(recipe: Recipe): void {
    this.recipe = recipe;
    this.baseServings = recipe.servings;
    this.isLoading = false;
  }

  /** Returns ingredients scaled to the current portion multiplier. */
  get scaledIngredients(): RecipeIngredient[] {
    if (!this.recipe) return [];
    return this.recipe.ingredients.map(ing => ({
      ...ing,
      amount: Math.round(ing.amount * this.servingsMultiplier * 10) / 10
    }));
  }

  /** Current portion count after scaling. */
  get currentServings(): number {
    return Math.round(this.baseServings * this.servingsMultiplier);
  }

  increaseServings(): void {
    this.servingsMultiplier = Math.round((this.servingsMultiplier + 0.5) * 10) / 10;
  }

  decreaseServings(): void {
    if (this.servingsMultiplier > 0.5) {
      this.servingsMultiplier = Math.round((this.servingsMultiplier - 0.5) * 10) / 10;
    }
  }

  /** Helper tasks for the active tab. */
  get activeHelperTasks(): HelperTask[] {
    return this.recipe?.helpers?.[this.activeHelper] ?? [];
  }

  get helperTabs(): number[] {
    return Array.from({ length: this.recipe?.helpers?.length ?? 0 }, (_, i) => i);
  }

  get styleLabel(): string { return STYLE_LABELS[this.recipe?.cookingStyle ?? ''] ?? ''; }
  get timeLabel():  string { return TIME_LABELS[this.recipe?.cookingTime ?? '']   ?? ''; }

  get totalCalories(): number {
    if (!this.recipe) return 0;
    return Math.round(this.recipe.nutrition.caloriesPerPortion * this.currentServings);
  }
}
