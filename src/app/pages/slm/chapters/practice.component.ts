import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-practice',
  standalone: true,
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse IV &middot; Practice</p>
      <h1>Practice</h1>
      <p class="lede">
        Where the creed meets the keyboard. Placeholder text — this chapter turns the principles
        into things you actually do.
      </p>
      <h2>In the small</h2>
      <p>Replace with concrete practice: how to pick, run, and trust a small model day to day.</p>
      <hr />
      <p>End of the seeded manuscript. Three verses, awaiting their real ink.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeComponent {}
