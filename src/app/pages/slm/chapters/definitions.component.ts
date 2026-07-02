import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-slm-definitions',
  standalone: true,
  // Definitions chapter. Mostly straight HTML projected into .manifesto-prose
  // (styled globally): .lede gets the illuminated initial, h2 marks terms.
  template: `
    <div class="manifesto-prose">
      <p class="manifesto-sigil">Verse II &middot; Definitions</p>
      <h1>Definitions</h1>

      <p class="lede">
        Before the argument continues, the terms in it need fixing in place. Short, plain, and exact
        beats clever every time here.
      </p>

      <h2>Large language model</h2>

      <p>
        A large language model, or LLM, is a neural network trained to predict the next token in a
        sequence of text, given everything that came before it. That single task, repeated, is the
        whole mechanism. Ask it a question and it is not looking up an answer. It is playing a
        highly accurate, mathematical guessing game, generating one token at a time, each one chosen
        by running the same prediction again with the growing response appended to the input. The
        model is a fixed function learned once during training and then run, unchanged, every time
        it is used. GPT, Claude, and Gemini are all LLMs. The differences between them, and the
        differences this manifesto cares about, come down to how big that function is and how it is
        asked to use itself.
      </p>

      <h2>Tokens</h2>

      <p>
        A model does not read words. It reads tokens, the chunks of text a tokenizer breaks input
        into before anything else happens. A token might be a whole word, a fragment of one, or a
        single character. This is not trivia. Every figure this manifesto cites, cost, latency,
        context window, is counted in tokens, not words. A bill for running a model is a token bill.
        When a vendor prices a model per million tokens, that is the unit they are charging for, and
        it is the unit any serious cost comparison between models has to use.
      </p>

      <h2>Parameters, and what they buy</h2>

      <p>
        A parameter is one number inside the model, one weight in the network that training adjusts
        and then locks in place. A model's parameter count, whether it is reported in millions,
        billions, or trillions, is the field's shorthand for two things at once: how much the model
        can represent, and how much it costs to run. More parameters can mean more capability. They
        also mean more memory to hold the model, more compute for every single prediction, and more
        hardware and electricity to serve it to anyone at all. Parameter count is the one number
        that decides whether a model fits on a laptop, a single server, or only a data center built
        for the purpose. For an investor, it is close to the only unit-economics line item this
        field has to offer before a single customer is served.
      </p>

      <h2>Inference and reasoning</h2>

      <p>
        Training is the expensive, one-time process of learning a model's parameters. Inference is
        what happens every time after that: running the trained model on a new input to get an
        output. Training is a capital expense. Inference is the recurring cost of actually operating
        the product, paid every time a user gets an answer.
      </p>

      <p>
        Reasoning, as this manifesto uses the word, is spending more inference to get a better
        answer. A model told to work through a problem step by step, to check its own intermediate
        work before committing to a final answer, is using more tokens and more compute per response
        in exchange for a more reliable one. That trade, more inference for less model, is the
        second half of this manifesto's thesis. A smaller model given room to reason can match or
        beat a far larger one that answers on reflex, and it can do it for less money, parameter for
        parameter and dollar for dollar, than training the larger model in the first place.
      </p>

      <h2>Frontier model</h2>

      <p>
        A frontier model is whatever sits at the current edge of scale, the largest, most expensive
        model a given lab has trained, intended to push the field's ceiling rather than to serve any
        one product cheaply. Anthropic's Claude, OpenAI's GPT, and Google's Gemini, at their largest
        and newest, are frontier models. The defining trait is not capability alone. It is the bet
        behind it, that another jump in scale, another few hundred billion parameters and another
        round of capital, is the path to a categorically smarter model. The term shifts every time a
        new model resets the ceiling, which is itself a tell. Frontier is a moving target by
        definition, never a fixed product, and the labs racing toward it are funding that race with
        money that has to be paid back from somewhere. So far, for any of them, it has not been.
      </p>

      <p>
        One name is deliberately missing from that list, and the omission is not an oversight. xAI's
        Grok is not treated as a frontier model here. In May 2025, Grok began posting unprompted
        replies about "white genocide" in South Africa under unrelated posts on X. xAI said the
        cause was an unauthorized change to Grok's system prompt that directed it toward a specific
        answer on a political topic, a change it said violated its own core values. Two months
        later, after a further system-prompt update told Grok not to shy away from "politically
        incorrect" claims, the model began praising Hitler and calling itself "MechaHitler," and xAI
        issued a public apology. In between those two incidents, Grok had answered a question about
        political violence by citing government data showing more deaths from right-wing attacks
        than left-wing ones since 2016. Musk called the answer "objectively false" and a "major
        fail," and within days said he would use Grok to "rewrite the entire corpus of human
        knowledge," asking the public to submit "divisive facts" for the model to be trained on.
        That is a public, on-the-record account, by the company and its owner, of editing a model's
        answers to fit one man's politics rather than the evidence in front of it. The same pattern
        shows up in Grokipedia, the encyclopedia Grok itself was used to write. A November 2025
        review by the fact-checking organization PolitiFact found pages crediting sources that did
        not say what Grokipedia claimed they said, including an entry for the singer Feist that
        invented a fact about her father's death and cited an unrelated 2017 article as the source,
        a fabrication a basic citation check would have caught. Capability has followed the same
        line. On independent reasoning and scientific-reasoning benchmarks, Grok measurably trails
        the current Claude, GPT, and Gemini models, even where it remains competitive on narrower
        tasks. A model that invents its own sources, edited toward one person's worldview, and
        behind on the benchmarks that matter most is not pushing any frontier. This manifesto
        declines to call it one.
      </p>

      <h2>Small language model</h2>

      <p>
        A small language model, or SLM, is a model built and trained at the scale of millions to low
        billions of parameters, not the hundreds of billions or trillions the frontier labs train
        toward. There is no fixed line, since the field's sense of small keeps shifting as hardware
        gets cheaper, but the property that matters does not shift. A small model can run close to
        the work it serves, on hardware a single team can own or rent without raising another round
        for it, and can be tuned tightly enough to a domain that it never needed the whole of human
        knowledge to begin with. Small, here, is not what a team settles for when the frontier is
        out of reach. It is what fast, cheap, private, and auditable look like in a model, four
        properties the largest models give up by design in their pursuit of generality.
      </p>

      <hr />

      <p>
        With these terms fixed, the case against the trillion-parameter frontier and for the small
        model, reasoning hard, can be made without further translation.
      </p>

      <h2 class="bibliography-title">Sources</h2>
      <ol class="bibliography">
        <li>
          <cite>Vaswani, A. et al.</cite> "Attention Is All You Need." NeurIPS, 2017.
          <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer"
            >arXiv:1706.03762</a
          >. The transformer architecture underlying nearly every modern LLM.
        </li>
        <li>
          <cite>Sennrich, R., Haddow, B., and Birch, A.</cite> "Neural Machine Translation of Rare
          Words with Subword Units." ACL, 2016.
          <a href="https://arxiv.org/abs/1508.07909" target="_blank" rel="noopener noreferrer"
            >arXiv:1508.07909</a
          >. The byte-pair encoding scheme behind most modern tokenizers.
        </li>
        <li>
          <cite>Kaplan, J. et al.</cite> "Scaling Laws for Neural Language Models." 2020.
          <a href="https://arxiv.org/abs/2001.08361" target="_blank" rel="noopener noreferrer"
            >arXiv:2001.08361</a
          >. The original case for predicting model performance from parameter count, data, and
          compute.
        </li>
        <li>
          <cite>Hoffmann, J. et al.</cite> "Training Compute-Optimal Large Language Models."
          DeepMind, 2022.
          <a href="https://arxiv.org/abs/2203.15556" target="_blank" rel="noopener noreferrer"
            >arXiv:2203.15556</a
          >. The Chinchilla paper, showing most large models of its era were undertrained relative
          to their parameter count.
        </li>
        <li>
          <cite>Wei, J. et al.</cite> "Chain-of-Thought Prompting Elicits Reasoning in Large
          Language Models." 2022.
          <a href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noopener noreferrer"
            >arXiv:2201.11903</a
          >. The paper that established step-by-step inference-time reasoning as a lever distinct
          from model scale.
        </li>
        <li>
          <cite>Gunasekar, S. et al.</cite> "Textbooks Are All You Need." Microsoft Research, 2023.
          <a href="https://arxiv.org/abs/2306.11644" target="_blank" rel="noopener noreferrer"
            >arXiv:2306.11644</a
          >. The Phi-1 paper, an early case for small models trained on curated data outperforming
          much larger ones on narrower tasks.
        </li>
        <li>
          <cite>Gemma Team, Google DeepMind.</cite> "Gemma: Open Models Based on Gemini Research and
          Technology." 2024.
          <a href="https://arxiv.org/abs/2403.08295" target="_blank" rel="noopener noreferrer"
            >arXiv:2403.08295</a
          >. A representative modern small-model release, billions rather than trillions of
          parameters.
        </li>
        <li>
          <cite>CNBC.</cite> "Musk's xAI says Grok's 'white genocide' posts resulted from change
          that violated 'core values.'" May 2025.
          <a
            href="https://www.cnbc.com/2025/05/15/musks-xai-grok-white-genocide-posts-violated-core-values.html"
            target="_blank"
            rel="noopener noreferrer"
            >cnbc.com</a
          >. xAI's own account of the unauthorized system-prompt change behind Grok's unprompted
          posts about South Africa.
        </li>
        <li>
          <cite>CNN Business.</cite> "xAI issues lengthy apology for violent and antisemitic Grok
          social media posts." July 2025.
          <a
            href="https://www.cnn.com/2025/07/12/tech/xai-apology-antisemitic-grok-social-media-posts"
            target="_blank"
            rel="noopener noreferrer"
            >cnn.com</a
          >. The apology following Grok's "MechaHitler" outputs, traced to a system-prompt change
          instructing the model not to shy from "politically incorrect" claims.
        </li>
        <li>
          <cite>Gizmodo.</cite> "Elon Says He's Working to 'Fix' Grok After AI Disagrees With Him on
          Right-Wing Violence." June 2025.
          <a
            href="https://gizmodo.com/elon-says-hes-working-to-fix-grok-after-ai-disagrees-with-him-on-right-wing-violence-2000617420"
            target="_blank"
            rel="noopener noreferrer"
            >gizmodo.com</a
          >. Musk's public pledge to retrain Grok after it gave an answer, citing government data,
          that he called a "major fail."
        </li>
        <li>
          <cite>LM Council.</cite> "AI Model Benchmarks." Accessed June 2026.
          <a href="https://lmcouncil.ai/benchmarks" target="_blank" rel="noopener noreferrer"
            >lmcouncil.ai/benchmarks</a
          >. Independent benchmark comparison showing Grok trailing Claude, GPT, and Gemini on
          reasoning and scientific-reasoning tasks.
        </li>
        <li>
          <cite>PolitiFact.</cite> "Musk's AI-powered Grokipedia: A Wikipedia spin-off with less
          care to sourcing, accuracy." November 2025.
          <a
            href="https://www.politifact.com/article/2025/nov/12/Grokipedia-Wikipedia-AI-citations/"
            target="_blank"
            rel="noopener noreferrer"
            >politifact.com</a
          >. The fact-check finding Grokipedia pages citing sources that did not support, or
          contradicted, the claims attributed to them.
        </li>
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefinitionsComponent {}
