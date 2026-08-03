import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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

const DELETE_PASSKEY = gql`
  mutation DeletePasskey($id: String!) {
    deletePasskey(id: $id)
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
          A second seal on the gatehouse. Once one is registered, your password alone will no longer
          open the door — so register a spare before you rely on it.
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

      @if (loading()) {
        <p class="font-mono text-sm text-muted">Reading the ledger…</p>
      } @else if (passkeys().length === 0) {
        <p class="font-body text-muted" data-testid="passkey-empty">
          No passkeys registered. Your password alone currently opens the gate.
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
              >
                Remove
              </button>
            </li>
          }
        </ul>
      }

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <input
          class="field-rune flex-1"
          [(ngModel)]="newName"
          name="passkeyName"
          placeholder="Name this authenticator (e.g. YubiKey, iPhone)"
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
          if (created) {
            this.passkeys.update(list => [created, ...list]);
            this.newName = '';
          }
        },
        error: () => {
          this.busy.set(false);
          this.error.set('That passkey could not be registered.');
        },
      });
  }

  remove(key: PasskeyRow): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    this.apollo
      .mutate<{ deletePasskey: boolean }>({ mutation: DELETE_PASSKEY, variables: { id: key.id } })
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
