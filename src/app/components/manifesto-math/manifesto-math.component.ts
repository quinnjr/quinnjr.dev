import { ChangeDetectionStrategy, Component, Input, type OnChanges, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

// KaTeX renders synchronously to a static HTML string on both server and
// client, unlike Chart.js, so this needs no platform-browser guard. The
// output is KaTeX's own markup, not user input, so trusting it is safe.
@Component({
  selector: 'app-manifesto-math',
  standalone: true,
  template: `<span
    class="manifesto-math"
    [class.is-display]="displayMode"
    [innerHTML]="rendered"
  ></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManifestoMathComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() tex = '';
  @Input() displayMode = false;

  protected rendered: SafeHtml = '';

  ngOnChanges(): void {
    const html = katex.renderToString(this.tex, {
      displayMode: this.displayMode,
      throwOnError: false,
      output: 'html',
    });
    this.rendered = this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
