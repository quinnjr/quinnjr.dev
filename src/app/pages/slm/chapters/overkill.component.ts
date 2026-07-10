import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ChartConfiguration } from 'chart.js';

import { ManifestoChartComponent } from '../../../components/manifesto-chart/manifesto-chart.component';
import { ManifestoMathComponent } from '../../../components/manifesto-math/manifesto-math.component';

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

const LOG_SCALE_BAR_OPTIONS: ChartConfiguration<'bar'>['options'] = {
  ...BASE_BAR_OPTIONS,
  scales: {
    x: BASE_BAR_OPTIONS.scales?.['x'],
    y: {
      type: 'logarithmic',
      ticks: { color: TICK_COLOR, font: { family: MONO_FONT, size: 10 } },
      grid: { color: GRID_COLOR },
    },
  },
};

@Component({
  selector: 'app-slm-overkill',
  standalone: true,
  imports: [ManifestoChartComponent, ManifestoMathComponent],
  // Overkill chapter. Mostly straight HTML projected into .manifesto-prose
  // (styled globally): .lede gets the illuminated initial, h2 marks sections.
  // Chart data lives as class fields below, bound into <app-manifesto-chart>.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse VI &middot; Overkill</p>
      <h1>Overkill</h1>

      <p class="lede">
        Claude Code and Codex are the two coding agents most engineers reach for in 2026, and
        neither one runs on a coding model. Both hook into the same trillion-parameter-class,
        AGI-chasing systems this manifesto has argued against since its first page, sold to a
        developer typing shell commands the same way they are sold to someone asking for a poem.
        That is not a coding tool with a general model bolted on for convenience. It is a general
        model wearing a coding tool as a costume, and the costume is expensive.
      </p>

      <h2>The tools are not what they are sold as</h2>

      <p>
        Claude Code runs on the same Opus, Sonnet, and Haiku models available in ordinary Claude
        chat, all sharing the same underlying architecture Anthropic ships to everyone else. Claude
        Code is a harness around that model, not a different model underneath it. OpenAI's Codex CLI
        runs on GPT-5-Codex, and GPT-5-Codex is, by OpenAI's own description, a version of GPT-5
        optimized for agentic coding, a fine-tuned checkpoint of the frontier model rather than a
        distinct smaller architecture trained for code alone. OpenAI's own naming history makes the
        direction of travel explicit. Earlier Codex releases carried version numbers tying them to a
        specific GPT generation. The newest ones dropped that numbering, because the frontier
        general-purpose model had absorbed enough coding capability that a separate specialist tier
        stopped making sense to maintain as its own product. The industry is not moving toward
        smaller, coding-focused models. It is moving the other way, consolidating code into the same
        giant model that also writes marketing copy and argues philosophy, and billing every one of
        those uses at the same trillion-parameter rate.
      </p>

      <h2>What a coding-only model would actually buy</h2>

      <p>
        Definitions already established that inference cost tracks active parameters, not total
        capability. Evidence already showed a real, shipping model, DeepSeek V3, doing serious work
        at 37 billion active parameters against GPT-4's roughly 220 billion, a six-fold gap in the
        compute each query actually needs.
      </p>

      <app-manifesto-math
        [displayMode]="true"
        tex="\\frac{N_{\\text{frontier active}}}{N_{\\text{small active}}} \\approx \\frac{220\\text{B}}{37\\text{B}} \\approx 6\\times"
      />

      <p>
        A coding assistant built on something in that range, rather than on a full frontier model,
        would need roughly a sixth of the compute per query, which means roughly a sixth of the GPUs
        for the same request volume, using this manifesto's own GB200 NVL72 figures from Costs. That
        is the hardware side of the assumption. The reliability side follows from it. Claude's own
        status history in 2026 counts 118 reported outages since January, and a cluster of ten
        separate disruptions inside a single twelve-day span in June alone. The worst of that run,
        on June 2, traced back to Claude Code's own sub-agent system: a bug let sub-agents spawn
        child sub-agents in a loop that never terminated, draining token quotas in minutes and
        taking claude.ai, the API, the developer console, and Claude Code down together for close to
        six hours. Anthropic has not published a post-incident engineering report for that outage or
        the ones that followed it in the same month. A smaller, purpose-built coding model, serving
        one workload instead of sharing capacity with every other use of the same giant model fleet,
        is a simpler system with fewer places for that kind of failure to start, and simpler systems
        are usually the ones that stay up.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="outageData"
        [options]="barOptions"
        caption="Reported Claude service disruptions, 2026. The June cluster shows the pattern accelerating, not settling."
      />

      <p>
        None of this is speculative about whether small models can actually do coding work. Chinese
        open-weight coding models already price the difference into the market today. DeepSeek V4
        Flash runs fourteen cents per million input tokens. Claude Opus 4.8, the model underneath
        Claude Code, runs five dollars, and GPT-5.5, the model family underneath Codex, runs the
        same five dollars. The assumption in this chapter is not a guess about some future
        architecture. It is a description of pricing that already exists, for models already doing
        real coding work, that neither Claude Code nor Codex has adopted.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="codingPriceData"
        [options]="logScaleBarOptions"
        caption="Input price per million tokens, logarithmic scale. The frontier models powering Claude Code and Codex, against a small model already used for coding work."
      />

      <h2>The subsidy that cannot last</h2>

      <p>
        The industry average price per million tokens fell from roughly ten dollars to roughly two
        dollars and fifty cents in a single year, and that collapse was not efficiency alone.
        OpenAI, Anthropic, Google, and Meta are, by their own investors' accounts, pricing inference
        below cost to capture market share, funded by venture capital and hyperscaler cross-subsidy
        rather than by revenue that covers what the compute actually costs.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="priceCollapseData"
        [options]="barOptions"
        caption="Average industry price per million tokens. A 75 percent drop in a year, financed by capital, not by revenue that covers the cost."
      />

      <p>
        OpenAI burned roughly 9 billion dollars in 2025, is projected to burn 17 billion in 2026,
        and is projected to burn 57 billion in 2027, a trajectory climbing faster than its own
        revenue.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="burnData"
        [options]="barOptions"
        caption="OpenAI cash burn, billions of dollars. 2026 and 2027 are the company's own projections."
      />

      <p>
        Anthropic's numbers tell the same story from a stronger starting position. Annualized
        revenue reached roughly 30 billion dollars by April 2026, and the company still spent 2
        dollars and 16 cents for every dollar that revenue brought in. A subsidy this size, run by
        two of the best-funded companies in the world, is not a permanent feature of the market. It
        is a bet that usage will lock in before the bill comes due. When investors eventually demand
        the unit economics close, on Claude Code and Codex specifically as much as on chatbots, the
        honest way to close them is to stop running every coding query through a trillion-parameter
        model billed as if it might also write the next great novel. The dishonest way is to just
        raise the price and hope developers do not notice they are paying frontier rates for
        autocomplete. Chinese open-weight coding models, already priced at a fraction of Claude and
        GPT rates and already competitive on the benchmarks Evidence cited, are sitting there as the
        alternative the moment that price rises. A tool that gets more expensive while a cheaper one
        gets no worse is not a tool that keeps its market by default.
      </p>

      <p>
        I wrote a meaningful share of this manifesto's prose using Claude Code, running Claude
        Sonnet 5, and I find that more amusing than reassuring. A tool built and marketed for
        writing and running code spent real compute drafting paragraphs of political argument about
        server costs and Ford's rehiring numbers, work with nothing to do with a compiler. That is
        not a complaint about the writing help, which was genuinely useful. It is the clearest
        personal proof of this chapter's whole point. A model that drafts prose as comfortably as it
        drafts code was never specialized for either one. It is a generalist doing both jobs at a
        generalist's price, and I paid that price to write a manifesto arguing against paying it.
      </p>

      <hr />

      <p>
        None of this argues that Claude Code or Codex are bad tools. Both are genuinely capable, and
        this manifesto has used one of them to help write itself. It argues that neither tool is
        built the way its own economics call for. A coding assistant priced and sized for coding
        would cost its maker less to run, fail less often, and charge its users less than either
        product does today. The frontier labs are not building that tool because the trillion-
        parameter model already exists and selling access to it is easier than building something
        smaller on purpose. That choice is a subsidy, not a strategy, and subsidies end.
      </p>

      <h2 class="bibliography-title">Sources</h2>
      <ol class="bibliography">
        <li>
          <cite>OpenAI.</cite> "Building more with GPT-5.1-Codex-Max." 2026.
          <a
            href="https://openai.com/index/gpt-5-1-codex-max/"
            target="_blank"
            rel="noopener noreferrer"
            >openai.com</a
          >. OpenAI's own description of Codex models as optimized variants of the GPT-5 frontier
          model, not a separate architecture.
        </li>
        <li>
          <cite>TechTimes.</cite> "Claude Outage: Tenth Disruption in 12 Days Exposes Anthropic
          Infrastructure Strain." June 2026.
          <a
            href="https://www.techtimes.com/articles/318514/20260616/claude-outage-tenth-disruption-12-days-exposes-anthropic-infrastructure-strain.htm"
            target="_blank"
            rel="noopener noreferrer"
            >techtimes.com</a
          >. The June 2026 outage cluster and the 118-incidents-since-January figure.
        </li>
        <li>
          <cite>ninetwothree.</cite> "The Slot Machine That Codes." June 2026.
          <a
            href="https://www.ninetwothree.co/blog/claude-code-loop-economics"
            target="_blank"
            rel="noopener noreferrer"
            >ninetwothree.co</a
          >. The Claude Code sub-agent infinite-loop bug behind the June 2 outage.
        </li>
        <li>
          <cite>AI After Hours.</cite> "OpenAI vs Anthropic: The $121 Billion Question." 2026.
          <a
            href="https://aiafterhours.substack.com/p/openai-vs-anthropic-the-121-billion"
            target="_blank"
            rel="noopener noreferrer"
            >aiafterhours.substack.com</a
          >. OpenAI and Anthropic's 2026 revenue, burn, and cost-per-revenue-dollar figures cited
          above.
        </li>
        <li>
          <cite>Morph.</cite> "Best AI Model for Coding (June 2026): 12 Models Ranked by SWE-bench
          Pro Score and Cost per Task." June 2026.
          <a
            href="https://www.morphllm.com/best-ai-model-for-coding"
            target="_blank"
            rel="noopener noreferrer"
            >morphllm.com</a
          >. The per-token pricing for DeepSeek V4 Flash, Claude Opus 4.8, and GPT-5.5, already
          cited in Evidence.
        </li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverkillComponent {
  protected readonly barOptions = BASE_BAR_OPTIONS;
  protected readonly logScaleBarOptions = LOG_SCALE_BAR_OPTIONS;

  protected readonly priceCollapseData: ChartConfiguration<'bar'>['data'] = {
    labels: ['2025', '2026'],
    datasets: [
      {
        label: 'Average price per million tokens ($)',
        data: [10, 2.5],
        backgroundColor: [ICE_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly outageData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Reported since January 2026', 'Disruptions in one 12-day span (June)'],
    datasets: [
      {
        label: 'Claude service disruptions',
        data: [118, 10],
        backgroundColor: [ICE_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly codingPriceData: ChartConfiguration<'bar'>['data'] = {
    labels: ['DeepSeek V4 Flash', 'Claude Opus 4.8 (Claude Code)', 'GPT-5.5 (Codex)'],
    datasets: [
      {
        label: 'Input $/M tokens',
        data: [0.14, 5, 5],
        backgroundColor: [AMBER_FILL, ICE_FILL, ICE_FILL],
        borderColor: [AMBER_LINE, ICE_LINE, ICE_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly burnData: ChartConfiguration<'bar'>['data'] = {
    labels: ['2025 (actual)', '2026 (projected)', '2027 (projected)'],
    datasets: [
      {
        label: 'OpenAI cash burn ($B)',
        data: [9, 17, 57],
        backgroundColor: [ICE_FILL, AMBER_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, AMBER_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };
}
