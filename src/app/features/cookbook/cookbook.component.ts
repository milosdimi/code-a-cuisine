import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { SeoService } from '../../core/services/seo.service';
import { Recipe, CookingTime } from '../../core/models/recipe.model';
import { TIME_MINUTES } from '../../core/constants/recipe-labels';
import { COOKBOOK_CUISINES } from '../../core/constants/cuisine-meta';
import { webpSrc } from '../../core/utils/image.util';

interface LikedRecipe extends Recipe {
  heartCount: number;
}

const MOCK_LIKED: LikedRecipe[] = [
  { id: 'mock-1', title: 'Spaghetti Carbonara', cookingStyle: 'italian', cookingTime: 'quick', servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 24 },
  { id: 'mock-2', title: 'Classic Potato Soup', cookingStyle: 'german', cookingTime: 'medium', servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 18 },
  { id: 'mock-3', title: 'Vegetable Miso Ramen', cookingStyle: 'japanese', cookingTime: 'medium', servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 15 },
  { id: 'mock-4', title: 'Butter Chicken Masala', cookingStyle: 'indian', cookingTime: 'elaborate', servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 12 },
  { id: 'mock-5', title: 'Fusion Teriyaki Bowl', cookingStyle: 'fusion', cookingTime: 'quick', servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 9 },
];

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent implements OnInit {
  likedRecipes: LikedRecipe[] = MOCK_LIKED;
  readonly cuisines = COOKBOOK_CUISINES;

  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);

  constructor(
    private firebase: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.seo.setPage({ title: 'Cookbook', description: 'Browse all community recipes sorted by cuisine style.' });
    this.loadLikedRecipes();
  }

  /** Fetches the most-hearted recipes from Firestore for the landing page showcase. */
  private loadLikedRecipes(): void {
    this.firebase.getRecipes(20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: recipes => {
          if (recipes.length > 0) {
            const sorted = recipes
              .map(r => ({ ...r, heartCount: r.heartCount ?? 0 }))
              .sort((a, b) => b.heartCount - a.heartCount)
              .slice(0, 5) as LikedRecipe[];
            this.likedRecipes = sorted.length > 0 ? sorted : MOCK_LIKED;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.likedRecipes = MOCK_LIKED;
          this.cdr.markForCheck();
        }
      });
  }

  /** Returns the WebP variant of a cuisine card PNG asset. */
  webpSrc = webpSrc;

  /** Maps a cooking-time enum to its human-readable minute range. */
  cookingTimeLabel(t: CookingTime): string {
    return TIME_MINUTES[t] ?? t;
  }

  navigateToCuisine(style: string): void {
    this.router.navigate(['/cookbook', style]);
  }

  startNewSearch(): void {
    this.router.navigate(['/generate']);
  }

  goBack(): void {
    window.history.back();
  }
}