import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/hero/hero.component').then(m => m.HeroComponent)
  },
  {
    path: 'generate',
    loadComponent: () =>
      import('./features/generate/step1-ingredients/step1-ingredients.component').then(
        m => m.Step1IngredientsComponent
      )
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./features/generate/step2-preferences/step2-preferences.component').then(
        m => m.Step2PreferencesComponent
      )
  },
  {
    path: 'loading',
    loadComponent: () =>
      import('./features/generate/loading/loading.component').then(m => m.LoadingComponent)
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./features/results/results.component').then(m => m.ResultsComponent)
  },
  {
    path: 'recipe/:id',
    loadComponent: () =>
      import('./features/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  },
  {
    path: 'cookbook',
    loadComponent: () =>
      import('./features/cookbook/cookbook.component').then(m => m.CookbookComponent)
  },
  {
    path: 'cookbook/:style',
    loadComponent: () =>
      import('./features/cuisine-recipes/cuisine-recipes.component').then(
        m => m.CuisineRecipesComponent
      )
  },
  {
    path: 'legal',
    loadComponent: () =>
      import('./shared/components/legal/legal.component').then(m => m.LegalComponent)
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./shared/components/privacy/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];