import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-principles',
  standalone: true,
  template: `
    <h1 class="text-2xl font-bold mb-4">Principles</h1>
    <p class="text-gray-300">Placeholder content. Draft this chapter later.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinciplesComponent {}
