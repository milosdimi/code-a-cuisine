import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-cuisine-recipes',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './cuisine-recipes.component.html',
  styleUrl: './cuisine-recipes.component.scss'
})
export class CuisineRecipesComponent {}
