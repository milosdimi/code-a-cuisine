import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { SeoService } from '../../../core/services/seo.service';
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
const MAX_INGREDIENTS = 14;

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
  showEditUnitDropdown = false;
  newAmount = 1;
  newUnit: IngredientUnit = 'Stück';
  units = UNITS;
  validationError = '';

  editingIndex: number | null = null;
  editName = '';
  editAmount = 1;
  editUnit: IngredientUnit = 'Stück';
  editNameError = false;
  editError = '';
  editUnitDropdownPos = { top: 0, left: 0, width: 0, openUp: false };

  private editUnitButton: HTMLElement | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo        = inject(SeoService);

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  /** Restores any previously entered ingredients from shared preferences state. */
  ngOnInit(): void {
    this.seo.setPage({ title: 'Add Ingredients', description: 'Tell us what\'s in your fridge — we\'ll create 3 personalized recipes for you.' });
    this.recipeService.preferences$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(prefs => {
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
    if (this.ingredients.length >= MAX_INGREDIENTS) {
      this.validationError = `You can add up to ${MAX_INGREDIENTS} ingredients.`;
      return;
    }
    const amount = Math.min(Math.max(0.1, this.newAmount), 9999);
    this.ingredients.push({ name, amount, unit: this.newUnit });
    this.recipeService.updatePreferences({ ingredients: this.ingredients });
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
    this.recipeService.updatePreferences({ ingredients: this.ingredients });
  }

  /** Opens the inline edit form for an existing ingredient at the given index. */
  startEdit(index: number, ing: UserIngredient): void {
    this.editingIndex = index;
    this.editName = ing.name;
    this.editAmount = ing.amount;
    this.editUnit = ing.unit;
    this.showUnitDropdown = false;
    this.closeEditUnitDropdown();
    this.validationError = '';
    this.editError = '';

    setTimeout(() => {
      document.querySelector('.step1__chip--editing')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /** Persists the edited ingredient to the list if the name is valid. */
  saveEdit(index: number): void {
    const name = this.editName.trim();
    if (!name) {
      this.editNameError = true;
      this.editError = 'Please enter an ingredient name.';
      return;
    }
    const isDuplicate = this.ingredients.some(
      (ing, i) => i !== index && ing.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      this.editNameError = true;
      this.editError = 'This ingredient has already been added.';
      return;
    }
    const amount = Math.min(Math.max(0.1, this.editAmount), 9999);
    this.ingredients[index] = { name, amount, unit: this.editUnit };
    this.recipeService.updatePreferences({ ingredients: this.ingredients });
    this.editingIndex = null;
    this.editNameError = false;
    this.editError = '';
    this.closeEditUnitDropdown();
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

  /** Clears the current validation error message. */
  clearError(): void {
    this.validationError = '';
  }

  /** Closes the autocomplete dropdown after a short delay to allow click events to fire first. */
  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  /** Sets the selected unit and closes the unit dropdown. */
  selectUnit(unit: IngredientUnit): void {
    this.newUnit = unit;
    this.showUnitDropdown = false;
  }

  /** Toggles the edit-unit dropdown and anchors it with fixed positioning. */
  toggleEditUnitDropdown(event: MouseEvent): void {
    event.stopPropagation();

    if (this.showEditUnitDropdown) {
      this.closeEditUnitDropdown();
      return;
    }

    this.showUnitDropdown = false;
    this.editUnitButton = event.currentTarget as HTMLElement;
    this.showEditUnitDropdown = true;
    this.updateEditUnitDropdownPosition();
  }

  /** Repositions the edit dropdown to stay attached to its trigger button. */
  updateEditUnitDropdownPosition(): void {
    if (!this.editUnitButton || !this.showEditUnitDropdown) return;

    const rect = this.editUnitButton.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      this.closeEditUnitDropdown();
      return;
    }

    const listHeight = this.units.length * 40 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < listHeight && rect.top > listHeight;

    this.editUnitDropdownPos = {
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp
    };
  }

  /** Closes the edit-unit dropdown and clears its anchor button. */
  closeEditUnitDropdown(): void {
    this.showEditUnitDropdown = false;
    this.editUnitButton = null;
  }

  /** Sets the unit while editing an existing ingredient. */
  selectEditUnit(unit: IngredientUnit): void {
    this.editUnit = unit;
    this.closeEditUnitDropdown();
  }

  /** Keeps the edit dropdown aligned while the ingredient list scrolls. */
  onListScroll(): void {
    this.updateEditUnitDropdownPosition();
  }

  /** Closes the unit dropdown after a short delay to allow click events to fire first. */
  hideUnitDropdown(): void {
    setTimeout(() => { this.showUnitDropdown = false; }, 150);
  }

  /** Closes open dropdowns when a click occurs outside their container elements. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.step1__search-wrap')) {
      this.showSuggestions = false;
    }
    if (!target.closest('[data-unit-dropdown="add"]')) {
      this.showUnitDropdown = false;
    }
    if (!target.closest('[data-unit-dropdown="edit"]')) {
      this.closeEditUnitDropdown();
    }
  }

  /** Re-anchors the edit dropdown on page scroll or resize. */
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.updateEditUnitDropdownPosition();
  }
}
