import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { Recipe, CookingStyle } from '../../core/models/recipe.model';

interface LikedRecipe extends Recipe {
  heartCount: number;
}

// ── Cookbook landing data ─────────────────────────────────────────

const TIME_MINUTES: Record<string, string> = {
  quick: 'up to 20min', medium: '25-40min', elaborate: '45+ min'
};

const TIME_TAGS: Record<string, string> = {
  quick: 'Quick', medium: 'Medium', elaborate: 'Complex'
};

const STYLE_TAGS: Record<string, string> = {
  italian: 'Italian', german: 'German', japanese: 'Japanese',
  indian: 'Indian', gourmet: 'Gourmet', fusion: 'Fusion'
};

const CUISINE_META: Record<string, { image: string; title: string }> = {
  italian:  { image: 'assets/images/recipes/italian-food.png',  title: 'Italian cuisine'  },
  german:   { image: 'assets/images/recipes/german-food.png',   title: 'German cuisine'   },
  japanese: { image: 'assets/images/recipes/japanese-food.png', title: 'Japanese cuisine' },
  indian:   { image: 'assets/images/recipes/indian-food.png',   title: 'Indian cuisine'   },
  gourmet:  { image: 'assets/images/recipes/gourmet-food.png',  title: 'Gourmet cuisine'  },
  fusion:   { image: 'assets/images/recipes/fusion-food.png',   title: 'Fusion cuisine'   },
};

const MOCK_LIKED: LikedRecipe[] = [
  { id: 'mock-1', title: 'Spaghetti Carbonara',   cookingStyle: 'italian',  cookingTime: 'quick',     servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 24 },
  { id: 'mock-2', title: 'Classic Potato Soup',   cookingStyle: 'german',   cookingTime: 'medium',    servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 18 },
  { id: 'mock-3', title: 'Vegetable Miso Ramen',  cookingStyle: 'japanese', cookingTime: 'medium',    servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 15 },
  { id: 'mock-4', title: 'Butter Chicken Masala', cookingStyle: 'indian',   cookingTime: 'elaborate', servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 12 },
  { id: 'mock-5', title: 'Fusion Teriyaki Bowl',  cookingStyle: 'fusion',   cookingTime: 'quick',     servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 9  },
];

const CUISINES = [
  { style: 'italian',  label: 'Italian',  emoji: '🤌', image: 'assets/images/cookbook/italian.png' },
  { style: 'german',   label: 'German',   emoji: '🍻', image: 'assets/images/cookbook/german.png'  },
  { style: 'japanese', label: 'Japanese', emoji: '🍜', image: 'assets/images/cookbook/japan.png'   },
  { style: 'gourmet',  label: 'Gourmet',  emoji: '🤌', image: 'assets/images/cookbook/gourmet.png' },
  { style: 'indian',   label: 'Indian',   emoji: '🍛', image: 'assets/images/cookbook/indian.png'  },
  { style: 'fusion',   label: 'Fusion',   emoji: '🍢', image: 'assets/images/cookbook/fusion.png'  },
];

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, LoadingSpinnerComponent],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent implements OnInit {

  // ── Landing page ──────────────────────────────────────────────
  likedRecipes: LikedRecipe[] = MOCK_LIKED;
  readonly cuisines = CUISINES;

  // ── Cuisine detail page ───────────────────────────────────────
  isDetailView = false;
  activeStyle = '';
  allRecipes: LikedRecipe[] = [];
  isLoading = false;
  error = '';
  page = 1;
  get pageSize(): number { return window.innerWidth < 768 ? 9 : 20; }

  constructor(
    private firebase: FirebaseService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const style = this.route.snapshot.paramMap.get('style');
    if (style && CUISINE_META[style]) {
      this.isDetailView = true;
      this.activeStyle = style;
      this.loadCuisineRecipes(style as CookingStyle);
    } else {
      this.loadLikedRecipes();
    }
  }

  // ── Landing page methods ──────────────────────────────────────

  private loadLikedRecipes(): void {
    this.firebase.getRecipes(20).subscribe({
      next: recipes => {
        if (recipes.length > 0) {
          const sorted = recipes
            .map(r => ({ ...r, heartCount: (r as any)['heartCount'] ?? 0 }))
            .sort((a, b) => b.heartCount - a.heartCount)
            .slice(0, 5) as LikedRecipe[];
          this.likedRecipes = sorted.length > 0 ? sorted : MOCK_LIKED;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.likedRecipes = MOCK_LIKED; this.cdr.markForCheck(); }
    });
  }

  cookingTimeLabel(t: string): string { return TIME_MINUTES[t] ?? t; }

  navigateToCuisine(style: string): void { this.router.navigate(['/cookbook', style]); }

  // ── Cuisine detail page methods ───────────────────────────────

  private loadCuisineRecipes(style: CookingStyle): void {
    this.isLoading = true;
    this.firebase.getRecipes(100, undefined, style).subscribe({
      next: recipes => {
        this.allRecipes = recipes.map(r => ({
          ...r, heartCount: (r as any)['heartCount'] ?? 0
        })) as LikedRecipe[];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Could not load recipes.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get cuisineTitle(): string  { return CUISINE_META[this.activeStyle]?.title ?? ''; }
  get cuisineImage(): string  { return CUISINE_META[this.activeStyle]?.image ?? ''; }

  get filteredRecipes(): LikedRecipe[] { return this.allRecipes; }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecipes.length / this.pageSize));
  }

  get pagedRecipes(): LikedRecipe[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRecipes.slice(start, start + this.pageSize);
  }

  get paginationPages(): (number | string)[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | string)[] = [1];
    if (this.page > 3) pages.push('...');
    for (let i = Math.max(2, this.page - 1); i <= Math.min(total - 1, this.page + 1); i++) {
      pages.push(i);
    }
    if (this.page < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  goToPage(p: number): void { this.page = p; }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  timeLabel(t: string): string  { return TIME_MINUTES[t] ?? t; }
  timeTag(t: string): string    { return TIME_TAGS[t] ?? t; }
  styleTag(s: string): string   { return STYLE_TAGS[s] ?? s; }
  getHeartCount(r: LikedRecipe): number { return r.heartCount ?? 0; }

  viewRecipe(recipe: Recipe): void { this.router.navigate(['/recipe', recipe.id]); }

  // ── Shared ────────────────────────────────────────────────────

  goToCookbook(): void  { this.router.navigate(['/cookbook']); }
  startNewSearch(): void { this.router.navigate(['/generate']); }
  goBack(): void        { window.history.back(); }
}
