import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ChartConfiguration } from 'chart.js';

import { ManifestoChartComponent } from '../../../components/manifesto-chart/manifesto-chart.component';

// Grimoire chart palette: amber for the Chinese open-weight labs this
// chapter is arguing for, ice for the Western frontier labs it is arguing
// against. Canvas fillStyle can't resolve CSS custom properties, so the
// hex/rgba values are duplicated from src/styles.scss by hand.
const AMBER_FILL = 'rgba(232, 196, 106, 0.85)';
const AMBER_LINE = '#e8c46a';
const ICE_FILL = 'rgba(74, 158, 255, 0.85)';
const ICE_LINE = '#4a9eff';
const MONO_FONT = "'Share Tech Mono', 'Courier New', monospace";
const TICK_COLOR = '#c4b8a0';
const LABEL_GEMINI = 'Gemini 3.1 Pro';
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
  selector: 'app-slm-evidence',
  standalone: true,
  imports: [ManifestoChartComponent],
  // Evidence chapter. Mostly straight HTML projected into .manifesto-prose
  // (styled globally): .lede gets the illuminated initial, h2 marks sections.
  // Chart data lives as class fields below, bound into <app-manifesto-chart>.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse III &middot; Evidence</p>
      <h1>Evidence</h1>

      <p class="lede">
        A thesis this blunt deserves a test, not just an argument. The cleanest one running right
        now is not a small model against a large one. It is the open-weight Chinese labs against the
        Western frontier: less capital, chips a generation behind and deliberately throttled by
        export controls, and architectures built for efficiency rather than scale for its own sake,
        measured against Anthropic, OpenAI, and Google on the same public benchmarks. As of June
        2026, that test is not going the way the trillion-parameter story predicts it should.
      </p>

      <h2>The numbers</h2>

      <p>
        On BenchLM's June 2026 composite ranking, DeepSeek V4 Pro tops the Chinese field at 87,
        against Gemini 3.1 Pro at 93, GPT-5.4 Pro at 92, and Claude Opus 4.6 at 88. A six-point gap
        to the best closed model and a one-point gap to the third-best is not parity, but it is a
        long way from the gap a model trained on restricted hardware for a fraction of the budget
        was supposed to leave.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="compositeScoreData"
        [options]="barOptions"
        caption="BenchLM composite benchmark score, June 2026. Amber: Chinese open-weight models. Ice: Western frontier models."
      />

      <p>
        On SWE-bench Verified, the benchmark the field treats as the closest thing to a real coding
        exam, DeepSeek V4 Pro Max scored 80.6 percent in June 2026, tied exactly with Gemini 3.1
        Pro's 80.6 percent, with Kimi K2.6 close behind at 80.2 percent and Qwen3.7 Max at 80.4
        percent. Claude Opus 4.8 and GPT-5.5 still lead that benchmark outright, at 88.6 and 88.7
        percent. But a Chinese open-weight model tying one of the three labs this manifesto names as
        the frontier, on the benchmark that matters most for the work this manifesto cares about, is
        not a footnote. On vendor and third-party tracked SWE-bench Pro numbers, GLM-5.2 has been
        reported at 62.1 percent, ahead of GPT-5.5's own reported 58.6 percent. Code Arena's agentic
        web-development leaderboard, tracking 67 models as of April 2026, places GLM-5.1 third in
        the world and Kimi K2.6 sixth.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="sweBenchData"
        [options]="barOptions"
        caption="SWE-bench Verified score, June 2026. Amber: Chinese open-weight models. Ice: Western frontier models."
      />

      <h2>The price</h2>

      <p>
        None of that competitiveness costs what frontier inference costs. DeepSeek V4 Flash prices
        at fourteen cents per million input tokens and twenty-eight cents per million output tokens.
        Claude Opus 4.8 prices at five dollars and twenty-five dollars for the same. GPT-5.5 runs
        five dollars and thirty dollars. Gemini 3.1 Pro runs two dollars and twelve dollars. A model
        tying or trailing the frontier by single digits on the hardest available coding benchmark,
        at roughly a thirtieth to a hundredth of the price per token, is the unit economics this
        manifesto's case for small and efficient models rests on, demonstrated at a scale no single
        engineer's benchmark could prove on its own.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="pricingData"
        [options]="pricingOptions"
        caption="Price per million tokens, June 2026, logarithmic scale. Amber: Chinese open-weight model. Ice: Western frontier models."
      />

      <h2>The capital, and the hardware it had to work with</h2>

      <p>
        The headline number attached to DeepSeek's rise was 5.6 million dollars, the GPU cost of the
        V3 pretraining run, plus 294,000 dollars for the R1 reinforcement learning pass. That figure
        is true and also misleading, in the way a single line item is misleading when presented as a
        whole budget. A more careful accounting puts DeepSeek's total server capital expenditure
        near 1.6 billion dollars and its operating costs near 944 million dollars, with hardware
        spending alone exceeding 500 million dollars over the company's history once research,
        failed runs, and infrastructure are counted rather than just the final successful training
        run. That correction matters, and it cuts both ways. It is intellectually dishonest to wave
        away DeepSeek's cost advantage as a marketing number. It is just as dishonest to repeat the
        marketing number as the whole truth. The honest comparison is harder and more favorable to
        this manifesto's case than either: a company that has spent on the order of a few billion
        dollars in total, competing against labs that have raised, between them, tens of billions of
        dollars in venture capital to reach a similar place on the scoreboard.
      </p>

      <p>
        That capital gap exists despite a hardware gap working against the Chinese labs, not for
        them. DeepSeek trained V3 on Nvidia H800 chips, a version of the H100 deliberately degraded
        to comply with US export controls, and has been reported using restricted H100s and H20s
        alongside them because the legal supply was not enough on its own. DeepSeek's own CEO, Liang
        Wenfeng, has said publicly that Chinese labs need two to four times the computing power to
        match what an unrestricted lab can do with modern Nvidia hardware. Huawei's Ascend chips,
        the domestic alternative Beijing is now pushing with a 295 billion dollar plan to build a
        computing grid that excludes Nvidia almost entirely, deliver only around sixty percent of an
        H100's performance for inference, and by DeepSeek's own evaluation are not yet good enough
        to train a frontier-class model on at all. Older chips, fewer of them, a fraction of the
        legal supply, and a domestic replacement that is not ready. That is the hardware budget
        behind a model now tying a Google frontier release on the field's hardest public coding
        benchmark.
      </p>

      <h2>What the trillion-parameter frontier actually spent</h2>

      <p>
        The other half of this comparison deserves the same rigor applied to it. No frontier lab has
        published the architecture or parameter count of its current models. OpenAI's own GPT-4
        Technical Report says outright that it withholds "further details about the architecture
        (including model size)... due to the competitive landscape and the safety implications," and
        the GPT-4o System Card that followed it a year later is a safety document, not an
        engineering one. Everything below this point is leak and informed estimate, not OpenAI
        disclosure, and it is presented that way.
      </p>

      <p>
        The trillion-parameter figure belongs to the original GPT-4, not GPT-4o. A widely cited
        SemiAnalysis report from July 2023 described GPT-4 as a mixture-of-experts model exceeding
        one trillion parameters in total, commonly cited at 1.8 trillion across 16 experts of
        roughly 111 billion each, with around 220 billion of those parameters active on any single
        forward pass, trained on roughly 13 trillion tokens. GPT-4o, released the following year, is
        widely believed to be far smaller. Independent estimates converge on something closer to 200
        billion total parameters, judged mostly by its sharply lower price per token and faster
        response time relative to the original model, with GPT-4o mini separately estimated around 8
        billion. OpenAI has confirmed none of these figures.
      </p>

      <p>
        The training run behind the larger, trillion-parameter GPT-4 is the one with public numbers
        attached to it, and a rough check holds up against them. Counting only the 220 billion
        active parameters as the ones doing work on each token, the standard compute estimate of six
        times parameters times training tokens puts that run at roughly 1.7 times ten to the
        twenty-fifth floating point operations. Spread across an A100 cluster running at a realistic
        35 percent of peak throughput, that works out to roughly 44 million GPU-hours, close enough
        to the figure reported elsewhere, 25,000 GPUs run for 90 to 100 days, around 55 to 57
        million GPU-hours, to treat both as the same neighborhood. At a cluster power draw near 25
        megawatts sustained for that stretch, the run consumed somewhere around 50 to 60
        gigawatt-hours of electricity, enough to power several thousand homes for a year, for one
        training run of one model. At roughly one to two dollars an hour for that much A100 time,
        the run cost on the order of 60 to 110 million dollars. Sam Altman has himself acknowledged,
        in public remarks the same month reporters first floated the 100 million dollar figure, that
        the true number was higher, not lower, and that he already considered the era of simply
        building bigger models to be ending.
      </p>

      <p>
        That is the spending this manifesto is arguing against, confirmed close enough by the
        founder's own account, for one model, one training run, before a single dollar of inference,
        staffing, or the failed runs that never made it into a press release. Measured against that,
        a team spending a few billion dollars in total, training on chips a generation behind, and
        tying the result on a real public benchmark, is not the underdog story it is usually told
        as. It is the more disciplined one.
      </p>

      <hr />

      <p>
        None of this proves small models win every argument. It proves the bigger one: that capital
        and chip count were never the only path to competence, and a team with less of both has
        already shown, in public, on benchmarks anyone can check, how much further efficiency can
        carry a model than the frontier labs' own roadmaps assume.
      </p>

      <h2 class="bibliography-title">Sources</h2>
      <ol class="bibliography">
        <li>
          <cite>BenchLM.</cite> "Best Chinese LLMs in 2026: DeepSeek V4, Kimi K2.6, GLM-5, Qwen, and
          Every Model Ranked." June 2026.
          <a
            href="https://benchlm.ai/blog/posts/best-chinese-llm"
            target="_blank"
            rel="noopener noreferrer"
            >benchlm.ai</a
          >. The composite benchmark ranking placing DeepSeek V4 Pro, GLM-5.1, Kimi K2.6, and
          Qwen3.5 against Gemini, GPT, and Claude.
        </li>
        <li>
          <cite>Morph.</cite> "Best AI Model for Coding (June 2026): 12 Models Ranked by SWE-bench
          Pro Score and Cost per Task." June 2026.
          <a
            href="https://www.morphllm.com/best-ai-model-for-coding"
            target="_blank"
            rel="noopener noreferrer"
            >morphllm.com</a
          >. The SWE-bench Verified and SWE-bench Pro scores, and the per-token pricing, cited
          above.
        </li>
        <li>
          <cite>SemiAnalysis.</cite> "DeepSeek Debates: Chinese Leadership On Cost, True Training
          Cost, Closed Model Margin Impacts." 2025.
          <a
            href="https://newsletter.semianalysis.com/p/deepseek-debates"
            target="_blank"
            rel="noopener noreferrer"
            >newsletter.semianalysis.com</a
          >. The fuller accounting of DeepSeek's total capital expenditure and operating costs
          behind the headline training-run figure.
        </li>
        <li>
          <cite>Center for Strategic and International Studies.</cite> "DeepSeek, Huawei, Export
          Controls, and the Future of the U.S.-China AI Race." 2025.
          <a
            href="https://www.csis.org/analysis/deepseek-huawei-export-controls-and-future-us-china-ai-race"
            target="_blank"
            rel="noopener noreferrer"
            >csis.org</a
          >. The chip restrictions DeepSeek trained under, Liang Wenfeng's public comments on the
          compute penalty, and Huawei Ascend's current limits for training.
        </li>
        <li>
          <cite>OpenAI.</cite> "GPT-4 Technical Report." 2023.
          <a href="https://arxiv.org/abs/2303.08774" target="_blank" rel="noopener noreferrer"
            >arXiv:2303.08774</a
          >. States directly that architecture, model size, hardware, and training compute are
          withheld from the report.
        </li>
        <li>
          <cite>OpenAI.</cite> "GPT-4o System Card." 2024.
          <a href="https://arxiv.org/abs/2410.21276" target="_blank" rel="noopener noreferrer"
            >arXiv:2410.21276</a
          >. A safety and evaluation document. Contains no architecture or parameter disclosure.
        </li>
        <li>
          <cite>Patel, D. and Wong, G.</cite> "GPT-4 Architecture, Infrastructure, Training Dataset,
          Costs, Vision, MoE." SemiAnalysis, July 2023.
          <a
            href="https://newsletter.semianalysis.com/p/gpt-4-architecture-infrastructure"
            target="_blank"
            rel="noopener noreferrer"
            >newsletter.semianalysis.com</a
          >. The original leak behind the widely cited 1.8 trillion parameter, mixture-of-experts
          estimate for the original GPT-4.
        </li>
        <li>
          <cite>Fortune.</cite> "OpenAI's Sam Altman says giant A.I. models not necessary." April
          2023.
          <a
            href="https://fortune.com/2023/04/18/openai-sam-altman-llm-size-elon-musk-truthgpt-eu/"
            target="_blank"
            rel="noopener noreferrer"
            >fortune.com</a
          >. Reports Altman's remarks on GPT-4's training cost and the end of scale-first model
          design, from an MIT event the same month.
        </li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceComponent {
  protected readonly barOptions = BASE_BAR_OPTIONS;

  protected readonly compositeScoreData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'DeepSeek V4 Pro',
      'GLM-5.1',
      'Kimi K2.6',
      'Qwen3.5',
      'Claude Opus 4.6',
      'GPT-5.4 Pro',
      LABEL_GEMINI,
    ],
    datasets: [
      {
        label: 'BenchLM composite score',
        data: [87, 83, 81, 79, 88, 92, 93],
        backgroundColor: [
          AMBER_FILL,
          AMBER_FILL,
          AMBER_FILL,
          AMBER_FILL,
          ICE_FILL,
          ICE_FILL,
          ICE_FILL,
        ],
        borderColor: [AMBER_LINE, AMBER_LINE, AMBER_LINE, AMBER_LINE, ICE_LINE, ICE_LINE, ICE_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly sweBenchData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'DeepSeek V4 Pro Max',
      LABEL_GEMINI,
      'Qwen3.7 Max',
      'Kimi K2.6',
      'Claude Opus 4.8',
      'GPT-5.5',
    ],
    datasets: [
      {
        label: 'SWE-bench Verified (%)',
        data: [80.6, 80.6, 80.4, 80.2, 88.6, 88.7],
        backgroundColor: [AMBER_FILL, ICE_FILL, AMBER_FILL, AMBER_FILL, ICE_FILL, ICE_FILL],
        borderColor: [AMBER_LINE, ICE_LINE, AMBER_LINE, AMBER_LINE, ICE_LINE, ICE_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly pricingData: ChartConfiguration<'bar'>['data'] = {
    labels: ['DeepSeek V4 Flash', LABEL_GEMINI, 'Claude Opus 4.8', 'GPT-5.5'],
    datasets: [
      {
        label: 'Input $/M tokens',
        data: [0.14, 2, 5, 5],
        backgroundColor: AMBER_FILL,
        borderColor: AMBER_LINE,
        borderWidth: 1,
      },
      {
        label: 'Output $/M tokens',
        data: [0.28, 12, 25, 30],
        backgroundColor: ICE_FILL,
        borderColor: ICE_LINE,
        borderWidth: 1,
      },
    ],
  };

  protected readonly pricingOptions: ChartConfiguration<'bar'>['options'] = {
    ...BASE_BAR_OPTIONS,
    scales: {
      x: BASE_BAR_OPTIONS?.scales?.['x'],
      y: {
        type: 'logarithmic',
        ticks: { color: TICK_COLOR, font: { family: MONO_FONT, size: 10 } },
        grid: { color: GRID_COLOR },
      },
    },
  };
}
