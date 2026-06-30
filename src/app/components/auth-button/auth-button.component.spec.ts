import { provideHttpClient, withXhr } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { AuthButtonComponent } from './auth-button.component';

describe('AuthButtonComponent', () => {
  let component: AuthButtonComponent;
  let fixture: ComponentFixture<AuthButtonComponent>;

  describe('Unauthenticated state', () => {
    let mockAuthService: Partial<AuthService>;
    let mockRouter: Partial<Router>;

    beforeEach(async () => {
      mockAuthService = {
        isAuthenticated: signal(false),
        logout: vi.fn(),
      };

      mockRouter = {
        navigate: vi.fn().mockResolvedValue(true),
      };

      await TestBed.configureTestingModule({
        imports: [AuthButtonComponent],
        providers: [
          provideHttpClient(withXhr()),
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
          { provide: Router, useValue: mockRouter },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthButtonComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject AuthService', () => {
      expect(component.auth).not.toBeNull();
    });

    it('should navigate to /login on goToLogin()', () => {
      component.goToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call AuthService.logout and navigate to / on logout()', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should render login button when not authenticated', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const loginButton = compiled.querySelector('button');
      expect(loginButton).toBeTruthy();
      expect(loginButton?.textContent).toContain('Login');
    });
  });

  describe('Authenticated state', () => {
    let mockAuthService: Partial<AuthService>;

    beforeEach(async () => {
      mockAuthService = {
        isAuthenticated: signal(true),
        logout: vi.fn(),
      };

      await TestBed.configureTestingModule({
        imports: [AuthButtonComponent],
        providers: [
          provideHttpClient(withXhr()),
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthButtonComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render logout button when authenticated', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = compiled.querySelector('button');
      expect(logoutButton).toBeTruthy();
      expect(logoutButton?.textContent).toContain('Logout');
    });
  });
});
