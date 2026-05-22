import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { RecipeService } from '../../../core/services/recipe.service';
import { UserPreferences } from '../../../core/models/preferences.model';

const LOADING_MESSAGES = [
  'Deine Zutaten werden analysiert…',
  'Claude kocht mit…',
  'Rezeptideen werden entwickelt…',
  'Nährwerte werden berechnet…',
  'Die besten 3 Rezepte werden ausgewählt…',
  'Fast fertig – noch einen Moment…'
];

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit, OnDestroy {
  currentMessage = LOADING_MESSAGES[0];
  errorMessage = '';
  private msgIndex = 0;
  private subs = new Subscription();

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      interval(2500).subscribe(() => {
        this.msgIndex = (this.msgIndex + 1) % LOADING_MESSAGES.length;
        this.currentMessage = LOADING_MESSAGES[this.msgIndex];
      })
    );

    this.recipeService.preferences$.subscribe(prefs => {
      if (prefs) this.startGeneration(prefs);
    });
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
