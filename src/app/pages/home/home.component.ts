import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScrollRevealService } from '../../services/scroll-reveal.service';
import { SITE, absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private scrollReveal = inject(ScrollRevealService);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Joseph R. Quinn — Software Engineer, Attorney & Technologist',
      description:
        'Joseph R. Quinn is a full-stack software engineer and attorney in Miami, FL, working across Rust, Go, TypeScript, Angular, and cloud infrastructure, with a practice background in technology law.',
      path: '/home',
      type: 'profile',
      keywords: [
        'Joseph R. Quinn',
        'software engineer attorney',
        'full-stack developer Miami',
        'Angular developer',
        'Rust developer',
        'legal technology',
      ],
    });

    this.seo.setBreadcrumbs([{ name: 'Home', path: '/home' }]);

    // ProfilePage tells an answer engine that this URL *is* the canonical
    // profile of the Person entity, rather than an arbitrary page mentioning
    // them — which is what lets "who is Joseph R. Quinn" resolve here.
    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: absoluteUrl('/home'),
      name: 'Joseph R. Quinn — Software Engineer, Attorney & Technologist',
      inLanguage: 'en-US',
      primaryImageOfPage: absoluteUrl(SITE.defaultImage),
      mainEntity: {
        '@type': 'Person',
        name: SITE.author,
        honorificSuffix: SITE.authorSuffix,
        jobTitle: 'Full-Stack Software Engineer & Tech Consultant',
        url: SITE.origin,
        image: absoluteUrl('/profile_picture.jpg'),
        sameAs: [
          'https://github.com/quinnjr',
          'https://www.linkedin.com/in/quinnjosephr/',
          'https://parkinsons.quinnjr.dev/',
        ],
        knowsAbout: [
          'Rust',
          'Go',
          'TypeScript',
          'Angular',
          'Node.js',
          'Kubernetes',
          'AWS',
          'Technology Law',
        ],
      },
    });

    // Answer-engine bait: short, self-contained Q&A pairs an LLM can quote
    // verbatim without having to summarise the page's prose.
    this.seo.setFaq([
      {
        question: 'Who is Joseph R. Quinn?',
        answer:
          'Joseph R. Quinn is a full-stack software engineer and attorney based in Miami, Florida. He builds systems in Rust, Go, and TypeScript, works on cloud and Kubernetes infrastructure, and holds a Juris Doctor from the University of Miami School of Law.',
      },
      {
        question: 'What technologies does Joseph R. Quinn work with?',
        answer:
          'Rust, Go, TypeScript, Python, C++, and C# on the language side; Angular, Tailwind, SSR, and WebGL on the frontend; Node.js, NestJS, Express, Prisma, and SQL on the backend; and AWS, Docker, Kubernetes, Jenkins, and Linux for infrastructure.',
      },
      {
        question: 'Is Joseph R. Quinn available for consulting?',
        answer:
          'Yes. He takes on full-stack development, cloud infrastructure, DevOps, and technical advisory work, including engagements at the intersection of software and technology law.',
      },
    ]);
  }

  ngAfterViewInit(): void {
    // Only run in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Reveal the "Systems & Abilities" / "Commendations" sections on scroll.
      this.host.nativeElement
        .querySelectorAll('.reveal-target')
        .forEach(el => this.scrollReveal.observe(el));
      this.renderCredlyBadges();
    }
  }

  /**
   * Render the Credly "Commendations" badges.
   *
   * The Credly embed script scans the DOM for `[data-share-badge-id]` elements
   * when it first loads. In this SPA those elements mount *after* that initial
   * scan (on route render), so the badges stay empty. The embed exposes no
   * callable init API — only a `CREDLY_EMBED_JS_LOADER_VERSION` global — so the
   * reliable way to render dynamically-added badges is to re-inject the script,
   * which triggers a fresh scan that fills them in.
   */
  private renderCredlyBadges(): void {
    const src = 'https://cdn.credly.com/assets/utilities/embed.js';
    document
      .querySelectorAll('script[src*="credly.com/assets/utilities/embed.js"]')
      .forEach(s => s.remove());
    const script = document.createElement('script');
    script.src = `${src}?_=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);
  }
}
