import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { SeoService } from '../../../core/services/seo.service';
import { QuotaService } from '../../../core/services/quota.service';
import { UserPreferences } from '../../../core/models/preferences.model';
import { CookingStyle, CookingTime, DietType } from '../../../core/models/recipe.model';
import { STYLE_LABELS, TIME_LABELS, TIME_MINUTES } from '../../../core/constants/recipe-labels';
import { COOKBOOK_CUISINES } from '../../../core/constants/cuisine-meta';

interface StyleOption { value: CookingStyle; label: string; emoji: string; }
interface TimeOption  { value: CookingTime;  label: string; subtitle: string; }
interface DietOption  { value: DietType;     label: string; }

const STYLE_ORDER: CookingStyle[] = ['german', 'italian', 'japanese', 'indian', 'gourmet', 'fusion'];
const TIME_ORDER: CookingTime[] = ['quick', 'medium', 'elaborate'];
const CUISINE_EMOJIS = Object.fromEntries(
  COOKBOOK_CUISINES.map(c => [c.style, c.emoji])
) as Record<CookingStyle, string>;

@Component({
  selector: 'app-step2-preferences',
  standalone: true,
  imports: [FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './step2-preferences.component.html',
  styleUrl: './step2-preferences.component.scss'
})
export class Step2PreferencesComponent implements OnInit {
  readonly minServings = 1;
  readonly maxServings = 12;
  readonly minHelpers = 1;
  readonly maxHelpers = 3;
  readonly maxGenerationsPerDay = 3;

  servings  = 2;
  cookingTime: CookingTime  = 'medium';
  cookingStyle: CookingStyle = 'italian';
  diet: DietType = 'none';
  helpers = 1;
  isLoading = false;
  quotaError = '';
  quotaRemaining: number | null = null;
  quotaLoaded = false;

  readonly styleOptions: StyleOption[] = STYLE_ORDER.map(value => ({
    value,
    label: STYLE_LABELS[value],
    emoji: CUISINE_EMOJIS[value]
  }));

  readonly timeOptions: TimeOption[] = TIME_ORDER.map(value => ({
    value,
    label: TIME_LABELS[value],
    subtitle: TIME_MINUTES[value]
  }));

  readonly dietOptions: DietOption[] = [
    { value: 'none',        label: 'No restriction' },
    { value: 'vegetarian',  label: 'Vegetarian'     },
    { value: 'vegan',       label: 'Vegan'          },
    { value: 'keto',        label: 'Keto'           }
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly seo        = inject(SeoService);

  constructor(
    private recipeService: RecipeService,
    private quotaService: QuotaService,
    private router: Router
  ) {
    this.destroyRef.onDestroy(() => this.persistPreferences());
  }

  /** Restores previously saved preferences and guards against missing ingredients. */
  ngOnInit(): void {
    this.seo.setPage({ title: 'Your Preferences', description: 'Choose your cooking style, time, and dietary preferences.' });

    this.recipeService.preferences$.pipe(take(1)).subscribe(prefs => {
      if (!prefs?.ingredients?.length) {
        this.router.navigate(['/generate']);
        return;
      }
      this.applyPreferences(prefs);
    });

    this.quotaService.checkQuota().pipe(take(1)).subscribe(status => {
      this.quotaRemaining = status.remaining;
      this.quotaLoaded = true;
    });
  }

  /**
   * Checks the quota and, when allowed, saves preferences and starts generation.
   * Navigates to the loading screen while the n8n call is in flight.
   */
  generateRecipes(): void {
    this.isLoading = true;
    this.quotaError = '';

    this.recipeService.preferences$.pipe(take(1)).subscribe(current => {
      if (!current?.ingredients?.length) {
        this.isLoading = false;
        this.router.navigate(['/generate']);
        return;
      }

      this.quotaService.checkQuota().subscribe({
        next: status => {
          if (!status.allowed) {
            this.quotaError = status.message ?? 'Daily limit reached.';
            this.quotaRemaining = 0;
            this.isLoading = false;
            return;
          }
          this.quotaRemaining = status.remaining;
          this.persistPreferences();
          this.router.navigate(['/loading']);
        },
        error: () => {
          this.persistPreferences();
          this.router.navigate(['/loading']);
        }
      });
    });
  }

  /** Clamps the servings input to the valid range (1–12). */
  clampServings(val: number): void {
    this.servings = Math.max(this.minServings, Math.min(this.maxServings, val));
    this.persistPreferences();
  }

  /** Clamps the helper count to the valid range (1–3). */
  clampHelpers(val: number): void {
    this.helpers = Math.max(this.minHelpers, Math.min(this.maxHelpers, val));
    this.persistPreferences();
  }

  /** Persists the current form state into shared preferences. */
  onPreferenceChange(): void {
    this.persistPreferences();
  }

  private applyPreferences(prefs: UserPreferences): void {
    this.servings     = prefs.servings;
    this.cookingTime  = prefs.cookingTime;
    this.cookingStyle = prefs.cookingStyle;
    this.diet         = prefs.diet;
    this.helpers      = prefs.helpers;
  }

  private persistPreferences(): void {
    this.recipeService.updatePreferences({
      servings:     this.servings,
      cookingTime:  this.cookingTime,
      cookingStyle: this.cookingStyle,
      diet:         this.diet,
      helpers:      this.helpers
    });
  }
}