import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { UserIngredient } from '../../../core/models/ingredient.model';
import { IngredientUnit } from '../../../core/models/recipe.model';

const INGREDIENT_SUGGESTIONS = [
  'Spinat', 'Eier', 'Tomaten', 'Zwiebeln', 'Knoblauch', 'Kartoffeln',
  'Karotten', 'Paprika', 'Brokkoli', 'Zucchini', 'Champignons', 'Hühnerbrust',
  'Hackfleisch', 'Lachs', 'Thunfisch', 'Pasta', 'Reis', 'Linsen', 'Kichererbsen',
  'Butter', 'Sahne', 'Käse', 'Mozzarella', 'Parmesan', 'Olivenöl', 'Zitrone',
  'Basilikum', 'Petersilie', 'Thymian', 'Rosmarin', 'Mehl', 'Milch', 'Joghurt'
];

const UNITS: IngredientUnit[] = ['g', 'kg', 'ml', 'l', 'Stück', 'TL', 'EL'];

@Component({
  selector: 'app-step1-ingredients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './step1-ingredients.component.html',
  styleUrl: './step1-ingredients.component.scss'
})
export class Step1IngredientsComponent implements OnInit {
  ingredients: UserIngredient[] = [];
  searchTerm = '';
  suggestions: string[] = [];
  showSuggestions = false;
  newAmount = 1;
  newUnit: IngredientUnit = 'Stück';
  units = UNITS;
  validationError = '';

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.recipeService.preferences$.subscribe(prefs => {
      if (prefs?.ingredients?.length) {
        this.ingredients = [...prefs.ingredients];
      }
    });
  }

  /**
   * Filters the suggestion list based on the current search term.
   * Hides suggestions already in the ingredient list.
   */
  onSearchInput(): void {
    if (this.searchTerm.trim().length < 1) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    const existing = this.ingredients.map(i => i.name.toLowerCase());
    this.suggestions = INGREDIENT_SUGGESTIONS
      .filter(s => s.toLowerCase().includes(term) && !existing.includes(s.toLowerCase()))
      .slice(0, 6);
    this.showSuggestions = this.suggestions.length > 0;
  }

  /** Selects a suggestion from the dropdown. */
  selectSuggestion(name: string): void {
    this.searchTerm = name;
    this.showSuggestions = false;
  }

  /** Adds the current input as a new ingredient if valid. */
  addIngredient(): void {
    const name = this.searchTerm.trim();
    if (!name) return;
    if (this.ingredients.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      this.validationError = 'Diese Zutat wurde bereits hinzugefügt.';
      return;
    }
    this.ingredients.push({ name, amount: this.newAmount, unit: this.newUnit });
    this.searchTerm = '';
    this.newAmount = 1;
    this.newUnit = 'Stück';
    this.suggestions = [];
    this.validationError = '';
  }

  /** Removes an ingredient by index. */
  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
  }

  /** Validates the form and navigates to the preferences step. */
  goToPreferences(): void {
    if (this.ingredients.length === 0) {
      this.validationError = 'Bitte füge mindestens eine Zutat hinzu.';
      return;
    }
    this.recipeService.updatePreferences({ ingredients: this.ingredients });
    this.router.navigate(['/preferences']);
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }
}
