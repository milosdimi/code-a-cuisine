import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models/recipe.model';
import { UserPreferences } from '../models/preferences.model';
import { FirebaseService } from './firebase.service';

/** Manages the recipe generation flow: state, n8n calls and Firebase persistence. */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly N8N_WEBHOOK_URL = environment.n8nWebhookUrl;

  private readonly _preferences$ = new BehaviorSubject<UserPreferences | null>(null);
  private readonly _generatedRecipes$ = new BehaviorSubject<Recipe[]>([]);
  private readonly _isLoading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  /** Current user preferences across the multi-step form. */
  readonly preferences$ = this._preferences$.asObservable();
  /** The 3 most recently generated recipes. */
  readonly generatedRecipes$ = this._generatedRecipes$.asObservable();
  /** True while the n8n request is in flight. */
  readonly isLoading$ = this._isLoading$.asObservable();
  /** Last error message, if any. */
  readonly error$ = this._error$.asObservable();

  constructor(
    private http: HttpClient,
    private firebase: FirebaseService
  ) {}

  /**
   * Updates the shared preferences state used across wizard steps.
   * @param prefs - Partial or full preferences to merge.
   */
  updatePreferences(prefs: Partial<UserPreferences>): void {
    const current = this._preferences$.value ?? this.defaultPreferences();
    this._preferences$.next({ ...current, ...prefs });
  }

  /** Returns a fresh default UserPreferences object. */
  defaultPreferences(): UserPreferences {
    return {
      ingredients: [],
      servings: 2,
      cookingTime: 'medium',
      cookingStyle: 'italian',
      diet: 'none',
      helpers: 1
    };
  }

  /**
   * Sends preferences to the n8n webhook and receives 3 recipe suggestions.
   * Persists all recipes to Firebase on success.
   * @param preferences - Full user preferences including ingredients.
   * @returns Observable emitting an array of 3 Recipe objects.
   */
  generateRecipes(preferences: UserPreferences): Observable<Recipe[]> {
    this._isLoading$.next(true);
    this._error$.next(null);

    const payload = this.buildPayload(preferences);

    return this.http
      .post<{ recipes: Recipe[] }>(this.N8N_WEBHOOK_URL, payload)
      .pipe(
        map(response => response.recipes.map(r => ({
          ...r,
          id: r.id ?? crypto.randomUUID(),
          createdAt: r.createdAt ?? new Date()
        }))),
        tap(recipes => {
          this._generatedRecipes$.next(recipes);
          this._isLoading$.next(false);
          recipes.forEach(r => {
            const { id: _id, ...recipeData } = r;
            this.firebase.saveRecipe(recipeData).subscribe();
          });
        }),
        catchError((err: HttpErrorResponse) => {
          this._isLoading$.next(false);
          const message = this.mapError(err);
          this._error$.next(message);
          return throwError(() => new Error(message));
        })
      );
  }

  /** Returns a mock recipe by ID (fallback when not in session or Firestore). */
  getMockRecipeById(id: string): Recipe | undefined {
    return MOCK_RECIPES.find(r => r.id === id);
  }

  /** Clears generated recipes and resets the error state. */
  resetState(): void {
    this._generatedRecipes$.next([]);
    this._error$.next(null);
  }

  private buildPayload(prefs: UserPreferences) {
    return {
      ingredients: prefs.ingredients,
      preferences: {
        servings:     prefs.servings,
        cookingTime:  prefs.cookingTime,
        cookingStyle: prefs.cookingStyle,
        diet:         prefs.diet,
        helpers:      prefs.helpers
      }
    };
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) return 'Tageslimit erreicht. Bitte morgen wieder versuchen.';
    if (err.status === 0)   return 'Keine Verbindung. Bitte Internetverbindung prüfen.';
    return 'Die Rezeptgenerierung ist fehlgeschlagen. Bitte erneut versuchen.';
  }
}

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Pasta with spinach and cherry tomatoes',
    cookingStyle: 'italian',
    cookingTime: 'quick',
    servings: 2,
    ingredients: [
      { name: 'Spaghetti',        amount: 200, unit: 'g'     },
      { name: 'Spinach',          amount: 150, unit: 'g'     },
      { name: 'Cherry tomatoes',  amount: 200, unit: 'g'     },
      { name: 'Garlic',           amount: 2,   unit: 'Stück' },
      { name: 'Olive oil',        amount: 3,   unit: 'EL'    },
      { name: 'Parmesan',         amount: 40,  unit: 'g'     },
    ],
    missingIngredients: [],
    steps: [
      { stepNumber: 1, description: 'Cook pasta in salted boiling water until al dente.',    durationMinutes: 10, isParallel: false },
      { stepNumber: 2, description: 'Heat olive oil in a pan, sauté garlic for 1 minute.',   durationMinutes: 2,  isParallel: true, parallelWith: [1] },
      { stepNumber: 3, description: 'Add cherry tomatoes and cook until softened.',           durationMinutes: 5,  isParallel: false },
      { stepNumber: 4, description: 'Add spinach and stir until wilted.',                    durationMinutes: 2,  isParallel: false },
      { stepNumber: 5, description: 'Drain pasta, toss with sauce, serve with parmesan.',    durationMinutes: 2,  isParallel: false },
    ],
    nutrition: { caloriesPerPortion: 480, proteinG: 18, carbsG: 72, fatG: 12 },
    helpers: [],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'r2',
    title: 'Creamy garlic shrimp pasta',
    cookingStyle: 'italian',
    cookingTime: 'quick',
    servings: 2,
    ingredients: [
      { name: 'Linguine',         amount: 200, unit: 'g'     },
      { name: 'Shrimp',           amount: 300, unit: 'g'     },
      { name: 'Garlic',           amount: 3,   unit: 'Stück' },
      { name: 'Heavy cream',      amount: 150, unit: 'ml'    },
      { name: 'Butter',           amount: 30,  unit: 'g'     },
      { name: 'Parsley',          amount: 15,  unit: 'g'     },
    ],
    missingIngredients: [],
    steps: [
      { stepNumber: 1, description: 'Cook linguine in salted water until al dente.',          durationMinutes: 9,  isParallel: false },
      { stepNumber: 2, description: 'Melt butter in a pan, sauté garlic until fragrant.',     durationMinutes: 2,  isParallel: true, parallelWith: [1] },
      { stepNumber: 3, description: 'Add shrimp, cook 2 min per side until pink.',            durationMinutes: 4,  isParallel: false },
      { stepNumber: 4, description: 'Pour in cream, simmer 3 min until slightly thickened.',  durationMinutes: 3,  isParallel: false },
      { stepNumber: 5, description: 'Toss drained pasta in sauce, garnish with parsley.',     durationMinutes: 2,  isParallel: false },
    ],
    nutrition: { caloriesPerPortion: 620, proteinG: 38, carbsG: 65, fatG: 22 },
    helpers: [],
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'r3',
    title: 'Funghi salami pizza',
    cookingStyle: 'italian',
    cookingTime: 'quick',
    servings: 2,
    ingredients: [
      { name: 'Pizza dough',      amount: 400, unit: 'g'     },
      { name: 'Tomato sauce',     amount: 150, unit: 'ml'    },
      { name: 'Mozzarella',       amount: 200, unit: 'g'     },
      { name: 'Mushrooms',        amount: 150, unit: 'g'     },
      { name: 'Salami',           amount: 80,  unit: 'g'     },
      { name: 'Olive oil',        amount: 2,   unit: 'EL'    },
    ],
    missingIngredients: [],
    steps: [
      { stepNumber: 1, description: 'Preheat oven to 250 °C with a baking tray inside.',      durationMinutes: 15, isParallel: false },
      { stepNumber: 2, description: 'Roll out dough on a floured surface to a thin round.',   durationMinutes: 5,  isParallel: true, parallelWith: [1] },
      { stepNumber: 3, description: 'Spread tomato sauce, add mozzarella, mushrooms, salami.',durationMinutes: 3,  isParallel: false },
      { stepNumber: 4, description: 'Bake on the hot tray for 10–12 min until crust is golden.',durationMinutes: 12, isParallel: false },
    ],
    nutrition: { caloriesPerPortion: 710, proteinG: 32, carbsG: 84, fatG: 26 },
    helpers: [],
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 'r4',
    title: 'Spaghetti Carbonara',
    cookingStyle: 'italian',
    cookingTime: 'quick',
    servings: 2,
    ingredients: [
      { name: 'Spaghetti',        amount: 200, unit: 'g'     },
      { name: 'Pancetta',         amount: 100, unit: 'g'     },
      { name: 'Egg yolks',        amount: 3,   unit: 'Stück' },
      { name: 'Pecorino Romano',  amount: 60,  unit: 'g'     },
      { name: 'Black pepper',     amount: 1,   unit: 'TL'    },
    ],
    missingIngredients: [],
    steps: [
      { stepNumber: 1, description: 'Cook spaghetti in salted water, reserve 1 cup pasta water.', durationMinutes: 10, isParallel: false },
      { stepNumber: 2, description: 'Fry pancetta in a dry pan until crispy.',                    durationMinutes: 5,  isParallel: true, parallelWith: [1] },
      { stepNumber: 3, description: 'Whisk egg yolks with pecorino and plenty of black pepper.',  durationMinutes: 2,  isParallel: true, parallelWith: [1] },
      { stepNumber: 4, description: 'Remove pan from heat, add pasta, then egg mixture.',         durationMinutes: 2,  isParallel: false },
      { stepNumber: 5, description: 'Toss vigorously, adding pasta water to create creamy sauce.',durationMinutes: 2,  isParallel: false },
    ],
    nutrition: { caloriesPerPortion: 680, proteinG: 30, carbsG: 70, fatG: 28 },
    helpers: [],
    createdAt: new Date('2024-01-04'),
  },
  {
    id: 'r5',
    title: 'Risotto ai funghi',
    cookingStyle: 'italian',
    cookingTime: 'medium',
    servings: 2,
    ingredients: [
      { name: 'Arborio rice',     amount: 160, unit: 'g'     },
      { name: 'Mixed mushrooms',  amount: 250, unit: 'g'     },
      { name: 'Vegetable stock',  amount: 700, unit: 'ml'    },
      { name: 'Dry white wine',   amount: 100, unit: 'ml'    },
      { name: 'Shallot',          amount: 1,   unit: 'Stück' },
      { name: 'Butter',           amount: 40,  unit: 'g'     },
      { name: 'Parmesan',         amount: 50,  unit: 'g'     },
    ],
    missingIngredients: [],
    steps: [
      { stepNumber: 1, description: 'Keep stock warm in a small saucepan over low heat.',         durationMinutes: 5,  isParallel: false },
      { stepNumber: 2, description: 'Sauté shallot in butter until soft, add mushrooms, cook 4 min.', durationMinutes: 6, isParallel: false },
      { stepNumber: 3, description: 'Add rice, toast 1 min, deglaze with white wine.',            durationMinutes: 3,  isParallel: false },
      { stepNumber: 4, description: 'Add warm stock ladle by ladle, stirring constantly.',        durationMinutes: 18, isParallel: false },
      { stepNumber: 5, description: 'Remove from heat, stir in butter and parmesan. Rest 2 min.', durationMinutes: 3,  isParallel: false },
    ],
    nutrition: { caloriesPerPortion: 540, proteinG: 16, carbsG: 78, fatG: 16 },
    helpers: [],
    createdAt: new Date('2024-01-05'),
  },
];
