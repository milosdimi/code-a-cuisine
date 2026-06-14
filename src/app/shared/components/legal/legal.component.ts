import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.scss'
})
export class LegalComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setPage({ title: 'Legal Notice' });
  }
}
