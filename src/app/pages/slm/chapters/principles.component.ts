import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-principles',
  standalone: true,
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse II &middot; Principles</p>
      <h1>Principles</h1>
      <p class="lede">
        The tenets. Placeholder wording for now, structured as numbered verses so the manifesto
        reads as a creed rather than a wall of text.
      </p>
      <ol class="tenets">
        <li>First tenet — placeholder. State a principle small and sharp enough to argue with.</li>
        <li>Second tenet — placeholder. Each verse should stand alone and mean something.</li>
        <li>Third tenet — placeholder. Replace freely; the numbering tends itself.</li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinciplesComponent {}
