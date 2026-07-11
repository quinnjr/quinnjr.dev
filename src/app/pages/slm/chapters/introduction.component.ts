import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-introduction',
  standalone: true,
  // Opening chapter of the manifesto. Mostly straight HTML projected into
  // .manifesto-prose (styled globally): .lede gets the illuminated initial,
  // h2 marks sections, blockquote and hr punctuate.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse I &middot; Introduction</p>
      <h1>Introduction</h1>

      <p class="lede">
        For more than a decade the high temples of machine intelligence have promised a god. Pour in
        capital without limit, they say, scale the weights into the trillions, and somewhere beyond
        the horizon a general mind will wake and repay every coin spent summoning it. The horizon
        has not drawn nearer. It has only grown more expensive to stare at.
      </p>

      <p>
        This is the manifesto of the lesser machine-spirits, a case against that promise and for a
        humbler, sharper craft. I hold that the pursuit of artificial general intelligence has been,
        and remains, a misallocation of money, talent, and electricity on a historic scale. It is an
        enterprise that overpromises without cease, consumes without profit, and mistakes the size
        of a model for the worth of it.
      </p>

      <h2>The trillion-parameter mirage</h2>

      <p>
        The frontier labs, Anthropic and OpenAI chief among them, have staked their futures on a
        single wager. They believe intelligence is a function of scale, and that a model large
        enough, trained on enough of the world, will cross some threshold into general competence.
        Each generation costs an order of magnitude more than the last. Each is sold as the
        penultimate step. None has produced a business that earns more than it burns, and none has
        come any closer to the general mind it was built to reach. The losses are not a phase to be
        grown out of. They are the shape of the thing. A system built to be all things to all users
        is, by construction, the most expensive possible way to do any single one of them.
      </p>

      <blockquote>
        Scale is not a strategy. It is a bill that arrives every quarter and never comes due.
      </blockquote>

      <h2>The case for the small</h2>

      <p>
        Against the leviathan I set the small language model, a system measured in millions and
        billions of parameters rather than trillions, cheap enough to run close to the work it
        serves and on considerably less expense in hardware, and to tune for the task that actually
        pays. What such a model gives up in breadth it returns many times over in cost, latency,
        privacy, and control. A model that fits on a single machine, that answers in milliseconds,
        that can be shaped to a domain and audited by the team that owns it, is not a consolation
        prize for those who cannot afford the frontier. It is the better instrument, and for the
        overwhelming majority of real work, it is the only one whose economics ever close.
      </p>

      <p>
        The frontier sells generality that almost no one needs at a price almost no one can sustain.
        The small model sells competence at a price that turns a profit, and there is nothing modest
        about an ambition that actually pays for itself.
      </p>

      <h2>Where the coin should flow</h2>

      <p>
        So here is my thesis, plainly stated. The capital now fed into the AGI furnace, the venture
        money chasing a mind that will not arrive, the research bent toward ever-larger pretraining
        runs, should be turned instead toward small models and toward the reasoning methods that
        make them punch far above their weight. The frontier's own results have shown the lever.
        Careful reasoning at inference time can lift a modest model past a far larger one that
        merely answers from reflex. The leverage was never in another order of magnitude of
        parameters. It was in teaching small spirits to think before they speak.
      </p>

      <p>
        What follows sets out the principles of that craft and the practice of it. The age of the
        trillion-parameter god is ending, not because anyone willed it, but because the arithmetic
        was never on its side. What comes after is smaller, faster, closer to the work, and for the
        first time, solvent.
      </p>

      <hr />

      <p>Read on, and reckon the cost.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroductionComponent {}
