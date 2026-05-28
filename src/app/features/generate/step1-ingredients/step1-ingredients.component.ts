import { Component, OnInit, HostListener } from '@angular/core';
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
  imports: [FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './step1-ingredients.component.html',
  styleUrl: './step1-ingredients.component.scss'
})
export class Step1IngredientsComponent implements OnInit {
  ingredients: UserIngredient[] = [];
  searchTerm = '';
  suggestions: string[] = [];
  showSuggestions = false;
  showUnitDropdown = false;
  newAmount = 1;
  newUnit: IngredientUnit = 'Stück';
  units = UNITS;
  validationError = '';

  editingIndex: number | null = null;
  editName = '';
  editAmount = 1;
  editUnit: IngredientUnit = 'Stück';
  editNameError = false;

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
    if (!name) {
      this.validationError = 'Please enter an ingredient name.';
      return;
    }
    if (this.ingredients.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      this.validationError = 'This ingredient has already been added.';
      return;
    }
    const amount = Math.min(Math.max(0.1, this.newAmount), 9999);
    this.ingredients.push({ name, amount, unit: this.newUnit });
    this.searchTerm = '';
    this.newAmount = 1;
    this.newUnit = 'Stück';
    this.suggestions = [];
    this.validationError = '';
  }

  /** Removes an ingredient by index. */
  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
    if (this.editingIndex === index) this.editingIndex = null;
  }

  startEdit(index: number, ing: UserIngredient): void {
    this.editingIndex = index;
    this.editName = ing.name;
    this.editAmount = ing.amount;
    this.editUnit = ing.unit;
    this.validationError = '';
  }

  saveEdit(index: number): void {
    const name = this.editName.trim();
    if (!name) {
      this.editNameError = true;
      return;
    }
    const amount = Math.min(Math.max(0.1, this.editAmount), 9999);
    this.ingredients[index] = { name, amount, unit: this.editUnit };
    this.editingIndex = null;
    this.editNameError = false;
  }

  /** Validates the form and navigates to the preferences step. */
  goToPreferences(): void {
    if (this.ingredients.length === 0) {
      this.validationError = 'Please add at least one ingredient.';
      return;
    }
    this.recipeService.updatePreferences({ ingredients: this.ingredients });
    this.router.navigate(['/preferences']);
  }

  clearError(): void {
    this.validationError = '';
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  selectUnit(unit: IngredientUnit): void {
    this.newUnit = unit;
    this.showUnitDropdown = false;
  }

  hideUnitDropdown(): void {
    setTimeout(() => { this.showUnitDropdown = false; }, 150);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.step1__search-wrap')) {
      this.showSuggestions = false;
    }
    if (!target.closest('.step1__unit-wrap')) {
      this.showUnitDropdown = false;
    }
  }
}
