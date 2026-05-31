import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { RecipeService } from '../../core/services/recipe.service';
import { Recipe, CookingStyle } from '../../core/models/recipe.model';

// ── Static metadata ───────────────────────────────────────────────
const CUISINE_META: Record<string, { image: string; title: string }> = {
  italian:  { image: 'assets/images/recipes/italian-food.png',  title: 'Italian cuisine'  },
  german:   { image: 'assets/images/recipes/german-food.png',   title: 'German cuisine'   },
  japanese: { image: 'assets/images/recipes/japanese-food.png', title: 'Japanese cuisine' },
  indian:   { image: 'assets/images/recipes/indian-food.png',   title: 'Indian cuisine'   },
  gourmet:  { image: 'assets/images/recipes/gourmet-food.png',  title: 'Gourmet cuisine'  },
  fusion:   { image: 'assets/images/recipes/fusion-food.png',   title: 'Fusion cuisine'   },
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
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './cuisine-recipes.component.html',
  styleUrl: './cuisine-recipes.component.scss'
})
export class CuisineRecipesComponent implements OnInit {
  style = '';
  allRecipes: Recipe[] = [];
  isLoading = true;
  page = 1;
  readonly pageSize = 20;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebase: FirebaseService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.style = this.route.snapshot.params['style'] ?? '';
    this.loadRecipes();
  }

  private loadRecipes(): void {
    const style = this.style as CookingStyle;

    this.firebase.getRecipes(100, undefined, style).subscribe({
      next: recipes => {
        if (recipes.length > 0) {
          this.allRecipes = this.sortByDate(recipes);
        } else {
          // Fall back to any in-memory recipes from RecipeService filtered by style
          this.recipeService.generatedRecipes$.subscribe(generated => {
            this.allRecipes = this.sortByDate(
              generated.filter(r => r.cookingStyle === style)
            );
          });
        }
        this.isLoading = false;
      },
      error: () => {
        // Fall back to RecipeService in-memory data
        this.recipeService.generatedRecipes$.subscribe(generated => {
          this.allRecipes = this.sortByDate(
            generated.filter(r => r.cookingStyle === style)
          );
        });
        this.isLoading = false;
      }
    });
  }

  private sortByDate(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ── Cuisine metadata ──────────────────────────────────────────
  get cuisineTitle(): string { return CUISINE_META[this.style]?.title ?? ''; }
  get cuisineImage(): string { return CUISINE_META[this.style]?.image ?? ''; }

  // ── Pagination ────────────────────────────────────────────────
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.allRecipes.length / this.pageSize));
  }

  get pagedRecipes(): Recipe[] {
    const start = (this.page - 1) * this.pageSize;
    return this.allRecipes.slice(start, start + this.pageSize);
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

  goToPage(p: number): void  { this.page = p; }
  prevPage(): void           { if (this.page > 1) this.page--; }
  nextPage(): void           { if (this.page < this.totalPages) this.page++; }

  // ── Display helpers ───────────────────────────────────────────
  timeDisplay(t: string): string { return TIME_DISPLAY[t] ?? t; }
  timeTag(t: string): string     { return TIME_TAG[t] ?? t; }
  heartCount(r: Recipe): number  { return (r as any)['heartCount'] ?? 0; }

  // ── Navigation ────────────────────────────────────────────────
  viewRecipe(recipe: Recipe): void    { this.router.navigate(['/recipe', recipe.id]); }
  goToCookbook(): void                { this.router.navigate(['/cookbook']); }
  startNewSearch(): void              { this.router.navigate(['/generate']); }
}
