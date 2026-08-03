import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PasskeyService } from '../../services/passkey.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
          } @else {
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
                [disabled]="submitting()"
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
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly passkeys = inject(PasskeyService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  /** 'password' is the first factor; 'passkey' is shown only once the server
   *  has confirmed the password AND that an authenticator is enrolled. */
  readonly stage = signal<'password' | 'passkey'>('password');

  /** Proof the password step passed. Not a session — see signMfaToken. */
  private mfaToken: string | null = null;

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
        if (result.status === 'passkeyRequired') {
          this.mfaToken = result.mfaToken;
          this.stage.set('passkey');
          if (!this.passkeys.isSupported()) {
            this.error.set('This account requires a passkey, but this browser cannot present one.');
            return;
          }
          // Chrome requires the ceremony to be user-activated, so this is a
          // button rather than something fired on arrival at the stage.
          return;
        }
        this.router.navigate(['/admin']).catch(() => undefined);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Invalid email or password');
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
      error: () => {
        this.submitting.set(false);
        this.error.set('This sign-in attempt has expired. Start over.');
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
        this.router.navigate(['/admin']).catch(() => undefined);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('That passkey could not be verified. Try again.');
      },
    });
  }
}
