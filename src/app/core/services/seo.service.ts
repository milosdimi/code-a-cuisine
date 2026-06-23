import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

const SITE = 'Code à Cuisine';
const DEFAULT_DESC =
  'AI-powered recipe generator — enter your ingredients, get 3 personalized recipes in seconds.';
const DEFAULT_ORIGIN = 'https://cuisine.dimit.cc';
const DEFAULT_IMAGE = '/assets/images/logo-cuisine.webp';

/** Page-level SEO configuration passed to {@link SeoService.setPage}. */
export interface PageSeoConfig {
  title: string;
  description?: string;
  /** Absolute or site-relative image URL for Open Graph / Twitter cards. */
  image?: string;
}

/**
 * Updates document title and meta tags (description, Open Graph, Twitter) per route.
 * Static defaults live in `index.html`; this service keeps them in sync on client navigation.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);

  /**
   * Sets the page title and refreshes description, Open Graph, and Twitter meta tags.
   * @param cfg - Page title and optional description / share image.
   */
  setPage(cfg: PageSeoConfig): void {
    const fullTitle = cfg.title === SITE ? SITE : `${cfg.title} — ${SITE}`;
    const desc = cfg.description ?? DEFAULT_DESC;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN;
    const url = typeof window !== 'undefined' ? window.location.href : origin;
    const image = this.resolveImage(cfg.image, origin);

    this.titleSvc.setTitle(fullTitle);

    this.metaSvc.updateTag({ name: 'description', content: desc });

    this.metaSvc.updateTag({ property: 'og:type', content: 'website' });
    this.metaSvc.updateTag({ property: 'og:site_name', content: SITE });
    this.metaSvc.updateTag({ property: 'og:locale', content: 'en_US' });
    this.metaSvc.updateTag({ property: 'og:title', content: fullTitle });
    this.metaSvc.updateTag({ property: 'og:description', content: desc });
    this.metaSvc.updateTag({ property: 'og:image', content: image });
    this.metaSvc.updateTag({ property: 'og:image:alt', content: fullTitle });
    this.metaSvc.updateTag({ property: 'og:url', content: url });

    this.metaSvc.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaSvc.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaSvc.updateTag({ name: 'twitter:description', content: desc });
    this.metaSvc.updateTag({ name: 'twitter:image', content: image });
    this.metaSvc.updateTag({ name: 'twitter:image:alt', content: fullTitle });
  }

  /** Builds an absolute image URL from a relative asset path or passes through absolute URLs. */
  private resolveImage(image: string | undefined, origin: string): string {
    const path = image ?? DEFAULT_IMAGE;
    return path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}