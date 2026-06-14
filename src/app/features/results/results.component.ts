import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { RecipeService } from '../../core/services/recipe.service';
import { Recipe, CookingTime, CookingStyle } from '../../core/models/recipe.model';
import { UserPreferences } from '../../core/models/preferences.model';

const TIME_LABELS: Record<CookingTime, string> = {
  quick:     'Quick',
  medium:    'Medium',
  elaborate: 'Complex'
};

const STYLE_LABELS: Record<CookingStyle, string> = {
  german:   'German',
  italian:  'Italian',
  japanese: 'Japanese',
  indian:   'Indian',
  gourmet:  'Gourmet',
  fusion:   'Fusion'
};

const TIME_MINUTES: Record<CookingTime, string> = {
  quick:     'up to 20min',
  medium:    '25-40min',
  elaborate: '45+ min'
};

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'mock-1',
    title: 'Spaghetti Carbonara',
    cookingStyle: 'italian', cookingTime: 'quick', servings: 2,
    ingredients: [], missingIngredients: [], steps: [],
    nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    helpers: [], createdAt: new Date()
  },
  {
    id: 'mock-2',
    title: 'Classic Potato Soup',
    cookingStyle: 'german', cookingTime: 'medium', servings: 2,
    ingredients: [], missingIngredients: [], steps: [],
    nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    helpers: [], createdAt: new Date()
  },
  {
    id: 'mock-3',
    title: 'Vegetable Miso Ramen',
    cookingStyle: 'japanese', cookingTime: 'elaborate', servings: 2,
    ingredients: [], missingIngredients: [], steps: [],
    nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    helpers: [], createdAt: new Date()
  }
];

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent implements OnInit {
  recipes: Recipe[] = [];
  preferences: UserPreferences | null = null;

  get displayRecipes(): Recipe[] {
    return this.recipes.length > 0 ? this.recipes : MOCK_RECIPES;
  }

  get timeTag(): string {
    return this.preferences ? (TIME_LABELS[this.preferences.cookingTime] ?? this.preferences.cookingTime) : '';
  }

  get styleTag(): string {
    return this.preferences ? (STYLE_LABELS[this.preferences.cookingStyle] ?? this.preferences.cookingStyle) : '';
  }

  cookingTimeLabel(t: CookingTime): string {
    return TIME_MINUTES[t] ?? t;
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Synchronous guard: redirect immediately if no recipes (direct URL access)
    if (this.recipeService.currentRecipes.length === 0) {
      this.router.navigate(['/generate']);
      return;
    }

    // Live subscription for display only — no redirect logic here
    this.recipeService.generatedRecipes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(recipes => {
        this.recipes = recipes;
        this.recipeService.loadSavedStatus(recipes.map(r => r.id!).filter(Boolean));
      });

    this.recipeService.preferences$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(prefs => { this.preferences = prefs; });
  }

  saveToBook(recipe: Recipe): void {
    if (this.recipeService.isSaved(recipe.id)) return;
    this.recipeService.saveRecipeToBook(recipe).subscribe({ error: () => {} });
  }

  isSaved(recipe: Recipe): boolean {
    return this.recipeService.isSaved(recipe.id);
  }

  /** Resets state and sends user back to the ingredient step. */
  startNewSearch(): void {
    this.recipeService.resetState();
    this.router.navigate(['/generate']);
  }
}
