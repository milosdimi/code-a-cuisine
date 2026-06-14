import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  private seo = inject(SeoService);

  /** Sets the SEO page title for the hero landing page. */
  ngOnInit(): void {
    this.seo.setPage({ title: 'Code à Cuisine' });
  }
}
