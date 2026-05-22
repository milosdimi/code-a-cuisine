import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { RecipeCardComponent } from './recipe-card/recipe-card.component';
import { RecipeService } from '../../core/services/recipe.service';
import { Recipe } from '../../core/models/recipe.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RecipeCardComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.recipeService.generatedRecipes$.subscribe(recipes => {
      if (recipes.length === 0) {
        this.router.navigate(['/generate']);
      } else {
        this.recipes = recipes;
      }
    });
  }

  /** Resets state and sends user back to the ingredient step. */
  startNewSearch(): void {
    this.recipeService.resetState();
    this.router.navigate(['/generate']);
  }
}
