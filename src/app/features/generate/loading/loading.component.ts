import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RecipeService } from '../../../core/services/recipe.service';
import { UserPreferences } from '../../../core/models/preferences.model';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit, OnDestroy {
  errorMessage = '';
  private subs = new Subscription();

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.recipeService.preferences$.subscribe(prefs => {
        if (prefs) this.startGeneration(prefs);
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
        error: (err: Error) => {
          this.errorMessage = err.message;
        }
      })
    );
  }

  retry(): void {
    this.errorMessage = '';
    this.router.navigate(['/preferences']);
  }
}
