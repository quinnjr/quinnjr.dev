import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';

import { PasskeyService } from '../../../services/passkey.service';

const PASSKEYS = gql`
  query Passkeys {
    passkeys {
      id
      name
      deviceType
      backedUp
      createdAt
      lastUsedAt
    }
  }
`;

const BEGIN_REGISTRATION = gql`
  mutation BeginPasskeyRegistration {
    beginPasskeyRegistration
  }
`;

const FINISH_REGISTRATION = gql`
  mutation FinishPasskeyRegistration($response: JSON!, $name: String!) {
    finishPasskeyRegistration(response: $response, name: $name) {
      id
      name
      deviceType
      backedUp
      createdAt
      lastUsedAt
    }
  }
`;

// `confirmRemoveLastPasskey` is the server's record that the user was told what
// removing their last key means — a forced enrolment at the next sign-in, not a
// return to password-only. It is only ever sent true from the confirmed
// last-key path below.
const DELETE_PASSKEY = gql`
  mutation DeletePasskey($id: String!, $confirmRemoveLastPasskey: Boolean) {
    deletePasskey(id: $id, confirmRemoveLastPasskey: $confirmRemoveLastPasskey)
  }
`;

interface PasskeyRow {
  id: string;
  name: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

@Component({
  selector: 'app-passkey-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card-stone p-6">
      <header class="mb-4">
        <h2 class="font-medieval text-2xl text-parchment">Passkeys</h2>
        <p class="mt-1 font-body text-sm text-muted">
          A second seal on the gatehouse. Your password alone never opens the door — so register a
          spare before you come to rely on any one authenticator.
        </p>
      </header>

      @if (!supported()) {
        <p class="passkey-warn" role="alert">
          <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
          This browser cannot create passkeys.
        </p>
      }

      @if (error()) {
        <p class="passkey-warn" role="alert" data-testid="passkey-error">
          <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>{{ error() }}
        </p>
      }

      <!-- The header's "register a spare" is an operating rule, so the single-key
           state has to be visible rather than implied. -->
      @if (isSoleKey()) {
        <p class="passkey-advisory" data-testid="passkey-single-advisory">
          <i class="fas fa-circle-exclamation" aria-hidden="true"></i>
          One passkey guards this account. Lose that authenticator and you lose the gate — register
          a spare now.
        </p>
      }

      @if (loading()) {
        <p class="font-mono text-sm text-muted">Reading the ledger…</p>
      } @else if (error() && passkeys().length === 0) {
        <!-- An unreadable list is not an empty one: saying "none registered"
             here would tell the user their second factor is off when it may
             well be on. -->
        <p class="font-body text-muted" data-testid="passkey-unavailable">
          Your passkeys could not be read, so this list may be incomplete.
        </p>
      } @else if (passkeys().length === 0) {
        <!-- Not "your password alone opens the gate": it does not. With no
             passkey the next sign-in stops at a mandatory enrolment step. -->
        <p class="font-body text-muted" data-testid="passkey-empty">
          No passkeys registered. Your next sign-in will stop and ask you to enrol one before it can
          finish.
        </p>
      } @else {
        <ul class="passkey-list" data-testid="passkey-list">
          @for (key of passkeys(); track key.id) {
            <li class="passkey-row">
              <div>
                <p class="font-body text-parchment">{{ key.name }}</p>
                <p class="font-mono text-xs text-muted">
                  {{ key.deviceType === 'multiDevice' ? 'Synced' : 'This device' }}
                  @if (key.backedUp) {
                    · backed up
                  }
                  · added {{ key.createdAt | date: 'mediumDate' }}
                  @if (key.lastUsedAt) {
                    · last used {{ key.lastUsedAt | date: 'mediumDate' }}
                  } @else {
                    · never used
                  }
                </p>
              </div>
              <button
                type="button"
                class="link-tavern text-sm"
                [disabled]="busy()"
                (click)="remove(key)"
                data-testid="passkey-remove"
              >
                Remove
              </button>
            </li>
          }
        </ul>

        <!-- Removing the last key does NOT restore password-only sign-in: the
             second factor is mandatory, so the next sign-in stops halfway and
             demands a new enrolment. The lockout risk is the part worth naming
             before it happens — an earlier version of this copy told the user
             the opposite of what the server does. -->
        @if (pendingRemoval(); as pending) {
          <div class="passkey-confirm" role="alertdialog" data-testid="passkey-remove-confirm">
            <p class="font-body text-parchment">
              Remove “{{ pending.name }}”? It is your only passkey — your password alone will not
              sign you in. The next sign-in will ask you to enrol a new passkey, so you will need a
              device that supports them.
            </p>
            <div class="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                class="btn-rpg btn-rpg-primary"
                [disabled]="busy()"
                (click)="confirmRemove()"
                data-testid="passkey-remove-confirm-yes"
              >
                Remove it and enrol again next time
              </button>
              <button
                type="button"
                class="link-tavern text-sm"
                [disabled]="busy()"
                (click)="cancelRemove()"
                data-testid="passkey-remove-confirm-no"
              >
                Keep it
              </button>
            </div>
          </div>
        }
      }

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <input
          class="field-rune flex-1"
          [(ngModel)]="newName"
          name="passkeyName"
          placeholder="Name this authenticator (e.g. YubiKey, iPhone)"
          maxlength="64"
          [disabled]="busy() || !supported()"
        />
        <button
          type="button"
          class="btn-rpg btn-rpg-primary"
          [disabled]="busy() || !supported()"
          (click)="register()"
          data-testid="passkey-add"
        >
          <i class="fas fa-fingerprint" aria-hidden="true"></i>
          {{ busy() ? 'Awaiting authenticator…' : 'Add passkey' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .passkey-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .passkey-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0;
        border-bottom: 1px solid var(--color-edge);
      }

      .passkey-warn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
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
export class PasskeyManagerComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);
  private readonly passkeyService = inject(PasskeyService);

  readonly passkeys = signal<PasskeyRow[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly supported = signal(false);
  /** Set only while the user is being asked to confirm removing their sole
   *  passkey; `null` at every other moment. */
  readonly pendingRemoval = signal<PasskeyRow | null>(null);

  /** One credential is the state the header's "register a spare" advice is
   *  about, and the state where removal is destructive. */
  readonly isSoleKey = computed(() => this.passkeys().length === 1);

  newName = '';

  ngOnInit(): void {
    this.supported.set(this.passkeyService.isSupported());
    this.load();
  }

  private load(): void {
    this.apollo
      .watchQuery<{ passkeys: PasskeyRow[] }>({ query: PASSKEYS, fetchPolicy: 'network-only' })
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Apollo 4 surfaces failures as `result.error` rather than erroring the
        // stream, so an `error:` callback alone would never fire here.
        next: ({ data, error, loading }) => {
          if (loading) {
            return;
          }
          this.loading.set(false);
          if (error) {
            this.error.set('Your passkeys could not be loaded.');
            return;
          }
          this.passkeys.set((data?.passkeys ?? []) as PasskeyRow[]);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Your passkeys could not be loaded.');
        },
      });
  }

  register(): void {
    if (this.busy() || !this.supported()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    this.apollo
      .mutate<{ beginPasskeyRegistration: unknown }>({ mutation: BEGIN_REGISTRATION })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          const options = data?.beginPasskeyRegistration;
          if (!options) {
            this.busy.set(false);
            this.error.set('Registration could not be started.');
            return;
          }
          this.completeRegistration(options).catch(() => {
            this.busy.set(false);
            this.error.set('Registration could not be completed.');
          });
        },
        error: () => {
          this.busy.set(false);
          this.error.set('Registration could not be started.');
        },
      });
  }

  private async completeRegistration(options: unknown): Promise<void> {
    let attestation: unknown;
    try {
      attestation = await this.passkeyService.register(options);
    } catch (err: unknown) {
      this.busy.set(false);
      this.error.set(this.passkeyService.describeError(err));
      return;
    }

    const name = this.newName.trim() || 'Passkey';
    this.apollo
      .mutate<{ finishPasskeyRegistration: PasskeyRow }>({
        mutation: FINISH_REGISTRATION,
        variables: { response: attestation, name },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.busy.set(false);
          const created = data?.finishPasskeyRegistration;
          if (!created) {
            // Silently returning here left the button snapping back to "Add
            // passkey" with nothing added and nothing said.
            this.error.set('That passkey could not be registered.');
            return;
          }
          this.passkeys.update(list => [created, ...list]);
          this.newName = '';
        },
        error: () => {
          this.busy.set(false);
          this.error.set('That passkey could not be registered.');
        },
      });
  }

  /**
   * Removing any but the last key is unremarkable. Removing the last one turns
   * the second factor off for the whole account, so that path stops here and
   * asks — the server refuses it too, unless `confirmRemoveLastPasskey` is sent.
   */
  remove(key: PasskeyRow): void {
    if (this.busy()) {
      return;
    }
    if (this.isSoleKey()) {
      this.pendingRemoval.set(key);
      return;
    }
    this.dispatchRemove(key, false);
  }

  confirmRemove(): void {
    const key = this.pendingRemoval();
    if (!key || this.busy()) {
      return;
    }
    this.pendingRemoval.set(null);
    this.dispatchRemove(key, true);
  }

  cancelRemove(): void {
    this.pendingRemoval.set(null);
  }

  private dispatchRemove(key: PasskeyRow, confirmRemoveLastPasskey: boolean): void {
    this.busy.set(true);
    this.error.set(null);

    this.apollo
      .mutate<{ deletePasskey: boolean }>({
        mutation: DELETE_PASSKEY,
        variables: { id: key.id, confirmRemoveLastPasskey },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.passkeys.update(list => list.filter(k => k.id !== key.id));
        },
        error: () => {
          this.busy.set(false);
          this.error.set('That passkey could not be removed.');
        },
      });
  }
}
