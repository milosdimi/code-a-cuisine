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
        map(response => response.recipes),
        tap(recipes => {
          this._generatedRecipes$.next(recipes);
          this._isLoading$.next(false);
          recipes.forEach(r =>
            this.firebase.saveRecipe({ ...r, createdAt: new Date() }).subscribe()
          );
        }),
        catchError((err: HttpErrorResponse) => {
          this._isLoading$.next(false);
          const message = this.mapError(err);
          this._error$.next(message);
          return throwError(() => new Error(message));
        })
      );
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
      },
      meta: {
        ipAddress: 'CLIENT_IP',
        timestamp: new Date().toISOString(),
        language:  'de'
      }
    };
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) return 'Tageslimit erreicht. Bitte morgen wieder versuchen.';
    if (err.status === 0)   return 'Keine Verbindung. Bitte Internetverbindung prüfen.';
    return 'Die Rezeptgenerierung ist fehlgeschlagen. Bitte erneut versuchen.';
  }
}
