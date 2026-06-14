import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { RecipeService } from '../../../core/services/recipe.service';
import { UserPreferences } from '../../../core/models/preferences.model';
import { LoadingPopupComponent } from './loading-popup/loading-popup.component';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [LoadingPopupComponent],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit, OnDestroy {
  showPopup = false;
  errorTitle  = '';
  errorMessage = '';
  private subs = new Subscription();

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.recipeService.preferences$.pipe(take(1)).subscribe(prefs => {
        if (prefs) {
          this.startGeneration(prefs);
        } else {
          this.router.navigate(['/preferences']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private startGeneration(prefs: UserPreferences): void {
    this.subs.add(
      this.recipeService.generateRecipes(prefs).subscribe({
        next: () => this.router.navigate(['/results']),
        error: (err: any) => {
          const status: number = err.httpStatus ?? -1;
          if (status === 429) {
            this.errorTitle   = 'Daily limit reached';
            this.errorMessage = "You've used all 3 free recipe generations for today. Check the cookbook for your saved recipes, or come back tomorrow!";
          } else if (status === 0) {
            this.errorTitle   = 'Connection failed';
            this.errorMessage = "We couldn't reach the recipe generator. Please check your internet connection and try again.";
          } else if (status === -1) {
            this.errorTitle   = 'Generation failed';
            this.errorMessage = 'Recipe generation failed. Please try again.';
          } else if (status === -2) {
            this.errorTitle   = 'Ingredient not supported';
            this.errorMessage = err.message;
          } else {
            this.errorTitle   = 'Ups! Not quite enough...';
            this.errorMessage = "It looks like some ingredient quantities aren't sufficient for your selected servings. Please add or adjust quantities and try again.";
          }
          this.showPopup = true;
          this.cdr.markForCheck();
        }
      })
    );
  }

  onPopupClosed(): void {
    this.showPopup = false;
    this.router.navigate(['/generate']);
  }
}
