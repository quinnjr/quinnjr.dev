import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { absoluteUrl } from '../../services/seo.config';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Resume — Joseph R. Quinn',
      description:
        'Professional background of Joseph R. Quinn: full-stack and systems engineering across Rust, Go, TypeScript, and cloud infrastructure, plus a Juris Doctor and technology-law practice experience.',
      path: '/resume',
      keywords: [
        'Joseph R. Quinn resume',
        'software engineer CV',
        'full-stack engineer resume',
        'attorney software engineer',
      ],
    });

    this.seo.setBreadcrumbs([
      { name: 'Home', path: '/home' },
      { name: 'Resume', path: '/resume' },
    ]);

    this.seo.setJsonLd('page', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': absoluteUrl('/resume'),
      url: absoluteUrl('/resume'),
      name: 'Resume — Joseph R. Quinn',
      inLanguage: 'en-US',
      about: {
        '@type': 'Person',
        name: 'Joseph R. Quinn',
        honorificSuffix: 'Esq.',
        url: absoluteUrl('/home'),
      },
    });
  }
}
