import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {}
