import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CuisineFilterComponent } from './cuisine-filter/cuisine-filter.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { Recipe, CookingStyle } from '../../core/models/recipe.model';

const PAGE_SIZE = 20;

const STYLE_LABELS: Record<string, string> = {
  german:   'Deutsche Küche',  italian:  'Italienische Küche',
  japanese: 'Japanische Küche', indian:   'Indische Küche',
  gourmet:  'Gourmet',          fusion:   'Fusion'
};

const STYLE_ROUTE_MAP: Record<string, CookingStyle> = {
  italian: 'italian', german: 'german', japanese: 'japanese',
  indian: 'indian', gourmet: 'gourmet', fusion: 'fusion'
};

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, CuisineFilterComponent],
  templateUrl: './cookbook.component.html',
  styleUrl: './cookbook.component.scss'
})
export class CookbookComponent implements OnInit {
  recipes: Recipe[] = [];
  activeFilter: CookingStyle | 'all' = 'all';
  isLoading = true;
  error = '';
  page = 1;
  hasMore = false;

  constructor(
    private firebase: FirebaseService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const styleParam = this.route.snapshot.paramMap.get('style');
    if (styleParam && STYLE_ROUTE_MAP[styleParam]) {
      this.activeFilter = STYLE_ROUTE_MAP[styleParam];
    }
    this.loadRecipes();
  }

  onFilterChange(filter: CookingStyle | 'all'): void {
    this.activeFilter = filter;
    this.recipes = [];
    this.page = 1;
    this.loadRecipes();
  }

  loadMore(): void {
    this.page++;
    this.loadRecipes(true);
  }

  styleLabel(style: string): string {
    return STYLE_LABELS[style] ?? style;
  }

  private loadRecipes(append = false): void {
    this.isLoading = true;
    const style = this.activeFilter === 'all' ? undefined : this.activeFilter;

    this.firebase.getRecipes(PAGE_SIZE, undefined, style).subscribe({
      next: recipes => {
        this.recipes = append ? [...this.recipes, ...recipes] : recipes;
        this.hasMore = recipes.length === PAGE_SIZE;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Rezepte konnten nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }
}
