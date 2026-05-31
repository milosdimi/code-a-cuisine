import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { Recipe } from '../../core/models/recipe.model';

interface LikedRecipe extends Recipe {
  heartCount: number;
}

const TIME_MINUTES: Record<string, string> = {
  quick: 'up to 20min', medium: '25-40min', elaborate: '45+ min'
};

const MOCK_LIKED: LikedRecipe[] = [
  { id: 'mock-1', title: 'Spaghetti Carbonara',    cookingStyle: 'italian',  cookingTime: 'quick',     servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 24 },
  { id: 'mock-2', title: 'Classic Potato Soup',    cookingStyle: 'german',   cookingTime: 'medium',    servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 18 },
  { id: 'mock-3', title: 'Vegetable Miso Ramen',   cookingStyle: 'japanese', cookingTime: 'medium',    servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 15 },
  { id: 'mock-4', title: 'Butter Chicken Masala',  cookingStyle: 'indian',   cookingTime: 'elaborate', servings: 4, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 12 },
  { id: 'mock-5', title: 'Fusion Teriyaki Bowl',   cookingStyle: 'fusion',   cookingTime: 'quick',     servings: 2, ingredients: [], missingIngredients: [], steps: [], nutrition: { caloriesPerPortion: 0, proteinG: 0, carbsG: 0, fatG: 0 }, helpers: [], createdAt: new Date(), heartCount: 9  },
];

const CUISINES = [
  { style: 'italian',  label: 'Italian',  emoji: '🤌', image: 'assets/images/cookbook/italian.png' },
  { style: 'german',   label: 'German',   emoji: '🍻', image: 'assets/images/cookbook/german.png'  },
  { style: 'japanese', label: 'Japanese', emoji: '🍜', image: 'assets/images/cookbook/japan.png'   },
  { style: 'gourmet',  label: 'Gourmet',  emoji: '🤌', image: 'assets/images/cookbook/gourmet.png' },
  { style: 'indian',   label: 'Indian',   emoji: '🍛', image: 'assets/images/cookbook/indian.png'  },
  { style: 'fusion',   label: 'Fusion',   emoji: '🍢', image: 'assets/images/cookbook/fusion.png'  },
];

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent implements OnInit {
  likedRecipes: LikedRecipe[] = MOCK_LIKED;
  readonly cuisines = CUISINES;

  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.firebase.getRecipes(20).subscribe({
      next: recipes => {
        if (recipes.length > 0) {
          const sorted = recipes
            .map(r => ({ ...r, heartCount: (r as any)['heartCount'] ?? 0 }))
            .sort((a, b) => b.heartCount - a.heartCount)
            .slice(0, 5) as LikedRecipe[];
          this.likedRecipes = sorted.length > 0 ? sorted : MOCK_LIKED;
        }
      },
      error: () => {
        this.likedRecipes = MOCK_LIKED;
      }
    });
  }

  cookingTimeLabel(t: string): string {
    return TIME_MINUTES[t] ?? t;
  }

  navigateToCuisine(style: string): void {
    this.router.navigate(['/cookbook', style]);
  }

  startNewSearch(): void {
    this.router.navigate(['/generate']);
  }

  goBack(): void {
    window.history.back();
  }
}
