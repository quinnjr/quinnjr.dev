import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber' | 'ember';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Hoisted out of the getter: pure data, identical for every instance, so
// there is no reason to re-allocate the tables on each change detection pass.
// One accent (amber gilt) plus ember for destructive actions — see DESIGN.md.
const BASE_CLASSES =
  'inline-flex min-h-11 items-center justify-center rounded-[2px] font-heading font-semibold tracking-wide transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-gilt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-bright disabled:cursor-not-allowed disabled:opacity-50';

const SOLID_AMBER =
  'border border-amber bg-amber text-void hover:border-amber-bright hover:bg-amber-bright hover:shadow-glow enabled:hover:-translate-y-0.5';
// Destructive actions are outlined, not filled: they should read as
// deliberate, not as the loudest thing on the page.
const EMBER = 'border border-ember/60 bg-ember/10 text-ember hover:border-ember hover:bg-ember/20';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: SOLID_AMBER,
  amber: SOLID_AMBER,
  secondary:
    'border border-amber/55 bg-amber/10 text-amber-bright hover:border-amber-bright hover:bg-amber/20',
  ghost:
    'border border-transparent bg-transparent text-muted hover:border-amber/30 hover:text-amber',
  danger: EMBER,
  ember: EMBER,
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

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
    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${BASE_CLASSES} ${VARIANT_CLASSES[this.variant]} ${SIZE_CLASSES[this.size]} ${widthClass} ${this.classOverride}`.trim();
  }
}
