import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ghost'
  | 'outline'
  | 'link'
  | 'amber';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      [attr.aria-busy]="loading"
    >
      @if (loading) {
        <i class="fas fa-spinner fa-spin mr-2"></i>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() classOverride = '';

  get buttonClasses(): string {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5 focus:ring-blue-500',
      secondary:
        'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:-translate-y-0.5 focus:ring-purple-500',
      success:
        'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50 hover:-translate-y-0.5 focus:ring-green-500',
      warning:
        'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:shadow-lg hover:shadow-yellow-500/50 hover:-translate-y-0.5 focus:ring-yellow-500',
      danger:
        'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-0.5 focus:ring-red-500',
      info: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5 focus:ring-cyan-500',
      ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-gray-500',
      outline:
        'bg-transparent border-2 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/30 focus:ring-blue-500',
      link: 'bg-transparent text-blue-400 hover:text-blue-300 hover:underline focus:ring-blue-500 px-0',
      amber:
        'bg-gradient-to-r from-amber-bright to-amber text-void border border-edge-strong hover:shadow-lg hover:shadow-amber/40 hover:-translate-y-0.5 focus:ring-amber',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${widthClass} ${this.classOverride}`.trim();
  }
}
