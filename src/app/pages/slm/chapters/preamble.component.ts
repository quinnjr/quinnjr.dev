import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-preamble',
  standalone: true,
  // Placeholder prose — replace the copy, keep the structure (.lede gets the
  // illuminated initial, ol.tenets gets numbered verses). Styled globally.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse I &middot; Preamble</p>
      <h1>Preamble</h1>
      <p class="lede">
        Here begins the manifesto. This opening passage is a placeholder, awaiting its true words —
        but it earns the illuminated initial all the same, so the shape of the page can be judged
        before the prose arrives.
      </p>
      <p>
        Replace this paragraph with the case for small language models: why modest weights, run
        close to the work, beat distant leviathans for the tasks that matter here.
      </p>
      <blockquote>A placeholder creed, to be sharpened into a real one.</blockquote>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreambleComponent {}
