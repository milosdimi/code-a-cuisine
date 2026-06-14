import { Routes } from '@angular/router';
import { HeroComponent }              from './features/hero/hero.component';
import { Step1IngredientsComponent }  from './features/generate/step1-ingredients/step1-ingredients.component';
import { Step2PreferencesComponent }  from './features/generate/step2-preferences/step2-preferences.component';
import { LoadingComponent }           from './features/generate/loading/loading.component';
import { ResultsComponent }           from './features/results/results.component';
import { RecipeDetailComponent }      from './features/recipe-detail/recipe-detail.component';
import { CookbookComponent }          from './features/cookbook/cookbook.component';
import { CuisineRecipesComponent }    from './features/cuisine-recipes/cuisine-recipes.component';
import { LegalComponent }             from './shared/components/legal/legal.component';
import { PrivacyComponent }           from './shared/components/privacy/privacy.component';
import { NotFoundComponent }          from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '',                component: HeroComponent             },
  { path: 'generate',        component: Step1IngredientsComponent  },
  { path: 'preferences',     component: Step2PreferencesComponent  },
  { path: 'loading',         component: LoadingComponent           },
  { path: 'results',         component: ResultsComponent           },
  { path: 'recipe/:id',      component: RecipeDetailComponent      },
  { path: 'cookbook',        component: CookbookComponent          },
  { path: 'cookbook/:style', component: CuisineRecipesComponent     },
  { path: 'legal',           component: LegalComponent             },
  { path: 'privacy',        component: PrivacyComponent           },
  { path: '**',              component: NotFoundComponent          }
];
