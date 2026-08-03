import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';

import { PasskeyService } from '../../services/passkey.service';

import { LoginComponent } from './login.component';

/** Lets the microtask queue drain — the passkey ceremony is a promise, so the
 *  component's state settles a tick after the mutation resolves. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('LoginComponent', () => {
  let controller: ApolloTestingController;
  let fixture: ComponentFixture<LoginComponent>;
  let passkeys: {
    isSupported: ReturnType<typeof vi.fn>;
    authenticate: ReturnType<typeof vi.fn>;
    describeError: ReturnType<typeof vi.fn>;
  };
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    passkeys = {
      isSupported: vi.fn().mockReturnValue(true),
      authenticate: vi.fn().mockResolvedValue({ id: 'assertion' }),
      describeError: vi.fn().mockReturnValue('prompt dismissed'),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent, ApolloTestingModule],
      providers: [provideRouter([]), { provide: PasskeyService, useValue: passkeys }],
    });

    controller = TestBed.inject(ApolloTestingController);
    navigate = vi.fn().mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate as never);

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  function submitCredentials() {
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'pw' });
    fixture.componentInstance.onSubmit();
  }

  it('goes straight to the admin area when no passkey is required', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: 'tok',
          mfaRequired: false,
          mfaToken: null,
          user: { id: 'u1', name: 'A', role: 'ADMIN' },
        },
      },
    });
    await settle();

    expect(fixture.componentInstance.stage()).toBe('password');
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('switches to the passkey stage instead of navigating when one is required', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
    });
    await settle();
    fixture.detectChanges();

    expect(fixture.componentInstance.stage()).toBe('passkey');
    // A correct password must not reach the admin area on its own.
    expect(navigate).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="passkey-stage"]')
    ).toBeTruthy();
  });

  it('completes sign-in after a successful assertion', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
    });
    await settle();

    fixture.componentInstance.onPasskey();
    controller
      .expectOne('BeginPasskeyAuthentication')
      .flush({ data: { beginPasskeyAuthentication: { challenge: 'c' } } });
    await settle();

    controller.expectOne('VerifyPasskey').flush({
      data: { verifyPasskey: { token: 'tok', user: { id: 'u1', name: 'A', role: 'ADMIN' } } },
    });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('surfaces a dismissed prompt without leaving the button stuck', async () => {
    passkeys.authenticate.mockRejectedValue(new Error('cancelled'));
    submitCredentials();
    controller.expectOne('Login').flush({
      data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
    });
    await settle();

    fixture.componentInstance.onPasskey();
    controller
      .expectOne('BeginPasskeyAuthentication')
      .flush({ data: { beginPasskeyAuthentication: { challenge: 'c' } } });
    await settle();

    expect(fixture.componentInstance.error()).toBe('prompt dismissed');
    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('warns when the account needs a passkey the browser cannot present', async () => {
    passkeys.isSupported.mockReturnValue(false);
    submitCredentials();
    controller.expectOne('Login').flush({
      data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
    });
    await settle();

    expect(fixture.componentInstance.error()).toContain('cannot present one');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('discards the pending proof when starting over', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: { login: { token: null, mfaRequired: true, mfaToken: 'mfa-tok', user: null } },
    });
    await settle();

    fixture.componentInstance.restart();
    fixture.componentInstance.onPasskey();

    expect(fixture.componentInstance.stage()).toBe('password');
    // No ceremony may start once the proof has been discarded.
    controller.expectNone('BeginPasskeyAuthentication');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
