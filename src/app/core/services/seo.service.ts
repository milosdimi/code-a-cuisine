import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

const SITE = 'Code à Cuisine';
const DEFAULT_DESC = 'AI-powered recipe generator — enter your ingredients, get 3 personalized recipes in seconds.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleSvc = inject(Title);
  private metaSvc  = inject(Meta);

  setPage(cfg: { title: string; description?: string }): void {
    const fullTitle = cfg.title === SITE ? SITE : `${cfg.title} — ${SITE}`;
    const desc = cfg.description ?? DEFAULT_DESC;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cuisine.dimit.cc';
    const url    = typeof window !== 'undefined' ? window.location.href  : origin;

    this.titleSvc.setTitle(fullTitle);
    this.metaSvc.updateTag({ name: 'description',        content: desc });
    this.metaSvc.updateTag({ property: 'og:title',       content: fullTitle });
    this.metaSvc.updateTag({ property: 'og:description', content: desc });
    this.metaSvc.updateTag({ property: 'og:image',       content: `${origin}/assets/images/logo-cuisine.png` });
    this.metaSvc.updateTag({ property: 'og:url',         content: url });
  }
}
