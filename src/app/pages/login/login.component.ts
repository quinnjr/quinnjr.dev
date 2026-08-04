import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { rateLimitMessage } from '../../graphql/rate-limit-error';
import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';
import { SeoService } from '../../services/seo.service';

/** Names the budget in throttle messages for every passkey-stage mutation:
 *  the passkey steps share a per-ticket bucket that the password step does
 *  not, so saying "sign-in attempts" here would point at the wrong limit. */
const PASSKEY_ATTEMPTS = 'passkey attempts';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tavern-shell flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <div class="card-stone clip-rpg p-8">
          <div class="flex flex-col items-center text-center">
            <div class="login-sigil" aria-hidden="true"><i class="fas fa-lock"></i></div>
            <p class="tavern-eyebrow mt-5">Restricted Passage</p>
            <h1 class="login-title">The Gatehouse</h1>
            <p class="mt-2 font-body text-muted">Speak the words to pass.</p>
          </div>

          @if (stage() === 'password') {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
              <div>
                <label for="email" class="field-label">Email</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="username"
                  class="field-rune"
                  placeholder="you@realm.dev"
                />
              </div>
              <div>
                <label for="password" class="field-label">Password</label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  class="field-rune"
                  placeholder="••••••••"
                />
              </div>
              @if (error()) {
                <p class="login-error" role="alert">
                  <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>{{ error() }}
                </p>
              }
              <button
                type="submit"
                class="btn-rpg btn-rpg-primary w-full justify-center"
                [disabled]="submitting()"
              >
                <i class="fas fa-key" aria-hidden="true"></i>
                {{ submitting() ? 'Unbarring the door…' : 'Enter' }}
              </button>
            </form>
          } @else if (stage() === 'enrol') {
            <div class="mt-8 space-y-5 text-center" data-testid="enrol-stage">
              <div class="login-sigil mx-auto" aria-hidden="true">
                <i class="fas fa-fingerprint"></i>
              </div>
              <p class="font-body text-muted">
                The words were right — but this gate takes two seals. Register a passkey now to
                finish signing in; it will be required from here on.
              </p>
              @if (error()) {
                <p class="login-error" role="alert">
                  <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>{{ error() }}
                </p>
              }
              @if (passkeySupported()) {
                <div class="text-left">
                  <label for="passkeyName" class="field-label">Name this authenticator</label>
                  <input
                    id="passkeyName"
                    name="passkeyName"
                    class="field-rune"
                    maxlength="64"
                    [ngModel]="passkeyName()"
                    (ngModelChange)="passkeyName.set($event)"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="YubiKey, iPhone, this laptop…"
                    [disabled]="submitting()"
                  />
                </div>
                <button
                  type="button"
                  class="btn-rpg btn-rpg-primary w-full justify-center"
                  [disabled]="submitting()"
                  (click)="onEnrol()"
                  data-testid="enrol-continue"
                >
                  <i class="fas fa-fingerprint" aria-hidden="true"></i>
                  {{ submitting() ? 'Awaiting your sigil…' : 'Register a passkey' }}
                </button>
              }
              <button type="button" class="link-tavern text-sm" (click)="restart()">
                Start over
              </button>
            </div>
          } @else if (stage() === 'passkey') {
            <div class="mt-8 space-y-5 text-center" data-testid="passkey-stage">
              <div class="login-sigil mx-auto" aria-hidden="true">
                <i class="fas fa-fingerprint"></i>
              </div>
              <p class="font-body text-muted">
                The words were right. Now present your sigil — the second seal on this door.
              </p>
              @if (error()) {
                <p class="login-error" role="alert">
                  <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>{{ error() }}
                </p>
              }
              <button
                type="button"
                class="btn-rpg btn-rpg-primary w-full justify-center"
                [disabled]="submitting() || !passkeySupported()"
                (click)="onPasskey()"
                data-testid="passkey-continue"
              >
                <i class="fas fa-fingerprint" aria-hidden="true"></i>
                {{ submitting() ? 'Awaiting your sigil…' : 'Continue with passkey' }}
              </button>
              <button type="button" class="link-tavern text-sm" (click)="restart()">
                Start over
              </button>
            </div>
          }

          <div class="mt-7 text-center">
            <a routerLink="/home" class="link-tavern">
              <i class="fas fa-arrow-left mr-2" aria-hidden="true"></i>Back to the tavern
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-sigil {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 66px;
        height: 66px;
        color: var(--color-amber);
        font-size: 1.5rem;
        background: radial-gradient(circle, rgba(201, 168, 76, 0.16), transparent 70%);
        border: 1px solid var(--color-edge-strong);
        box-shadow: var(--shadow-glow);
        clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
      }

      .login-title {
        font-family: var(--font-medieval), serif;
        font-weight: 700;
        font-size: 2rem;
        color: var(--color-parchment);
        text-shadow: 0 0 30px rgba(201, 168, 76, 0.25);
        margin-top: 0.4rem;
      }

      .login-error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.85rem;
        font-family: var(--font-mono), monospace;
        font-size: 0.8rem;
        color: #ff8a7a;
        background: rgba(255, 80, 60, 0.07);
        border: 1px solid rgba(255, 120, 100, 0.35);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly passkeys = inject(PasskeyService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  /**
   * 'password' is the first factor. The server then decides which second-factor
   * stage follows: 'passkey' when a credential exists to assert against, or
   * 'enrol' when the account has none — a passkey is mandatory, so there is no
   * path from here to the admin area that skips this. Each value has its own
   * explicit branch in the template: rendering the passkey stage as a catch-all
   * would show `data-testid="passkey-stage"` for a stage that is not it, which
   * silently breaks the e2e assertions that key off that element.
   */
  readonly stage = signal<'password' | 'passkey' | 'enrol'>('password');

  /** Label the new credential is stored under. A signal like every other piece
   *  of mutable view state, because zoneless change detection only notices the
   *  ones it can subscribe to. */
  readonly passkeyName = signal('');

  /** Told to the user when this browser cannot do the ceremony the stage needs.
   *  The two stages fail for different reasons — creating a credential versus
   *  presenting an existing one — so the wording is per-stage data rather than
   *  one vague message covering both. */
  private readonly UNSUPPORTED = {
    // Fail closed and say so plainly. A passkey is required, so a browser that
    // cannot create one cannot complete sign-in at all — better to state that
    // than to leave a dead button.
    enrol:
      'This account needs a passkey, and this browser cannot create one. ' +
      'Sign in from a browser or device that supports passkeys.',
    passkey: 'This account requires a passkey, but this browser cannot present one.',
  } as const;

  /** Proof the password step passed. Not a session — see signMfaToken. */
  private mfaToken: string | null = null;
  /** Whether this browser can present a passkey at all; drives the stage-two
   *  button so an account that requires one cannot offer an action that could
   *  only ever fail. */
  readonly passkeySupported = signal(true);

  readonly form = this.fb.nonNullable.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    email: ['', [Validators.required, Validators.email]],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    // robots.txt disallows /login, but a disallowed URL can still be indexed
    // from an inbound link; noindex is what actually keeps it out of results.
    this.seo.apply({
      title: 'Sign in',
      description: 'Authentication for the quinnjr.dev administration area.',
      path: '/login',
      noIndex: true,
    });
    this.seo.removeJsonLd('page');
    this.seo.removeJsonLd('faq');
    this.seo.removeJsonLd('breadcrumbs');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: result => {
        this.submitting.set(false);
        switch (result.status) {
          case 'enrolmentRequired':
            this.enterSecondFactor('enrol', result.mfaToken);
            return;
          case 'passkeyRequired':
            // Chrome requires the ceremony to be user-activated, so the stage
            // only arms a button rather than firing on arrival.
            this.enterSecondFactor('passkey', result.mfaToken);
            return;
          default: {
            // Exhaustive today: the server has exactly the two second-factor
            // exits and neither carries a session. A third status would make
            // this assignment a compile error, which is the point — the
            // alternative is a stray redirect into /admin for an outcome
            // nobody has reviewed.
            const unhandled: never = result;
            throw new Error(`Unhandled login result: ${String(unhandled)}`);
          }
        }
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        // A throttled attempt is not a wrong password. Reporting it as one
        // invites the retry that spends the next attempt from the same
        // exhausted bucket.
        this.error.set(rateLimitMessage(err, 'sign-in attempts') ?? 'Invalid email or password');
      },
    });
  }

  /** Moves onto the second factor once the password is accepted. Both stages do
   *  the same three things — stash the ticket, switch the view, and find out
   *  whether this browser can run the ceremony at all — so only the message for
   *  a browser that cannot differs, and that lives in UNSUPPORTED. */
  private enterSecondFactor(stage: 'enrol' | 'passkey', mfaToken: string): void {
    this.mfaToken = mfaToken;
    this.stage.set(stage);
    this.passkeySupported.set(this.passkeys.isSupported());
    if (!this.passkeySupported()) {
      // `stage` is a two-value literal union chosen by this component, never
      // caller- or server-controlled input, so the dynamic key is safe.
      // eslint-disable-next-line security/detect-object-injection -- literal union key
      this.error.set(this.UNSUPPORTED[stage]);
    }
  }

  /** Drop the pending proof with the component. The instance is unreachable
   *  after destroy and the server enforces expiry regardless, but leaving a
   *  live credential on a discarded object is not a habit worth keeping. */
  ngOnDestroy(): void {
    this.mfaToken = null;
  }

  /** Runs the enrolment ceremony and, on success, exchanges the ticket for a
   *  session. There is deliberately no skip: the second factor is required. */
  onEnrol(): void {
    const token = this.mfaToken;
    if (!token || this.submitting() || !this.passkeySupported()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.beginPasskeyEnrolment(token).subscribe({
      next: options => {
        this.completeEnrolment(token, options).catch(() => {
          this.submitting.set(false);
          this.error.set('The passkey could not be registered.');
        });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(
          rateLimitMessage(err, PASSKEY_ATTEMPTS) ?? 'This sign-in attempt has expired. Start over.'
        );
      },
    });
  }

  private async completeEnrolment(token: string, options: unknown): Promise<void> {
    let attestation: unknown;
    try {
      attestation = await this.passkeys.register(options);
    } catch (err: unknown) {
      this.submitting.set(false);
      this.error.set(this.passkeys.describeError(err));
      return;
    }

    this.auth
      .completePasskeyEnrolment(token, attestation, this.passkeyName().trim() || 'Passkey')
      .subscribe({
        next: () => {
          this.submitting.set(false);
          // The session is already established here, so a swallowed navigation
          // failure would strand the user on the login form with no error and
          // no spinner — and a retry would then hit the passkey path and claim
          // the attempt "expired", which is simply untrue.
          this.router.navigate(['/admin']).catch((err: unknown) => {
            console.error('post-enrolment navigation failed', err);
            this.error.set('Signed in, but the admin area could not be opened. Reload the page.');
          });
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(
            rateLimitMessage(err, PASSKEY_ATTEMPTS) ??
              'That passkey could not be registered. Try again.'
          );
        },
      });
  }

  onPasskey(): void {
    const token = this.mfaToken;
    if (!token || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.beginPasskeyAuthentication(token).subscribe({
      next: options => {
        this.completePasskey(token, options).catch(() => {
          this.submitting.set(false);
          this.error.set('The passkey step could not be completed.');
        });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(
          rateLimitMessage(err, PASSKEY_ATTEMPTS) ?? 'This sign-in attempt has expired. Start over.'
        );
      },
    });
  }

  /** Returns to the password stage and discards the pending proof, so an
   *  abandoned attempt leaves nothing reusable in the page. */
  restart(): void {
    this.mfaToken = null;
    this.stage.set('password');
    this.error.set(null);
    this.submitting.set(false);
    this.passkeyName.set('');
    this.form.patchValue({ password: '' });
  }

  private async completePasskey(token: string, options: unknown): Promise<void> {
    let assertion: unknown;
    try {
      assertion = await this.passkeys.authenticate(options);
    } catch (err: unknown) {
      this.submitting.set(false);
      this.error.set(this.passkeys.describeError(err));
      return;
    }

    this.auth.verifyPasskey(token, assertion).subscribe({
      next: () => {
        this.submitting.set(false);
        // Same reasoning as after enrolment: the session exists by now, so a
        // silent navigation failure leaves a signed-in user staring at the
        // gate with nothing to act on.
        this.router.navigate(['/admin']).catch((err: unknown) => {
          console.error('post-verification navigation failed', err);
          this.error.set('Signed in, but the admin area could not be opened. Reload the page.');
        });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(
          rateLimitMessage(err, PASSKEY_ATTEMPTS) ??
            'That passkey could not be verified. Try again.'
        );
      },
    });
  }
}
