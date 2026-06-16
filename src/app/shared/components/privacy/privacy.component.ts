import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setPage({ title: 'Privacy Policy' });
  }

  /** Navigates to the previous browser history entry. */
  goBack(): void { window.history.back(); }
}
