import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type ChartConfiguration } from 'chart.js';

import { ManifestoChartComponent } from '../../../components/manifesto-chart/manifesto-chart.component';
import { ManifestoMathComponent } from '../../../components/manifesto-math/manifesto-math.component';

// Grimoire chart palette, reused from the Evidence chapter for visual
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
  selector: 'app-slm-costs',
  standalone: true,
  imports: [ManifestoChartComponent, ManifestoMathComponent, RouterLink],
  // Costs chapter. Mostly straight HTML projected into .manifesto-prose
  // (styled globally): .lede gets the illuminated initial, h2 marks sections.
  // Chart data lives as class fields below, bound into <app-manifesto-chart>.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse IV &middot; Costs</p>
      <h1>Costs</h1>

      <p class="lede">
        Evidence totaled what training runs cost. This chapter goes underneath that, to the physical
        plant the whole industry runs on: what a server costs, what a rack costs, what a megawatt of
        datacenter costs to build, what it costs to keep that megawatt cool, and what it costs to
        store the data a frontier model trains on. None of these figures are leaks. They are list
        prices, industry capex surveys, and a research model built for exactly this purpose, current
        as of mid-2026.
      </p>

      <h2>The servers</h2>

      <p>
        A single Nvidia H200 GPU runs 28,000 to 45,000 dollars depending on the variant. An
        eight-GPU HGX H200 server, the way these chips actually ship, runs 370,000 to 400,000
        dollars typical, once the NVLink fabric, network interface cards, and integration are
        counted alongside the GPUs themselves, near 46,000 dollars per GPU. The current rack-scale
        system, the GB200 NVL72, prices at 2.8 to 3.4 million dollars for the hardware alone, near
        3.9 million dollars all in with networking and storage, for 72 GPUs in one rack. Divide that
        out and the fully integrated cost lands near 54,000 dollars per GPU, higher than the
        eight-GPU box rather than lower. Scaling up bought more compute, not a cheaper GPU. The cost
        of tying that many chips together at that density is itself a line item, and it grows with
        the rack.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="perGpuCostData"
        [options]="barOptions"
        caption="Fully integrated cost per GPU, mid-2026. Higher density did not mean a cheaper chip."
      />

      <h2>The chips that are not for sale</h2>

      <p>
        Google's TPUs are the other path to this kind of compute, and they are not purchasable
        hardware at all. TPU v6e, Trillium, prices at 2.70 dollars per chip-hour on demand, 1.89
        dollars per chip-hour on a one-year commitment, through Google Cloud and nowhere else. TPU
        v7, Ironwood, is specified publicly, 4,614 FP8 teraflops, 192 gigabytes of HBM3E memory,
        7.37 terabytes per second of memory bandwidth, but as of this writing Google has not
        published a per-chip price for it. There is no rack anyone can buy. Whatever efficiency
        Google's own silicon buys, and the architecture suggests it buys a real amount, stays inside
        Google Cloud, rented by the hour, never sold.
      </p>

      <h2>The lament of ARM64</h2>

      <p>
        Buy an x86 server today and the market works the way a market should. Dell, HPE, Supermicro,
        Lenovo, and a half dozen others compete to put a chassis around two competing CPU lines,
        AMD's EPYC and Intel's Xeon, and that competition shows up in the price. Try to buy a
        general-purpose ARM64 server on the same open market and the choice collapses to one CPU
        vendor, Ampere, whose AmpereOne and Altra lines are the only general-purpose ARM silicon
        most buyers can actually purchase. The OEMs building chassis around that one chip are
        Supermicro, Gigabyte, ASRock Rack, IEIT, and BYD. HPE, Wiwynn, and Dell, despite earlier
        involvement with Ampere's parts, are not currently on that list at all.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-3">[3]</a></sup
        >
        Nvidia sells its own ARM64 Grace CPU, but only bundled into Grace-Hopper and Grace-Blackwell
        GPU systems, never as a standalone chassis choice the way an EPYC or a Xeon is. And the ARM
        silicon doing the most for efficiency right now, AWS's Graviton, Google's Axion, and
        Microsoft's Cobalt, reportedly up to 20 percent cheaper and 60 percent more energy-efficient
        than comparable x86 instances, is not for sale under any terms.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-5">[5]</a></sup
        >
        It is proprietary to the cloud that built it, unavailable to anyone trying to run their own
        infrastructure outside the three hyperscalers that designed it for themselves. An industry
        that wants efficient, small-model-friendly hardware to actually proliferate is choosing
        between a competitive x86 market and an ARM64 market that is, in practice, one chip vendor,
        a handful of OEMs reselling that one chip, and the most efficient silicon of all locked
        behind someone else's login.
      </p>

      <p>
        This is the part of the lament that actually costs money. An IDC survey cited in late 2025
        found 86 percent of CIOs planning to repatriate at least some workload from the public cloud
        back to infrastructure they own, AI spending named as a leading driver, enterprises looking
        at their own GPU and inference bills and asking whether owning the iron would cost less than
        renting someone else's.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-7">[7]</a></sup
        >
        ARM64's well-documented energy advantage, up to 60 percent less power for comparable work,
        is exactly the kind of saving a repatriation decision should be able to capture. It mostly
        cannot. An enterprise repatriating onto x86 buys into a real, competitive retail market. An
        enterprise that wants to repatriate onto ARM64 instead finds one CPU vendor, a handful of
        OEMs, and a missing chassis from most of the names that would normally sell it to them,
        while the ARM silicon actually proven to save the most energy sits inside the very clouds
        that enterprise is trying to leave. The hardware gap this chapter laments shows up as a real
        line item: enterprises paying x86's power bill, on their own premises, for want of a market
        that would sell them the cheaper alternative.
      </p>

      <h2>What each architecture actually burns</h2>

      <p>
        The lament above is about who sells the hardware. This is about what running it costs in
        electricity once bought, and the three architectures do not sort into a close race.
        Cloudflare's own edge fleet gives a clean, apples-to-apples comparison, since the company
        has published production numbers for both its x86 and ARM generations against the same older
        baseline. AMD's Milan generation of EPYC chips, the newer x86 fleet, delivers 39 percent
        more internet requests per watt than the prior Rome generation.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-4">[4]</a></sup
        >
        Cloudflare's Ampere-designed ARM fleet, built in the same window, delivers 57 percent more
        requests per watt over that same Rome baseline, ahead of x86's own next generation rather
        than behind it.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-4">[4]</a></sup
        >
        AWS makes the identical claim at cloud scale directly: Graviton instances use up to 60
        percent less energy than a comparable x86 EC2 instance for the same performance.<sup
          class="citation"
          ><a [routerLink]="[]" fragment="costs-src-5">[5]</a></sup
        >
        Two independent companies, at two different layers of the internet, measured the same
        result.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="architectureEfficiencyData"
        [options]="barOptions"
        caption="Requests per watt, Cloudflare's edge fleet, gain over the same 2019-era x86 baseline. RISC-V omitted: no independently verified figure exists yet."
      />

      <p>
        RISC-V is, on paper, the most efficient architecture of the three, since an open instruction
        set lets a designer strip out every piece of silicon a given workload does not need rather
        than carry decades of x86 or ARM legacy along for compatibility. SiFive's P870-D core scales
        to 256 coherent cores on exactly that promise, and the company markets it directly at
        datacenter power budgets.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-6">[6]</a></sup
        >
        But it is still a promise rather than a measured result. No independently benchmarked
        performance-per-watt figure for a shipping, general-purpose RISC-V server chip exists in the
        way Cloudflare's and AWS's numbers exist for ARM, and Ventana, the vendor furthest along on
        a general-purpose RISC-V server core, has already slipped its first Veyron chip past its
        original ship date once. RISC-V may well win this comparison eventually. It has not yet had
        the chance to prove it in production the way ARM already has.
      </p>

      <h2>What it costs to build the room</h2>

      <p>
        Three figures describe the same kind of spending, measured three different ways. JLL's 2026
        industry survey puts an ordinary datacenter build at 8 to 12 million dollars per megawatt,
        and an AI-optimized facility, built for the power density and cooling a GPU cluster needs,
        at 15 to 20 million dollars per megawatt or more, for the building, power infrastructure,
        and cooling alone, before a single server goes in a rack.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-9">[9]</a></sup
        >
        Epoch AI's 2026 research model for a full one-gigawatt AI campus, sized around a fleet of
        GB200 NVL72 racks, puts the fully loaded figure, building, power, cooling, networking, and
        the servers themselves together, at 38 billion dollars up front, 38 million dollars per
        megawatt.<sup class="citation"><a [routerLink]="[]" fragment="costs-src-1">[1]</a></sup> The
        gap between that number and the construction-only figures above is the compute. The
        computers, not the building, make up most of the bill on a gigawatt-scale AI campus.
        Amortized over a five-year hardware lifespan and a fourteen-year facility lifespan, the same
        model puts the campus's annual cost of ownership, capital and operating combined, near 8.5
        billion dollars a year, 8.5 million dollars per megawatt per year, of which servers and
        network infrastructure alone account for roughly 5 billion of that annual figure.<sup
          class="citation"
          ><a [routerLink]="[]" fragment="costs-src-1">[1]</a></sup
        >
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="datacenterCostData"
        [options]="barOptions"
        caption="Cost per megawatt, mid-2026. Standard and AI-optimized figures cover building and power infrastructure only. The gigawatt-campus figure includes the servers themselves, which is why it is highest."
      />

      <h2>Power and cooling</h2>

      <p>
        How that megawatt gets cooled changes its running cost as much as its construction cost.
        Air-cooled facilities run a power usage effectiveness, the ratio of total facility power to
        the power the computers themselves use, of 1.4 to 1.6, meaning cooling and overhead burn 40
        to 60 percent as much electricity as the compute it is cooling. Liquid cooling brings that
        down to 1.10 to 1.20. Immersion cooling, dunking the hardware directly in a dielectric
        fluid, gets a GPU-dense cluster to 1.03 to 1.08. The infrastructure to do that is not free,
        liquid cooling alone adds upward of 1.1 million dollars per megawatt to a build, but for a
        100 megawatt facility, the efficiency gap between air and liquid cooling is worth 30 to 50
        million dollars a year in electricity not spent.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="pueData"
        [options]="barOptions"
        caption="Power usage effectiveness by cooling method, mid-2026. Lower is better. 1.0 would mean zero overhead."
      />

      <p>
        Epoch AI's gigawatt model prices the energy itself, separate from the cooling that moves it,
        at 0.6 billion dollars a year.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-1">[1]</a></sup
        >
        Treated as a full gigawatt running close to continuously across a year, that implies a price
        near seven cents per kilowatt-hour.
      </p>

      <app-manifesto-math
        [displayMode]="true"
        tex="\\frac{\\$0.6\\text{B}}{1\\text{ GW} \\times 8760\\text{ h}} \\approx \\$0.068/\\text{kWh}"
      />

      <p>
        That price is already moving. PJM, the grid operator covering much of the mid-Atlantic and
        Midwest, saw its capacity price for the 2025-26 service period jump 9.3 times over, from 29
        dollars per megawatt-day to 270 dollars per megawatt-day, with some locations closer to
        450.<sup class="citation"><a [routerLink]="[]" fragment="costs-src-8">[8]</a></sup> PJM and
        the utilities involved point to forecasted datacenter load as the driver. Residents in PJM's
        territory are projected to see their electricity bills rise roughly 15 percent in 2026
        against the pre-datacenter-boom baseline.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-8">[8]</a></sup
        >
        The price per kilowatt-hour a frontier lab pays today is not the price it will pay once the
        grid it is straining finishes passing that strain through to everyone connected to it.
      </p>

      <h2>Storing the petabytes</h2>

      <p>
        Raw hard disk capacity, the cheapest medium available and still the right economic answer
        for nearline archive tiers, runs 20 to 25 dollars per terabyte in 2026, near 25,000 dollars
        for a full petabyte of raw drives. A single 42U rack can hold roughly a petabyte of that HDD
        capacity for about 25,000 dollars, or roughly four petabytes of faster QLC SSD capacity for
        about 1.2 million dollars, twelve times the cost per petabyte for the speed. Once
        redundancy, power, management, and a realistic multi-year operating window are counted
        rather than just the drives, a single petabyte's fully loaded cost on premises runs closer
        to 1.3 million dollars. Definitions already put GPT-4's training corpus near 13 trillion
        tokens and DeepSeek V3's near 14.8 trillion. Tokenized text itself is compact, a few bytes a
        token, so the cleaned corpus a model actually trains on can be a modest number of terabytes.
        The real storage footprint of a training run is larger than that figure alone, by a wide
        margin. It has to hold the raw, uncleaned data the corpus was filtered down from, the model
        checkpoints saved at intervals across a months-long run, each one a multi-terabyte snapshot
        of every parameter at trillion-parameter scale, and the optimizer state sitting alongside
        each checkpoint, often two to four times the size of the model itself for the optimizers
        this kind of training actually uses. A frontier run's storage bill runs well past the size
        of its finished dataset: add the discarded majority of what was scraped to build that
        dataset, add a running history of the model's own intermediate states, and petabytes,
        plural, becomes the realistic unit for the whole pile.
      </p>

      <h2>What it costs to train one, bottom-up</h2>

      <p>
        Put the pieces in this chapter together and a frontier-class training cluster prices out two
        different ways, and the gap between those two ways is the lesson. Public discussion of a
        current frontier run puts the cluster size at 50,000 to 100,000 GPUs, a figure no lab has
        confirmed on the record. Multiply the high end of that range by this chapter's own
        fully-integrated GB200 NVL72 price, near 54,000 dollars per GPU, and the hardware alone
        prices near 5.4 billion dollars.
      </p>

      <app-manifesto-math
        [displayMode]="true"
        tex="100{,}000 \\times \\$54{,}000 \\approx \\$5.4\\text{B (hardware only)}"
      />

      <p>
        That number almost certainly overstates what one training run actually costs, for the same
        reason DeepSeek's headline figure understated what its company actually spent. A fleet of
        100,000 GPUs is not bought, used once, and retired. It trains many models across years of
        operation, and it serves inference traffic in between. Spreading its cost over a single run,
        rather than the years of work that fleet performs, inflates the figure the same way ignoring
        a fleet's full lifetime deflates DeepSeek's. Epoch AI's published cost model for named
        frontier models puts hardware at 47 to 67 percent of a training run's total cost, with staff
        and energy making up the rest, and finds frontier training budgets growing 2.4 times a year
        since 2016, crossing half a billion dollars in 2025 and heading toward one to three billion
        dollars by 2027.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-2">[2]</a></sup
        >
        That trajectory, built independently of anything in this manifesto, lands in the same place
        this chapter's own numbers point to from underneath: somewhere in the high hundreds of
        millions to low billions of dollars for a single 2026 frontier run, and rising. Introduction
        called this a bill that arrives every quarter and never comes due. This chapter is what that
        bill is actually made of, megawatt by megawatt, rack by rack, petabyte by petabyte.
      </p>

      <h2>What I pay instead</h2>

      <p>
        Every figure above describes someone else's bill. Mine is easy to put a number on by
        comparison. The DGX Spark in my closet, the same one running the Qwen coding model mentioned
        in Evidence, draws a peak of 240 watts and, measured under real inference load on an
        identical unit, an average closer to 50.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-10">[10]</a></sup
        >
        Left running for a year at the 2026 national average US residential rate, 18.7 cents a
        kilowatt-hour, that is somewhere between 82 dollars a year at realistic load and 393 dollars
        a year if it ran flat out, continuously, all year, which it does not.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-11">[11]</a></sup
        >
        Add the 3,999 dollar purchase price as a one-time cost and the first year runs a little over
        4,000 dollars.<sup class="citation"
          ><a [routerLink]="[]" fragment="costs-src-10">[10]</a></sup
        >
        Every year after that runs under 400.
      </p>

      <app-manifesto-math
        [displayMode]="true"
        tex="50\\text{ W} \\times 8760\\text{ h} \\times \\$0.187/\\text{kWh} \\approx \\$82/\\text{yr}"
      />

      <p>
        Epoch AI's gigawatt campus, the same model cited earlier in this chapter, prices the energy
        alone, not the building, not the servers, just the electricity, at 0.6 billion dollars a
        year.<sup class="citation"><a [routerLink]="[]" fragment="costs-src-1">[1]</a></sup> That is
        roughly 1.5 million times what my closet costs to run at the worst-case, continuous-peak
        estimate, and more than 7 million times what it costs running the way it actually runs. Put
        the frontier and the small machine in my closet on the same chart and the scale itself stops
        meaning anything useful. They are different kinds of expense entirely.
      </p>

      <app-manifesto-chart
        [type]="'bar'"
        [data]="closetVsCampusData"
        [options]="logScaleBarOptions"
        caption="Annual energy cost, logarithmic scale. A personal DGX Spark, realistic load, against Epoch AI's one-gigawatt AI campus model."
      />

      <hr />

      <p>
        None of the figures in this chapter required a leak. They are what the industry itself
        publishes, sells, and surveys, added up in the open. The trillion-parameter frontier is not
        expensive because someone is hiding the bill. It is expensive because the bill is exactly
        this large, in public, for anyone willing to do the arithmetic.
      </p>

      <h2 class="bibliography-title">Sources</h2>
      <ol class="bibliography">
        <li id="costs-src-1">
          <cite>Epoch AI.</cite> "Total cost of ownership of a one-gigawatt AI data center." May
          2026.
          <a
            href="https://epoch.ai/data-insights/ai-datacenter-cost-breakdown"
            target="_blank"
            rel="noopener noreferrer"
            >epoch.ai</a
          >. The gigawatt-campus cost model: 38 billion dollars up front, 8.5 billion dollars a year
          amortized, assuming a GB200 NVL72 fleet.
        </li>
        <li id="costs-src-2">
          <cite
            >Cottier, B., Rahman, R., Fattorini, L., Maslej, N., Besiroglu, T., and Owen, D.</cite
          >
          "The Rising Costs of Training Frontier AI Models." 2024, revised 2025.
          <a href="https://arxiv.org/abs/2405.21015" target="_blank" rel="noopener noreferrer"
            >arXiv:2405.21015</a
          >. The cost-composition model (hardware, staff, energy) and the 2.4x-per-year training
          cost growth trend cited above.
        </li>
        <li id="costs-src-3">
          <cite>ServeTheHome.</cite> "Ampere AmpereOne Pricing and SKU List with Current OEM
          Partners." 2026.
          <a
            href="https://www.servethehome.com/ampere-ampereone-pricing-and-sku-list-with-current-oem-partners-supermicro-asrock-rack-gigabyte-ieit-byd-arm/"
            target="_blank"
            rel="noopener noreferrer"
            >servethehome.com</a
          >. The current OEM list for general-purpose ARM64 servers, and Dell, HPE, and Wiwynn's
          absence from it.
        </li>
        <li id="costs-src-4">
          <cite>Cloudflare.</cite> "Designing Edge Servers with Arm CPUs to Deliver 57% More
          Performance Per Watt." 2026.
          <a
            href="https://blog.cloudflare.com/designing-edge-servers-with-arm-cpus/"
            target="_blank"
            rel="noopener noreferrer"
            >blog.cloudflare.com</a
          >. The production requests-per-watt figures for Cloudflare's x86 (Milan) and ARM (Ampere)
          edge fleets, both measured against the same Rome-era baseline.
        </li>
        <li id="costs-src-5">
          <cite>Amazon Web Services.</cite> "AWS Graviton Processor." 2026.
          <a href="https://aws.amazon.com/ec2/graviton/" target="_blank" rel="noopener noreferrer"
            >aws.amazon.com</a
          >. AWS's own claim that Graviton instances use up to 60 percent less energy than
          comparable x86 instances for the same performance.
        </li>
        <li id="costs-src-6">
          <cite>SiFive.</cite> "RISC-V for the Datacenter: Introducing the P870-D." 2024.
          <a
            href="https://www.sifive.com/blog/risc-v-for-the-datacenter-introducing-the-p870-d"
            target="_blank"
            rel="noopener noreferrer"
            >sifive.com</a
          >. SiFive's own performance-per-watt claims for its 256-core datacenter core, presented
          without independent benchmarks as of this writing.
        </li>
        <li id="costs-src-7">
          <cite>HBS.</cite> "Cloud Repatriation Trends: Cost, AI and the Push Towards Hybrid."
          November 2025.
          <a
            href="https://www.hbs.net/blog/cloud-repatriation-trends-cost-ai-and-the-push-towards-hybrid"
            target="_blank"
            rel="noopener noreferrer"
            >hbs.net</a
          >. The IDC-sourced figure that 86 percent of CIOs planned to repatriate some workload from
          the public cloud in 2025, AI spending cited as a leading driver.
        </li>
        <li id="costs-src-8">
          <cite>SemiAnalysis.</cite> "Are AI Datacenters Increasing Electric Bills for American
          Households?" 2026.
          <a
            href="https://newsletter.semianalysis.com/p/are-ai-datacenters-increasing-electric"
            target="_blank"
            rel="noopener noreferrer"
            >newsletter.semianalysis.com</a
          >. The PJM capacity price spike, 29 to 270 dollars per megawatt-day, and the projected
          household bill impact.
        </li>
        <li id="costs-src-9">
          <cite>JLL Research.</cite> "2026 Market Outlook for Global Data Centers." 2026.
          <a
            href="https://www.jll.com/en-us/insights/market-outlook/data-center-outlook"
            target="_blank"
            rel="noopener noreferrer"
            >jll.com</a
          >. Standard and AI-optimized datacenter construction cost per megawatt.
        </li>
        <li id="costs-src-10">
          <cite>NVIDIA.</cite> "Personal AI Supercomputer Powered by Blackwell: DGX Spark." 2026.
          <a
            href="https://www.nvidia.com/en-us/products/workstations/dgx-spark/"
            target="_blank"
            rel="noopener noreferrer"
            >nvidia.com</a
          >. DGX Spark's price and 240-watt peak system power rating.
        </li>
        <li id="costs-src-11">
          <cite>U.S. Energy Information Administration.</cite> "Electric Power Monthly." 2026.
          <a
            href="https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a"
            target="_blank"
            rel="noopener noreferrer"
            >eia.gov</a
          >. The 18.7 cents per kilowatt-hour average US residential electricity rate used above.
        </li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostsComponent {
  protected readonly barOptions = BASE_BAR_OPTIONS;

  protected readonly perGpuCostData: ChartConfiguration<'bar'>['data'] = {
    labels: ['H200 (8-GPU HGX server)', 'GB200 NVL72 (72-GPU rack)'],
    datasets: [
      {
        label: 'Fully integrated $/GPU (thousands)',
        data: [46, 54],
        backgroundColor: [ICE_FILL, AMBER_FILL],
        borderColor: [ICE_LINE, AMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly architectureEfficiencyData: ChartConfiguration<'bar'>['data'] = {
    labels: ['x86 (AMD Milan vs Rome)', 'ARM (Ampere vs Rome)'],
    datasets: [
      {
        label: 'Requests per watt, gain over 2019-era x86 baseline (%)',
        data: [39, 57],
        backgroundColor: [ICE_FILL, AMBER_FILL],
        borderColor: [ICE_LINE, AMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly datacenterCostData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Standard datacenter', 'AI-optimized datacenter', 'Gigawatt AI campus (with servers)'],
    datasets: [
      {
        label: '$/MW (millions)',
        data: [10, 17.5, 38],
        backgroundColor: [ICE_FILL, AMBER_FILL, EMBER_FILL],
        borderColor: [ICE_LINE, AMBER_LINE, EMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly pueData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Air cooling', 'Liquid cooling', 'Immersion cooling'],
    datasets: [
      {
        label: 'Power usage effectiveness',
        data: [1.5, 1.15, 1.055],
        backgroundColor: [EMBER_FILL, ICE_FILL, AMBER_FILL],
        borderColor: [EMBER_LINE, ICE_LINE, AMBER_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly closetVsCampusData: ChartConfiguration<'bar'>['data'] = {
    labels: ['DGX Spark (closet, realistic load)', 'Gigawatt AI campus (energy only)'],
    datasets: [
      {
        label: 'Annual energy cost ($)',
        data: [82, 600_000_000],
        backgroundColor: [AMBER_FILL, ICE_FILL],
        borderColor: [AMBER_LINE, ICE_LINE],
        borderWidth: 1,
      },
    ],
  };

  protected readonly logScaleBarOptions: ChartConfiguration<'bar'>['options'] = {
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
