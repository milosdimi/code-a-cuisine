import { Component, OnInit, OnDestroy } from '@angular/core';
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
  private subs = new Subscription();

  constructor(
    private recipeService: RecipeService,
    private router: Router
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
        error: () => {
          this.showPopup = true;
        }
      })
    );
  }

  onPopupClosed(): void {
    this.showPopup = false;
  }
}
