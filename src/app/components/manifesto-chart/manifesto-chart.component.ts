import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { type ChartConfiguration, type ChartData, type ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Chart.js renders to <canvas>, which has no server-side output, so it is
// only mounted in the browser. SSR gets the caption and a static fallback.
@Component({
  selector: 'app-manifesto-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <figure class="manifesto-chart card-stone">
      @if (isBrowser) {
        <div class="manifesto-chart-canvas">
          <canvas baseChart [type]="type" [data]="data" [options]="options"></canvas>
        </div>
      } @else {
        <p class="manifesto-chart-fallback">{{ caption }}</p>
      }
      @if (isBrowser && caption) {
        <figcaption>{{ caption }}</figcaption>
      }
    </figure>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManifestoChartComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @Input() type: ChartType = 'bar';
  @Input() data: ChartData = { labels: [], datasets: [] };
  @Input() options: ChartConfiguration['options'] = {};
  @Input() caption = '';
}
