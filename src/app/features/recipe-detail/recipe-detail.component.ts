import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { RecipeService } from '../../core/services/recipe.service';
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
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = true;
  error = '';
  heartCount = 0;

  readonly chefColors = CHEF_COLORS;
  readonly chefIcons  = CHEF_ICONS;

  private servingsMultiplier = 1;
  private baseServings = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
          this.error = 'Recipe not found.';
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = 'Recipe could not be loaded.';
        this.isLoading = false;
      }
    });
  }

  private setRecipe(recipe: Recipe): void {
    this.recipe    = recipe;
    this.baseServings = recipe.servings;
    this.isLoading = false;
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
    return this.recipe?.helpers?.length ?? 0;
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

  get styleLabel():  string { return STYLE_LABELS[this.recipe?.cookingStyle ?? ''] ?? ''; }
  get timeLabel():   string { return TIME_LABELS[this.recipe?.cookingTime   ?? ''] ?? ''; }
  get timeMinutes(): string { return TIME_MINUTES[this.recipe?.cookingTime  ?? ''] ?? ''; }

  // ── Chef helpers ───────────────────────────────────────────────

  chefColor(stepOriginalIndex: number): string {
    const c = this.chefCount;
    return c > 0 ? (CHEF_COLORS[stepOriginalIndex % c] ?? CHEF_COLORS[0]) : CHEF_COLORS[0];
  }

  chefIcon(stepOriginalIndex: number): string {
    const c = this.chefCount;
    return c > 0 ? (CHEF_ICONS[stepOriginalIndex % c] ?? CHEF_ICONS[0]) : CHEF_ICONS[0];
  }

  chefNumber(stepOriginalIndex: number): number {
    const c = this.chefCount;
    return c > 0 ? (stepOriginalIndex % c) + 1 : 1;
  }

  // ── Actions ────────────────────────────────────────────────────

  incrementHeart(): void { this.heartCount++; }

  goToCookbook(): void { this.router.navigate(['/cookbook']); }

  startNewSearch(): void {
    this.recipeService.resetState();
    this.router.navigate(['/generate']);
  }
}
