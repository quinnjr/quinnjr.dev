import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';

import { PasskeyService } from '../../../services/passkey.service';

import { PasskeyManagerComponent } from './passkey-manager.component';

/** Apollo delivers `query()`/`mutate()` results and every error path
 *  asynchronously under the testing controller. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

interface Row {
  id: string;
  name: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

const KEY = (over: Partial<Row> = {}): Row => ({
  id: 'p1',
  name: 'YubiKey',
  deviceType: 'singleDevice',
  backedUp: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastUsedAt: null,
  ...over,
});

describe('PasskeyManagerComponent', () => {
  let controller: ApolloTestingController;
  let fixture: ComponentFixture<PasskeyManagerComponent>;
  let passkeys: { isSupported: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    passkeys = {
      isSupported: vi.fn().mockReturnValue(true),
      register: vi.fn().mockResolvedValue({ id: 'attestation' }),
    };

    TestBed.configureTestingModule({
      imports: [PasskeyManagerComponent, ApolloTestingModule],
      providers: [{ provide: PasskeyService, useValue: passkeys }],
    });

    controller = TestBed.inject(ApolloTestingController);
    fixture = TestBed.createComponent(PasskeyManagerComponent);
  });

  function load(keys: unknown[]) {
    fixture.detectChanges();
    controller.expectOne('Passkeys').flush({ data: { passkeys: keys } });
    fixture.detectChanges();
  }

  const html = () => (fixture.nativeElement as HTMLElement).innerHTML;

  it('lists the enrolled passkeys', () => {
    load([KEY(), KEY({ id: 'p2', name: 'Phone' })]);

    expect(fixture.componentInstance.passkeys()).toHaveLength(2);
    expect(html()).toContain('YubiKey');
  });

  // Apollo 4 reports watchQuery failures as `result.error`; an `error:`
  // callback alone never fires, so this is the path that actually matters.
  it('reports a load failure instead of claiming there are none', async () => {
    fixture.detectChanges();
    controller.expectOne('Passkeys').graphqlErrors([{ message: 'nope' }]);
    await settle();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeTruthy();
    expect(html()).not.toContain('No passkeys registered');
  });

  describe('removing the last key', () => {
    it('asks before disabling the second factor rather than just doing it', () => {
      load([KEY()]);

      fixture.componentInstance.remove(KEY());
      fixture.detectChanges();

      // Nothing is dispatched yet — the user has only been asked.
      controller.expectNone('DeletePasskey');
      expect(fixture.componentInstance.pendingRemoval()).not.toBeNull();
      // The consequence must be stated, and stated correctly: the account is
      // not returning to password-only, it is being put into a state where the
      // next sign-in cannot finish without enrolling again.
      expect(html()).toContain('enrol a new passkey');
      expect(html()).not.toContain('password-only');
    });

    it('sends the explicit confirmation once the user accepts', async () => {
      load([KEY()]);
      fixture.componentInstance.remove(KEY());
      fixture.detectChanges();

      fixture.componentInstance.confirmRemove();
      const op = controller.expectOne('DeletePasskey');
      expect(op.operation.variables['confirmRemoveLastPasskey']).toBe(true);
      op.flush({ data: { deletePasskey: true } });
      await settle();

      expect(fixture.componentInstance.passkeys()).toHaveLength(0);
    });

    it('keeps the key when the user declines', () => {
      load([KEY()]);
      fixture.componentInstance.remove(KEY());
      fixture.componentInstance.cancelRemove();
      fixture.detectChanges();

      controller.expectNone('DeletePasskey');
      expect(fixture.componentInstance.passkeys()).toHaveLength(1);
    });

    it('warns while only one key guards the account', () => {
      load([KEY()]);
      expect(fixture.componentInstance.isSoleKey()).toBe(true);
      expect(html()).toContain('One passkey guards this account');
    });
  });

  it('removes a non-final key without asking, and without the confirmation flag', async () => {
    load([KEY(), KEY({ id: 'p2', name: 'Phone' })]);

    fixture.componentInstance.remove(KEY());
    const op = controller.expectOne('DeletePasskey');
    expect(op.operation.variables['confirmRemoveLastPasskey']).toBe(false);
    op.flush({ data: { deletePasskey: true } });
    await settle();

    expect(fixture.componentInstance.passkeys().map(k => k.id)).toEqual(['p2']);
  });

  it('surfaces an error rather than silently doing nothing when registration returns no key', async () => {
    load([]);

    fixture.componentInstance.register();
    controller.expectOne('BeginPasskeyRegistration').flush({
      data: { beginPasskeyRegistration: { challenge: 'c' } },
    });
    await settle();

    controller.expectOne('FinishPasskeyRegistration').flush({
      data: { finishPasskeyRegistration: null },
    });
    await settle();
    fixture.detectChanges();

    expect(fixture.componentInstance.busy()).toBe(false);
    expect(fixture.componentInstance.error()).toBeTruthy();
  });

  it('disables enrolment when the browser cannot create a passkey', () => {
    passkeys.isSupported.mockReturnValue(false);
    load([]);

    expect(fixture.componentInstance.supported()).toBe(false);
    expect(html()).toContain('cannot create passkeys');
  });
});
