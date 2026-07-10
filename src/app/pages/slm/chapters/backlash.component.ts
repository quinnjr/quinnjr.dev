import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ChartConfiguration } from 'chart.js';

import { ManifestoChartComponent } from '../../../components/manifesto-chart/manifesto-chart.component';

// Grimoire chart palette, reused from Evidence and Costs for visual
// consistency. Canvas fillStyle can't resolve CSS custom properties, so the
// hex/rgba values are duplicated from src/styles.scss by hand.
const AMBER_FILL = 'rgba(232, 196, 106, 0.85)';
const AMBER_LINE = '#e8c46a';
const ICE_FILL = 'rgba(74, 158, 255, 0.85)';
const ICE_LINE = '#4a9eff';
const EMBER_FILL = 'rgba(226, 88, 34, 0.85)';
const EMBER_LINE = '#e25822';
const MONO_FONT = "'Share Tech Mono', 'Courier New', monospace";
const TICK_COLOR = '#c4b8a0';
const GRID_COLOR = 'rgba(201, 168, 76, 0.15)';

const BASE_BAR_OPTIONS: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: TICK_COLOR, font: { family: MONO_FONT, size: 11 } },
    },
  },
  scales: {
    x: {
      ticks: { color: TICK_COLOR, font: { family: MONO_FONT, size: 10 } },
      grid: { color: GRID_COLOR },
    },
    y: {
      ticks: { color: TICK_COLOR, font: { family: MONO_FONT, size: 10 } },
      grid: { color: GRID_COLOR },
    },
  },
};

@Component({
  selector: 'app-slm-backlash',
  standalone: true,
  imports: [ManifestoChartComponent],
  // Backlash chapter. Mostly straight HTML projected into .manifesto-prose
  // (styled globally): .lede gets the illuminated initial, h2 marks sections.
  // Chart data lives as class fields below, bound into <app-manifesto-chart>.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse V &middot; Backlash</p>
      <h1>Backlash</h1>

      <p class="lede">
        Evidence made the technical case and Costs made the economic one. This chapter makes the
        human case, and it does not require a single argument of my own, because the public has
        already made it, in polling, in layoff data, and in courtrooms. The frontier promised a
        substitute for skilled judgment. The record so far, checked against real coverage rather
        than press releases, shows the substitute failing in public, being walked back in public,
        and, in at least one field I know from the inside, actively sanctioned by judges in public.
      </p>

      <h2>What the public actually thinks</h2>

      <p>
        Pew Research surveyed 5,119 US adults in 2026 and found roughly half now use an AI chatbot,
        up from about a third in 2024. Adoption climbed. Trust did not follow it. Forty percent of
        the same respondents expect AI to make society worse over the next twenty years, and 67
        percent have little to no confidence in the US government's ability to regulate it, up from
        62 percent just two years earlier. Other 2026 polling points the same direction: Quinnipiac
        found 76 percent of Americans trust AI-generated information hardly ever or only some of the
        time, and an Economist and YouGov poll found more than 70 percent of Americans, across party
        lines, think AI is advancing too quickly. People are using this technology more and
        believing it less, at the same time, which is not the trajectory a genuinely trusted
        replacement for human judgment would show.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="sentimentData"
        [options]="barOptions"
        caption="Pew Research, 2026. Adoption is rising. Trust is not."
      />

      <h2>The layoffs that were never really about AI</h2>

      <p>
        AI-attributed layoffs went from roughly 18,000 in 2024 to more than 100,000 in 2025, and the
        first half of 2026 alone topped 150,000, about half again as many as all of 2025 combined.
        As of mid-2026, 56 percent of tracked layoff events, 150 of 267, name AI or automation as a
        cause. The same year, Alphabet, Microsoft, Meta, and Amazon are on track to spend nearly 700
        billion dollars combined on AI infrastructure while cutting tens of thousands of jobs, Meta
        alone cutting roughly 8,000 roles in May with an internal memo tying the cut directly to
        offsetting its own AI capital spending. If AI were actually doing the work these layoffs
        credit it with, that spending and those cuts would move together. They do not survive a
        closer look. A Gartner survey found companies cutting jobs over automation regardless of
        whether the technology was generating any return, and cuts happened at roughly equal rates
        whether the AI in question was working or not. An NBER working paper found 90 percent of
        executives report AI has had zero employment impact at their own firm, even as their own
        companies announce AI-attributed cuts. Cognizant's own chief AI officer put it plainly:
        sometimes AI becomes the scapegoat from a financial perspective. Sam Altman used a blunter
        term for the same pattern: AI washing. What changed in 2026 was not that AI started
        replacing workers. What changed is that executives stopped hiding ordinary cost-cutting
        behind the word restructuring and started hiding it behind the word AI instead.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="layoffData"
        [options]="barOptions"
        caption="AI-attributed layoffs, thousands of workers. 2026 figure is the first six months alone."
      />

      <h2>Ford</h2>

      <p>
        Ford is the clearest case of what happens when the substitution actually gets tried instead
        of just announced. The company had cut 5,300 salaried positions since its 2020 employment
        peak, part of 20,000 white-collar jobs eliminated across Detroit's three automakers over the
        same stretch, and had replaced experienced quality-inspection engineers with an AI system
        meant to do the job for less. The experienced engineers left before their expertise could be
        encoded into the systems meant to replace them, and the AI, trained on nothing of real
        substance, produced an inferior product that cost Ford billions in warranty and recall
        expense. Ford's VP of vehicle hardware engineering, Charles Poon, put the mistake in his own
        words: the company had assumed that introducing AI and adjusting design requirements would,
        on its own, produce quality. It did not. Ford rehired, newly hired, or promoted 350 veteran
        engineers, the ones staff had started calling the gray beards, built a 40-person software QA
        team, and added more than 100,000 AI-powered automated tests, this time with the humans who
        actually knew what failure looked like rebuilding the data pipelines and reprogramming the
        systems they had originally been hired to replace. COO Kumar Galhotra described their value
        directly: they hunt for failure points before a part ever reaches the plant floor. The
        result was not a wash. Ford topped JD Power's initial quality study for the first time in
        sixteen years, and CEO Jim Farley credited the rehiring effort with hundreds of millions of
        dollars in savings on warranty and recall costs alone. Ford did not fail because it tried
        AI. It failed because it tried to remove the judgment AI still cannot supply, found out the
        hard way, and had to pay experienced humans to come back and supply it.
      </p>

      <h2>Where the substitution gets tested hardest: law</h2>

      <p>
        No field makes the limits of current AI more measurable than law, because law has a built-in
        mechanism the rest of the economy lacks: a judge, on the record, checking the work. Lawyer
        Damien Charlotin's public database now tracks more than 1,300 cases globally where a court
        has formally flagged AI-generated hallucinations in a filing, and the sanctions keep
        escalating rather than tapering off as the tools mature. In May 2026, the Alabama Supreme
        Court dismissed an appeal and barred an attorney from filing further briefs without
        co-counsel approval, calling his conduct egregious, after he cited a fabricated precedent,
        was warned, and then cited more nonexistent cases in the very next filing. The same month, a
        federal judge in Oregon imposed the largest AI hallucination penalty in US legal history,
        110,000 dollars, after lawyers submitted 23 fabricated citations and eight invented
        quotations. In March 2026, the Sixth Circuit sanctioned two attorneys in
        <em>Whiting v. City of Athens</em> for more than two dozen fake citations across three
        consolidated appeals, ordering them to reimburse the other side's legal fees, pay double
        costs, the stiffest penalty available under the relevant appellate rule, and 15,000 dollars
        each in punitive sanctions. A Manhattan court went further still in a separate case, ruling
        that a defendant who used a general-purpose chatbot to help build his own defense had waived
        attorney-client privilege over that strategy entirely. Every one of these is a licensed
        attorney, trained for years, using a tool marketed as ready for professional legal work, and
        getting personally sanctioned by a judge for trusting it. That is not a technology on the
        verge of replacing a lawyer. That is a technology a lawyer cannot yet safely delegate to
        without checking every citation by hand.
      </p>

      <p>
        I am not writing that from the outside. I hold a Juris Doctor from the University of Miami
        School of Law and have been a member of the Florida Bar since September 2016, and I have
        spent the last several years as Lead Development Manager and then Acting Chief Technology
        Officer at Lexmata, building the legal-technology platform attorneys and their clients
        actually use. I have sat on both sides of this problem at once, as counsel and as the
        engineer responsible for the AI tooling itself, and both roles teach the same lesson.
        Current models are genuinely useful for a first draft, a structured summary, a starting
        point for research a competent attorney still has to verify line by line. They are not yet
        trustworthy enough to skip that verification, and every sanctioned filing above is what
        happens when someone skips it anyway. A field with this much formal, adversarial,
        judge-supervised checking is the clearest place to see that current AI is not at the stage
        of replacing anyone genuinely competent in their own field. It augments competence. It does
        not yet substitute for it, and the courts keep proving that on the record, one sanctions
        order at a time.
      </p>

      <hr />

      <p>
        None of this argues that AI is useless. It argues against the specific claim this manifesto
        has opposed from its first page: that the technology is mature enough, right now, to justify
        replacing skilled people wholesale, on the strength of a press release rather than a
        verified result. The public does not believe that claim. The layoff numbers built to support
        it do not survive scrutiny. Ford tried it in hardware and had to pay experienced engineers
        to come back. Law tries it every week and produces a sanctions order. The judgment competent
        people supply is still the thing missing, and no amount of scale has supplied it yet.
      </p>

      <h2 class="bibliography-title">Sources</h2>
      <ol class="bibliography">
        <li>
          <cite>Pew Research Center.</cite> "Americans and AI 2026: Chatbots, Smart Devices and
          Views on Impact." June 2026.
          <a
            href="https://www.pewresearch.org/internet/2026/06/17/americans-and-ai-2026-chatbots-smart-devices-and-views-on-impact/"
            target="_blank"
            rel="noopener noreferrer"
            >pewresearch.org</a
          >. Chatbot adoption, expected societal impact, and confidence in AI regulation, from a
          survey of 5,119 US adults.
        </li>
        <li>
          <cite>The Interview Guys.</cite> "56% of 2026 Layoffs Now Blame AI, But the Companies
          Cutting Jobs Are the Same Ones Spending Billions on It." 2026.
          <a
            href="https://blog.theinterviewguys.com/56-of-2026-layoffs-now-blame-ai-but-the-companies-cutting-jobs-are/"
            target="_blank"
            rel="noopener noreferrer"
            >theinterviewguys.com</a
          >. The layoff-attribution data, the hyperscaler spending-versus-cutting figures, and the
          Gartner, NBER, Cognizant, and Altman findings cited above.
        </li>
        <li>
          <cite>Toscano, J.</cite> "Ford Hiring 350 Engineers After AI Failed Shows Human Value In
          AI Era." Forbes, June 2026.
          <a
            href="https://www.forbes.com/sites/joetoscano1/2026/06/30/ford-hiring-350-engineers-after-ai-failed-shows-human-value-in-ai-era/"
            target="_blank"
            rel="noopener noreferrer"
            >forbes.com</a
          >. The Ford quality-engineering failure and rehiring, with the Poon, Galhotra, and Farley
          quotes above.
        </li>
        <li>
          <cite>Fortune.</cite> "Would you hire the lawyer who just got sanctioned for using AI?"
          May 2026.
          <a
            href="https://fortune.com/2026/05/16/ai-hallucinations-legal-sanctions-courtroom-lexisnexis/"
            target="_blank"
            rel="noopener noreferrer"
            >fortune.com</a
          >. The Alabama and Oregon sanctions cases, and Damien Charlotin's 1,300-case hallucination
          database.
        </li>
        <li>
          <cite>Sixth Circuit Appellate Blog.</cite> "Sixth Circuit Sanctions Attorneys for Fake
          Citations, What Does This Mean for Use of AI?" March 2026.
          <a
            href="https://www.sixthcircuitappellateblog.com/recent-cases/sixth-circuit-sanctions-attorneys-for-fake-citations-what-does-this-mean-for-use-of-ai/"
            target="_blank"
            rel="noopener noreferrer"
            >sixthcircuitappellateblog.com</a
          >. <em>Whiting v. City of Athens</em>, the fake-citation count, and the sanctions imposed.
        </li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacklashComponent {
  protected readonly barOptions = BASE_BAR_OPTIONS;

  protected readonly sentimentData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'Use an AI chatbot',
      'Expect AI to worsen society',
      'Little/no confidence in AI regulation',
    ],
    datasets: [
      {
        label: 'Share of US adults, 2026 (%)',
        data: [49, 40, 67],
        backgroundColor: [ICE_FILL, EMBER_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, EMBER_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly layoffData: ChartConfiguration<'bar'>['data'] = {
    labels: ['2024', '2025', '2026 (H1 only)'],
    datasets: [
      {
        label: 'AI-attributed layoffs (thousands of workers)',
        data: [18, 100, 150],
        backgroundColor: [ICE_FILL, AMBER_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, AMBER_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };
}
