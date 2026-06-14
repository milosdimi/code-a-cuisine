import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { SeoService } from '../../core/services/seo.service';
import { CookingStyle } from '../../core/models/recipe.model';

// ── Static metadata ───────────────────────────────────────────────
const CUISINE_META: Record<string, { image: string; mobileImage: string; title: string }> = {
  italian:  { image: 'assets/images/recipes/italian-food.png',  mobileImage: 'assets/images/mobile/recipe/italian-cuisine-mobile.png',  title: 'Italian cuisine'  },
  german:   { image: 'assets/images/recipes/german-food.png',   mobileImage: 'assets/images/mobile/recipe/german-cuisine-mobile.png',   title: 'German cuisine'   },
  japanese: { image: 'assets/images/recipes/japanese-food.png', mobileImage: 'assets/images/mobile/recipe/japanese-cuisine-mobile.png', title: 'Japanese cuisine' },
  indian:   { image: 'assets/images/recipes/indian-food.png',   mobileImage: 'assets/images/mobile/recipe/indian-cuisine-mobile.png',   title: 'Indian cuisine'   },
  gourmet:  { image: 'assets/images/recipes/gourmet-food.png',  mobileImage: 'assets/images/mobile/recipe/gourmet-cuisine-mobile.png',  title: 'Gourmet cuisine'  },
  fusion:   { image: 'assets/images/recipes/fusion-food.png',   mobileImage: 'assets/images/mobile/recipe/fusion-cuisine-mobile.png',   title: 'Fusion cuisine'   },
};

const TIME_DISPLAY: Record<string, string> = {
  quick: 'up to 20min', medium: '25-40min', elaborate: '45+ min'
};

const TIME_TAG: Record<string, string> = {
  quick: 'Quick', medium: 'Medium', elaborate: 'Complex'
};

@Component({
  selector: 'app-cuisine-recipes',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, TitleCasePipe, LoadingSpinnerComponent],
  templateUrl: './cuisine-recipes.component.html',
  styleUrl: './cuisine-recipes.component.scss'
})
export class CuisineRecipesComponent implements OnInit {
  style = '';
  allRecipes: any[] = [];
  isLoading = false;
  page = 1;
  get pageSize(): number { return window.innerWidth < 768 ? 9 : 15; }

  private seo = inject(SeoService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebase: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Reads the cuisine style from the route and loads matching recipes from Firestore. */
  ngOnInit(): void {
    this.style = this.route.snapshot.params['style'] ?? '';
    const meta = CUISINE_META[this.style];
    this.seo.setPage({
      title: meta ? meta.title : 'Recipes',
      description: meta ? `Browse ${meta.title} from the Code à Cuisine community.` : undefined
    });
    this.loadFromFirebase();
  }

  /** Fetches up to 100 recipes for the active cuisine style from Firestore, sorted by date. */
  private loadFromFirebase(): void {
    this.isLoading = true;
    this.firebase.getRecipes(100, undefined, this.style as CookingStyle).subscribe({
      next: recipes => {
        this.allRecipes = this.sortByDate(recipes);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[CuisineRecipes] load error:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Sorts recipes descending by createdAt so newest appear first. */
  private sortByDate(recipes: any[]): any[] {
    return [...recipes].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ── Cuisine metadata ──────────────────────────────────────────
  /** Display title for the active cuisine (e.g. "Italian cuisine"). */
  get cuisineTitle(): string       { return CUISINE_META[this.style]?.title       ?? ''; }
  /** Desktop header image path for the active cuisine. */
  get cuisineImage(): string       { return CUISINE_META[this.style]?.image       ?? ''; }
  /** Mobile header image path for the active cuisine. */
  get cuisineMobileImage(): string { return CUISINE_META[this.style]?.mobileImage ?? ''; }

  // ── Pagination ────────────────────────────────────────────────
  /** Total number of pages based on the recipe count and current page size. */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.allRecipes.length / this.pageSize));
  }

  /** The subset of recipes for the currently active page. */
  get pagedRecipes(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.allRecipes.slice(start, start + this.pageSize);
  }

  /** Page numbers and ellipsis markers rendered by the pagination bar. */
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

  /** Jumps to the specified page number. */
  goToPage(p: number): void  { this.page = p; }
  /** Moves to the previous page if not already on the first. */
  prevPage(): void           { if (this.page > 1) this.page--; }
  /** Moves to the next page if not already on the last. */
  nextPage(): void           { if (this.page < this.totalPages) this.page++; }

  // ── Display helpers ───────────────────────────────────────────
  /** Returns the human-readable cooking time for a recipe card. */
  timeDisplay(r: any): string {
    const mins = r['cookingTimeMinutes'];
    return mins != null ? `${mins}min` : (TIME_DISPLAY[r['cookingTime']] ?? r['cookingTime']);
  }
  /** Returns the short time tag label (e.g. "Quick"). */
  timeTag(t: string): string { return TIME_TAG[t] ?? t; }
  /** Returns the heart count for a recipe (defaults to 0). */
  heartCount(r: any): number  { return r['heartCount'] ?? 0; }

  // ── Navigation ────────────────────────────────────────────────
  /** Navigates to the full recipe detail view. */
  viewRecipe(recipe: any): void    { this.router.navigate(['/recipe', recipe.id]); }
  /** Navigates back to the cookbook landing page. */
  goToCookbook(): void                { this.router.navigate(['/cookbook']); }
  /** Resets state and navigates to the ingredient input step. */
  startNewSearch(): void              { this.router.navigate(['/generate']); }
}
