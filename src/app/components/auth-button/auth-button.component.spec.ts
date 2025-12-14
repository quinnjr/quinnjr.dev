import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';

import { AuthButtonComponent } from './auth-button.component';

describe('AuthButtonComponent', () => {
  let component: AuthButtonComponent;
  let fixture: ComponentFixture<AuthButtonComponent>;

  describe('Browser Environment', () => {
    let mockAuthService: Partial<AuthService>;
    let mockRouter: Partial<Router>;

    beforeEach(async () => {
      mockAuthService = {
        isAuthenticated$: of(false),
        user$: of(null),
        logout: vi.fn(),
      };

      mockRouter = {
        navigate: vi.fn().mockResolvedValue(true),
      };

      await TestBed.configureTestingModule({
        imports: [AuthButtonComponent],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthButtonComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should detect browser platform', () => {
      expect(component.isBrowser).toBe(true);
    });

    it('should inject AuthService in browser', () => {
      expect(component.auth).not.toBeNull();
    });

    it('should navigate to admin on login', () => {
      component.login();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should handle navigation errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRouter.navigate = vi.fn().mockRejectedValue(new Error('Navigation failed'));

      component.login();

      // Wait for promise to reject
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should call AuthService logout with correct params', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200' },
        writable: true,
      });

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalledWith({
        logoutParams: {
          returnTo: 'http://localhost:4200',
        },
      });
    });

    it('should not logout if not browser', () => {
      component.isBrowser = false;
      component.logout();
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should not logout if auth service is null', () => {
      component.auth = null;
      component.logout();
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should render login button when not authenticated', () => {
      const compiled = fixture.nativeElement;
      const loginButton = compiled.querySelector('button');
      expect(loginButton).toBeTruthy();
      expect(loginButton.textContent).toContain('Login');
    });
  });

  describe('Server Environment (SSR)', () => {
    let mockRouter: Partial<Router>;

    beforeEach(async () => {
      mockRouter = {
        navigate: vi.fn().mockResolvedValue(true),
      };

      await TestBed.configureTestingModule({
        imports: [AuthButtonComponent],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthButtonComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in SSR', () => {
      expect(component).toBeTruthy();
    });

    it('should detect server platform', () => {
      expect(component.isBrowser).toBe(false);
    });

    it('should not inject AuthService in SSR', () => {
      expect(component.auth).toBeNull();
    });

    it('should not navigate on login in SSR', () => {
      component.login();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should render disabled login button in SSR', () => {
      const compiled = fixture.nativeElement;
      const loginButton = compiled.querySelector('button');
      expect(loginButton).toBeTruthy();
      expect(loginButton.disabled).toBe(true);
    });
  });
});
