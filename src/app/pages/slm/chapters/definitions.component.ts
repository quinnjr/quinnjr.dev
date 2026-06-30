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
        Before the argument continues, the terms in it need fixing in place. The words large
        language model, parameter, token, and reasoning get thrown around loosely enough in the
        trade press that they have started to mean whatever the speaker needs them to mean. Here is
        what I mean by them.
      </p>

      <h2>Large language model</h2>

      <p>
        A large language model, or LLM, is a neural network trained to predict the next token in a
        sequence of text, given everything that came before it. Trained on enough text, that simple
        task turns out to teach the network a great deal: grammar, facts, style, something that
        behaves like reasoning when prompted carefully. The model itself is nothing more than a very
        large function, a fixed set of weights learned during training, that takes a sequence of
        tokens in and returns a probability distribution over what token comes next. Everything an
        LLM does, from answering a question to writing a poem, is built out of repeating that single
        prediction over and over until a full response has been produced.
      </p>

      <h2>Tokens</h2>

      <p>
        A model does not read words. It reads tokens, the small chunks of text its tokenizer breaks
        input into before anything else happens. A token might be a whole common word, a fragment of
        a longer word, a single character, or a piece of punctuation. The word "manifesto" might
        survive as one token or get split into pieces like "mani" and "festo," depending on how
        often that exact word showed up in the data the tokenizer was built from. This matters
        because every cost a language model incurs, in compute, in latency, in the size of its
        context window, is counted in tokens, not in words or characters. When this manifesto talks
        about a model's size or its cost to run, tokens are the unit underneath the conversation
        even when they go unmentioned.
      </p>

      <h2>Parameters and what they mean for size</h2>

      <p>
        A parameter is a single number inside the model, one weight in the enormous network of
        weights that the model adjusts during training and then holds fixed once training ends.
        Parameters are not the same as the data a model was trained on, and they are not memories of
        specific facts. They are the learned coefficients of a function, the dials that were turned,
        millions or billions or trillions of times over, until the function got good at predicting
        the next token. When the field describes a model by its parameter count, that count is a
        rough proxy for two things at once: how much the model can represent and how expensive it is
        to run. More parameters generally mean more capacity to capture patterns in language, but
        they also mean more memory to hold the model in, more compute to run a single prediction
        through it, and more electricity and hardware to serve it to anyone at all. A model's
        parameter count is the single number that, more than any other, determines whether it can
        run on a laptop, a single server, or only on a building full of accelerators bought for the
        occasion.
      </p>

      <h2>Inference and reasoning</h2>

      <p>
        Inference is what happens after training ends: the act of actually running the model on a
        new input to get an output, as opposed to training, which is the much more expensive process
        of learning the parameters in the first place. Every time a model answers a question, that
        answer is produced at inference time, one token at a time, each new token chosen by running
        the whole network forward again with the growing response appended to the input.
      </p>

      <p>
        Reasoning, in the sense this manifesto cares about, is what happens when a model is given
        room, at inference time, to work through a problem in steps before committing to a final
        answer, rather than producing its first guess immediately. A model asked to think step by
        step, to draft and check its own intermediate work, or to explore more than one path before
        choosing one, is spending more inference, more tokens and more compute per answer, in
        exchange for a better answer. This trade is the whole point of the second half of this
        manifesto's thesis: that a smaller model given more room to reason at inference time can
        match or beat a far larger model that answers from reflex, and that this trade is, parameter
        for parameter and dollar for dollar, a better one than simply training a bigger model in the
        first place.
      </p>

      <h2>Small language model</h2>

      <p>
        A small language model, or SLM, is what this manifesto is written in defense of: a language
        model built and trained at the scale of millions to low billions of parameters rather than
        the hundreds of billions or trillions claimed by the frontier labs. The boundary is not a
        single fixed number, since the field's sense of "small" keeps shifting as hardware improves,
        but the property that defines it does not shift. A small language model is one that can run
        close to the work it serves, on hardware an individual or a small team actually owns or
        rents at a sane price, fine-tuned tightly enough to a domain that it does not need the whole
        of human knowledge to be useful within that domain. Small, here, is not a consolation prize
        for those priced out of the frontier. It is the design choice that makes a model fast,
        cheap, private, and auditable, the four properties the frontier's largest models give up by
        construction in their pursuit of generality.
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
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefinitionsComponent {}
