import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { RecipeService } from '../../core/services/recipe.service';
import { SeoService } from '../../core/services/seo.service';
import { Recipe, RecipeIngredient, CookingStep } from '../../core/models/recipe.model';

const STYLE_LABELS: Record<string, string> = {
  german: 'German',   italian: 'Italian',  japanese: 'Japanese',
  indian: 'Indian',   gourmet: 'Gourmet',  fusion:   'Fusion'
};

const TIME_LABELS: Record<string, string> = {
  quick: 'Quick', medium: 'Medium', elaborate: 'Complex'
};

const TIME_MINUTES: Record<string, string> = {
  quick: 'up to 20min', medium: '25-40min', elaborate: '45+ min'
};

const CHEF_COLORS  = ['#D7DFD7', '#FFD9B3', '#B3D9FF'];
const CHEF_ICONS   = [
  'assets/images/icons/cook-01.png',
  'assets/images/icons/cook-02.png',
  'assets/images/icons/cook-03.png'
];

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, LoadingSpinnerComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = true;
  error = '';
  heartCount = 0;
  isLiked = false;
  showIngredients = true;
  showDirections = true;

  readonly chefColors = CHEF_COLORS;
  readonly chefIcons  = CHEF_ICONS;

  private servingsMultiplier = 1;
  private baseServings = 1;
  private prefsHelpers = 1;
  private readonly LIKED_KEY = 'cac_liked_recipes';

  private seo = inject(SeoService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebase: FirebaseService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    // Read helpers count from preferences (fallback when recipe.helpers is empty)
    this.recipeService.preferences$.subscribe(prefs => {
      if (prefs) this.prefsHelpers = prefs.helpers;
    });

    // Try in-memory first, then mock fallback, then Firestore
    this.recipeService.generatedRecipes$.subscribe(recipes => {
      const found = recipes.find(r => r.id === id)
                 ?? this.recipeService.getMockRecipeById(id);
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
          this.error = 'Recipe not found.';
          this.isLoading = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Recipe could not be loaded.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setRecipe(recipe: Recipe): void {
    recipe.steps?.sort((a, b) => a.stepNumber - b.stepNumber);
    this.recipe       = recipe;
    this.baseServings = recipe.servings;
    this.heartCount   = recipe.heartCount ?? 0;
    if (recipe.id) this.loadLikedState(recipe.id);
    this.isLoading    = false;
    this.seo.setPage({ title: recipe.title });
  }

  private loadLikedState(recipeId: string): void {
    try {
      const liked: string[] = JSON.parse(localStorage.getItem(this.LIKED_KEY) ?? '[]');
      this.isLiked = liked.includes(recipeId);
    } catch {
      this.isLiked = false;
    }
  }

  private saveLikedState(recipeId: string, liked: boolean): void {
    try {
      const current: string[] = JSON.parse(localStorage.getItem(this.LIKED_KEY) ?? '[]');
      if (liked) {
        if (!current.includes(recipeId)) current.push(recipeId);
      } else {
        const idx = current.indexOf(recipeId);
        if (idx > -1) current.splice(idx, 1);
      }
      localStorage.setItem(this.LIKED_KEY, JSON.stringify(current));
    } catch { /* ignore */ }
  }

  // ── Computed data ──────────────────────────────────────────────

  get scaledIngredients(): RecipeIngredient[] {
    if (!this.recipe) return [];
    return this.recipe.ingredients.map(ing => ({
      ...ing,
      amount: Math.round(ing.amount * this.servingsMultiplier * 10) / 10
    }));
  }

  get currentServings(): number {
    return Math.round(this.baseServings * this.servingsMultiplier);
  }

  get chefCount(): number {
    const fromRecipe = this.recipe?.helpers?.length ?? 0;
    return fromRecipe > 0 ? fromRecipe : this.prefsHelpers;
  }

  get chefRange(): number[] {
    return Array.from({ length: this.chefCount }, (_, i) => i);
  }

  // Steps split into left (odd positions) and right (even positions)
  get leftSteps(): CookingStep[] {
    return this.recipe?.steps?.filter((_, i) => i % 2 === 0) ?? [];
  }

  get rightSteps(): CookingStep[] {
    return this.recipe?.steps?.filter((_, i) => i % 2 === 1) ?? [];
  }

  get allSteps(): CookingStep[] {
    return this.recipe?.steps ?? [];
  }

  get styleLabel():  string { return STYLE_LABELS[this.recipe?.cookingStyle ?? ''] ?? ''; }
  get timeLabel():   string { return TIME_LABELS[this.recipe?.cookingTime   ?? ''] ?? ''; }
  get timeMinutes(): string { return TIME_MINUTES[this.recipe?.cookingTime  ?? ''] ?? ''; }

  /**
   * Percentage share of total calories for each macronutrient.
   * Protein and carbs provide 4 kcal/g, fat provides 9 kcal/g.
   */
  get macroPercents(): { protein: number; carbs: number; fat: number } {
    const n = this.recipe?.nutrition;
    if (!n) return { protein: 0, carbs: 0, fat: 0 };
    const total = n.proteinG * 4 + n.carbsG * 4 + n.fatG * 9;
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round(n.proteinG * 4 / total * 100),
      carbs:   Math.round(n.carbsG   * 4 / total * 100),
      fat:     Math.round(n.fatG     * 9 / total * 100)
    };
  }

  /** Total nutrition values for the whole recipe (per-portion × servings). */
  get totalNutrition(): { calories: number; proteinG: number; carbsG: number; fatG: number } {
    const n = this.recipe?.nutrition;
    const s = this.recipe?.servings ?? 1;
    if (!n) return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    return {
      calories: n.caloriesPerPortion * s,
      proteinG: Math.round(n.proteinG * s * 10) / 10,
      carbsG:   Math.round(n.carbsG   * s * 10) / 10,
      fatG:     Math.round(n.fatG     * s * 10) / 10
    };
  }

  // ── Chef helpers ───────────────────────────────────────────────

  /** Returns 0-based chef index for a given 1-based step number. */
  private chefIndexForStep(stepNumber: number): number {
    const c = this.chefCount;
    if (c === 1) return 0;
    if (c === 2) return stepNumber % 2 === 1 ? 0 : 1;  
    const r = stepNumber % 3;
    return r === 1 ? 0 : r === 2 ? 1 : 2;
  }

  chefColor(stepNumber: number): string  { return CHEF_COLORS[this.chefIndexForStep(stepNumber)]; }
  chefIcon(stepNumber: number): string   { return CHEF_ICONS[this.chefIndexForStep(stepNumber)]; }
  chefNumber(stepNumber: number): number { return this.chefIndexForStep(stepNumber) + 1; }

  // ── Actions ────────────────────────────────────────────────────

  toggleIngredients(): void { this.showIngredients = !this.showIngredients; }
  toggleDirections(): void  { this.showDirections  = !this.showDirections;  }

  toggleHeart(): void {
    const id = this.recipe?.id;
    if (!id) return;
    const newLiked = !this.isLiked;
    const delta: 1 | -1 = newLiked ? 1 : -1;

    this.isLiked     = newLiked;
    this.heartCount += delta;
    this.saveLikedState(id, newLiked);

    this.firebase.updateHeartCount(id, delta).subscribe({
      error: () => {
        this.isLiked     = !newLiked;
        this.heartCount -= delta;
        this.saveLikedState(id, !newLiked);
        this.cdr.markForCheck();
      }
    });
  }

  goToCookbook(): void { this.router.navigate(['/cookbook']); }

  startNewSearch(): void {
    this.recipeService.resetState();
    this.router.navigate(['/generate']);
  }
}
