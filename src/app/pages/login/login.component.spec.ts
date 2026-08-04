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
    register: ReturnType<typeof vi.fn>;
    describeError: ReturnType<typeof vi.fn>;
  };
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    passkeys = {
      isSupported: vi.fn().mockReturnValue(true),
      authenticate: vi.fn().mockResolvedValue({ id: 'assertion' }),
      register: vi.fn().mockResolvedValue({ id: 'attestation' }),
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

  // A passkey is mandatory, so the server never answers a password with a
  // session: an account with no credential gets an enrolment ticket instead.
  it('switches to the enrolment stage instead of navigating when no passkey exists', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: false,
          enrolmentRequired: true,
          mfaToken: 'enrol-tok',
          user: null,
        },
      },
    });
    await settle();
    fixture.detectChanges();

    expect(fixture.componentInstance.stage()).toBe('enrol');
    expect(navigate).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="enrol-stage"]')
    ).toBeTruthy();
  });

  it('completes sign-in only after the new credential is registered', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: false,
          enrolmentRequired: true,
          mfaToken: 'enrol-tok',
          user: null,
        },
      },
    });
    await settle();

    fixture.componentInstance.onEnrol();
    controller
      .expectOne('BeginPasskeyEnrolment')
      .flush({ data: { beginPasskeyEnrolment: { challenge: 'c' } } });
    await settle();

    const op = controller.expectOne('CompletePasskeyEnrolment');
    expect(op.operation.variables['mfaToken']).toBe('enrol-tok');
    op.flush({
      data: {
        completePasskeyEnrolment: { token: 'tok', user: { id: 'u1', name: 'A', role: 'ADMIN' } },
      },
    });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('keeps the user on the gate when the enrolment ceremony is dismissed', async () => {
    passkeys.register.mockRejectedValue(new Error('cancelled'));
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: false,
          enrolmentRequired: true,
          mfaToken: 'enrol-tok',
          user: null,
        },
      },
    });
    await settle();

    fixture.componentInstance.onEnrol();
    controller
      .expectOne('BeginPasskeyEnrolment')
      .flush({ data: { beginPasskeyEnrolment: { challenge: 'c' } } });
    await settle();

    expect(fixture.componentInstance.error()).toBe('prompt dismissed');
    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('says so plainly when the browser cannot create the required passkey', async () => {
    passkeys.isSupported.mockReturnValue(false);
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: false,
          enrolmentRequired: true,
          mfaToken: 'enrol-tok',
          user: null,
        },
      },
    });
    await settle();

    expect(fixture.componentInstance.error()).toContain('cannot create one');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('switches to the passkey stage instead of navigating when one is required', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: 'mfa-tok',
          user: null,
        },
      },
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
      data: {
        login: {
          token: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: 'mfa-tok',
          user: null,
        },
      },
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
      data: {
        login: {
          token: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: 'mfa-tok',
          user: null,
        },
      },
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
      data: {
        login: {
          token: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: 'mfa-tok',
          user: null,
        },
      },
    });
    await settle();

    expect(fixture.componentInstance.error()).toContain('cannot present one');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('discards the pending proof when starting over', async () => {
    submitCredentials();
    controller.expectOne('Login').flush({
      data: {
        login: {
          token: null,
          mfaRequired: true,
          enrolmentRequired: false,
          mfaToken: 'mfa-tok',
          user: null,
        },
      },
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

describe('LoginComponent throttling', () => {
  let controller: ApolloTestingController;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent, ApolloTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: PasskeyService,
          useValue: {
            isSupported: vi.fn().mockReturnValue(true),
            authenticate: vi.fn(),
            register: vi.fn(),
            describeError: vi.fn(),
          },
        },
      ],
    });
    controller = TestBed.inject(ApolloTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  function submitAndThrottle(retryAfterSeconds: number | undefined) {
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'pw' });
    fixture.componentInstance.onSubmit();
    controller.expectOne('Login').graphqlErrors([
      {
        message: 'Too many attempts. Please try again later.',
        extensions:
          retryAfterSeconds === undefined
            ? { code: 'TOO_MANY_REQUESTS' }
            : { code: 'TOO_MANY_REQUESTS', retryAfterSeconds },
      },
    ]);
  }

  // The regression this exists for: a throttled attempt was reported as a wrong
  // password, so the natural response — retype it and try again — spent another
  // attempt from the same exhausted bucket.
  it('reports a throttled sign-in as throttling, not as a bad password', async () => {
    submitAndThrottle(900);
    await settle();

    expect(fixture.componentInstance.error()).toBe(
      'Too many sign-in attempts. Try again in about 15 minutes.'
    );
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('rounds the wait up, so the advised retry is not refused again', async () => {
    // 90s must not become "1 minute": the retry that invites is still too early.
    submitAndThrottle(90);
    await settle();

    expect(fixture.componentInstance.error()).toBe(
      'Too many sign-in attempts. Try again in about 2 minutes.'
    );
  });

  it('still reports throttling when the server sends no retry hint', async () => {
    submitAndThrottle(undefined);
    await settle();

    expect(fixture.componentInstance.error()).toBe(
      'Too many sign-in attempts. Wait a while before trying again.'
    );
  });

  // The other half of the contract: a genuine credential failure must keep
  // saying so, rather than every failure becoming a throttle message.
  it('still blames the credentials when the rejection is not a throttle', async () => {
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'pw' });
    fixture.componentInstance.onSubmit();
    controller
      .expectOne('Login')
      .graphqlErrors([{ message: 'Invalid credentials', extensions: { code: 'UNAUTHENTICATED' } }]);
    await settle();

    expect(fixture.componentInstance.error()).toBe('Invalid email or password');
  });
});
