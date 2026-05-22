import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { QuotaService } from '../../../core/services/quota.service';
import { UserPreferences } from '../../../core/models/preferences.model';
import { CookingStyle, CookingTime, DietType } from '../../../core/models/recipe.model';

interface StyleOption { value: CookingStyle; label: string; emoji: string; }
interface TimeOption  { value: CookingTime;  label: string; }
interface DietOption  { value: DietType;     label: string; }

@Component({
  selector: 'app-step2-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
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
    { value: 'german',   label: 'Deutsche Küche',      emoji: '🥨' },
    { value: 'italian',  label: 'Italienische Küche',  emoji: '🍕' },
    { value: 'japanese', label: 'Japanische Küche',    emoji: '🍜' },
    { value: 'indian',   label: 'Indische Küche',      emoji: '🍛' },
    { value: 'gourmet',  label: 'Gourmet / Fine Dining', emoji: '⭐' },
    { value: 'fusion',   label: 'Fusion',              emoji: '🌍' }
  ];

  readonly timeOptions: TimeOption[] = [
    { value: 'quick',     label: 'Schnell (bis 20 Min)'  },
    { value: 'medium',    label: 'Mittel (20–45 Min)'    },
    { value: 'elaborate', label: 'Aufwendig (45+ Min)'   }
  ];

  readonly dietOptions: DietOption[] = [
    { value: 'none',        label: 'Keine Einschränkung' },
    { value: 'vegetarian',  label: 'Vegetarisch'         },
    { value: 'vegan',       label: 'Vegan'               },
    { value: 'keto',        label: 'Keto'                }
  ];

  constructor(
    private recipeService: RecipeService,
    private quotaService: QuotaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.recipeService.preferences$.subscribe(prefs => {
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

  clampServings(val: number): void {
    this.servings = Math.max(1, Math.min(12, val));
  }

  clampHelpers(val: number): void {
    this.helpers = Math.max(1, Math.min(3, val));
  }
}
