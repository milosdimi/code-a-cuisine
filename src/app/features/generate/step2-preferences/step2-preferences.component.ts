import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { SeoService } from '../../../core/services/seo.service';
import { QuotaService } from '../../../core/services/quota.service';
import { UserPreferences } from '../../../core/models/preferences.model';
import { CookingStyle, CookingTime, DietType } from '../../../core/models/recipe.model';

interface StyleOption { value: CookingStyle; label: string; emoji: string; }
interface TimeOption  { value: CookingTime;  label: string; subtitle: string; }
interface DietOption  { value: DietType;     label: string; }

@Component({
  selector: 'app-step2-preferences',
  standalone: true,
  imports: [FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './step2-preferences.component.html',
  styleUrl: './step2-preferences.component.scss'
})
export class Step2PreferencesComponent implements OnInit {
  servings  = 2;
  cookingTime: CookingTime  = 'medium';
  cookingStyle: CookingStyle = 'italian';
  diet: DietType = 'none';
  helpers = 1;
  isLoading = false;
  quotaError = '';

  readonly styleOptions: StyleOption[] = [
    { value: 'german',   label: 'German',              emoji: '🥨' },
    { value: 'italian',  label: 'Italian',             emoji: '🍕' },
    { value: 'japanese', label: 'Japanese',            emoji: '🍜' },
    { value: 'indian',   label: 'Indian',              emoji: '🍛' },
    { value: 'gourmet',  label: 'Gourmet', emoji: '⭐' },
    { value: 'fusion',   label: 'Fusion',              emoji: '🌍' }
  ];

  readonly timeOptions: TimeOption[] = [
    { value: 'quick',     label: 'Quick',   subtitle: 'up to 20min' },
    { value: 'medium',    label: 'Medium',  subtitle: '25-40min'    },
    { value: 'elaborate', label: 'Complex', subtitle: 'over 45min'  }
  ];

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
  ) {}

  /** Restores previously saved preferences into the form fields. */
  ngOnInit(): void {
    this.seo.setPage({ title: 'Your Preferences', description: 'Choose your cooking style, time, and dietary preferences.' });
    this.recipeService.preferences$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(prefs => {
      if (prefs) {
        this.servings     = prefs.servings;
        this.cookingTime  = prefs.cookingTime;
        this.cookingStyle = prefs.cookingStyle;
        this.diet         = prefs.diet;
        this.helpers      = prefs.helpers;
      }
    });
  }

  /**
   * Checks the quota and, when allowed, saves preferences and starts generation.
   * Navigates to the loading screen while the n8n call is in flight.
   */
  generateRecipes(): void {
    this.isLoading = true;
    this.quotaError = '';

    this.quotaService.checkQuota().subscribe({
      next: status => {
        if (!status.allowed) {
          this.quotaError = status.message ?? 'Tageslimit erreicht.';
          this.isLoading = false;
          return;
        }
        const prefs: Partial<UserPreferences> = {
          servings:     this.servings,
          cookingTime:  this.cookingTime,
          cookingStyle: this.cookingStyle,
          diet:         this.diet,
          helpers:      this.helpers
        };
        this.recipeService.updatePreferences(prefs);
        this.router.navigate(['/loading']);
      },
      error: () => {
        this.recipeService.updatePreferences({
          servings:     this.servings,
          cookingTime:  this.cookingTime,
          cookingStyle: this.cookingStyle,
          diet:         this.diet,
          helpers:      this.helpers
        });
        this.router.navigate(['/loading']);
      }
    });
  }

  /** Clamps the servings input to the valid range (1–12). */
  clampServings(val: number): void {
    this.servings = Math.max(1, Math.min(12, val));
  }

  /** Clamps the helper count to the valid range (1–3). */
  clampHelpers(val: number): void {
    this.helpers = Math.max(1, Math.min(3, val));
  }
}
