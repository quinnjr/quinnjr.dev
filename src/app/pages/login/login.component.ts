import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/components/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4"
    >
      <div class="max-w-md w-full space-y-8">
        <h2 class="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <form
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Email</label
            >
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="username"
              class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Password</label
            >
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }
          <app-button
            type="submit"
            variant="primary"
            size="lg"
            [fullWidth]="true"
            [disabled]="submitting()"
          >
            <i class="fas fa-lock mr-2"></i>{{ submitting() ? 'Signing in…' : 'Sign in' }}
          </app-button>
          <div class="text-center">
            <a routerLink="/" class="text-sm font-medium text-blue-600 hover:text-blue-500">
              <i class="fas fa-arrow-left mr-2"></i>Back to home
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    email: ['', [Validators.required, Validators.email]],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    password: ['', Validators.required],
  });

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
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/admin']).catch(() => undefined);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Invalid email or password');
      },
    });
  }
}
