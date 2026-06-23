import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { SeoService } from '../../core/services/seo.service';
import { CookingStyle, CookingTime, Recipe } from '../../core/models/recipe.model';
import { TIME_LABELS, TIME_MINUTES } from '../../core/constants/recipe-labels';
import { CUISINE_META } from '../../core/constants/cuisine-meta';
import { webpSrc } from '../../core/utils/image.util';

@Component({
  selector: 'app-cuisine-recipes',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, TitleCasePipe, LoadingSpinnerComponent],
  templateUrl: './cuisine-recipes.component.html',
  styleUrl: './cuisine-recipes.component.scss'
})
export class CuisineRecipesComponent implements OnInit {
  style: CookingStyle | '' = '';
  allRecipes: Recipe[] = [];
  isLoading = false;
  page = 1;
  readonly webpSrc = webpSrc;

  /** Recipes shown per page — fewer on mobile to match the grid layout. */
  get pageSize(): number { return window.innerWidth < 768 ? 9 : 15; }

  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebase: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.style = (this.route.snapshot.params['style'] ?? '') as CookingStyle | '';
    const meta = this.style ? CUISINE_META[this.style] : undefined;
    this.seo.setPage({
      title: meta ? meta.title : 'Recipes',
      description: meta ? `Browse ${meta.title} from the Code à Cuisine community.` : undefined
    });
    this.loadFromFirebase();
  }

  private loadFromFirebase(): void {
    this.isLoading = true;
    this.firebase.getRecipes(100, undefined, this.style || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: recipes => {
          this.allRecipes = this.sortByDate(recipes);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('[CuisineRecipes] load error:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private sortByDate(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  get cuisineTitle(): string {
    return this.style ? (CUISINE_META[this.style]?.title ?? '') : '';
  }

  get cuisineImage(): string {
    return this.style ? (CUISINE_META[this.style]?.image ?? '') : '';
  }

  get cuisineMobileImage(): string {
    return this.style ? (CUISINE_META[this.style]?.mobileImage ?? '') : '';
  }

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

  goToPage(p: number): void { this.page = p; }
  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  timeDisplay(recipe: Recipe): string {
    const mins = (recipe as Recipe & { cookingTimeMinutes?: number }).cookingTimeMinutes;
    return mins != null ? `${mins}min` : (TIME_MINUTES[recipe.cookingTime] ?? recipe.cookingTime);
  }

  timeTag(t: CookingTime): string {
    return TIME_LABELS[t] ?? t;
  }

  heartCount(recipe: Recipe): number {
    return recipe.heartCount ?? 0;
  }

  viewRecipe(recipe: Recipe): void { this.router.navigate(['/recipe', recipe.id]); }
  goToCookbook(): void { this.router.navigate(['/cookbook']); }
  startNewSearch(): void { this.router.navigate(['/generate']); }
}