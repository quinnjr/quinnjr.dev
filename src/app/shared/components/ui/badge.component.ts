import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeStyle = 'solid' | 'soft' | 'outline' | 'dot';

// Hoisted out of the getters: pure data, identical for every instance. Built
// inline they were re-allocated (4 objects, 24 entries) on every change
// detection pass, multiplied by however many badges a list renders.
const BASE_CLASSES =
  'inline-flex items-center gap-1 px-2.5 py-0.5 font-mono text-xs tracking-wide transition-colors duration-200 ease-gilt';

// Status hues come from the theme: amber is the accent, muted parchment the
// neutral, ice for info, verdigris/blood for success/danger. No stock Tailwind palette.
const STYLE_VARIANT_CLASSES: Record<BadgeStyle, Record<BadgeVariant, string>> = {
  solid: {
    primary: 'bg-amber text-void',
    secondary: 'bg-muted text-void',
    success: 'bg-verdigris text-void',
    warning: 'bg-amber-bright text-void',
    danger: 'bg-ember text-void',
    info: 'bg-ice text-void',
  },
  soft: {
    primary: 'bg-amber/15 text-amber-bright',
    secondary: 'bg-muted/15 text-muted',
    success: 'bg-verdigris/15 text-verdigris',
    warning: 'bg-amber-bright/15 text-amber-bright',
    danger: 'bg-blood/15 text-blood',
    info: 'bg-ice/15 text-ice',
  },
  outline: {
    primary: 'border border-amber text-amber',
    secondary: 'border border-muted text-muted',
    success: 'border border-verdigris text-verdigris',
    warning: 'border border-amber-bright text-amber-bright',
    danger: 'border border-blood text-blood',
    info: 'border border-ice text-ice',
  },
  dot: {
    primary: 'text-amber',
    secondary: 'text-muted',
    success: 'text-verdigris',
    warning: 'text-amber-bright',
    danger: 'text-blood',
    info: 'text-ice',
  },
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  primary: 'bg-amber',
  secondary: 'bg-muted',
  success: 'bg-verdigris',
  warning: 'bg-amber-bright',
  danger: 'bg-blood',
  info: 'bg-ice',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses">
      @if (badgeStyle === 'dot') {
        <span [class]="dotClasses"></span>
      }
      <ng-content></ng-content>
      @if (removable) {
        <button
          type="button"
          (click)="onRemove()"
          class="ml-1 hover:text-parchment focus-visible:outline-1 focus-visible:outline-current"
          aria-label="Remove"
        >
          <i class="fas fa-times text-xs" aria-hidden="true"></i>
        </button>
      }
    </span>
  `,
  styles: [],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() badgeStyle: BadgeStyle = 'solid';
  @Input() pill = false;
  @Input() removable = false;
  @Input() classOverride = '';
  @Output() remove = new EventEmitter<void>();

  onRemove(): void {
    this.remove.emit();
  }

  get badgeClasses(): string {
    const shapeClasses = this.pill ? 'rounded-full' : 'rounded-[2px]';

    return `${BASE_CLASSES} ${shapeClasses} ${STYLE_VARIANT_CLASSES[this.badgeStyle][this.variant]} ${this.classOverride}`.trim();
  }

  get dotClasses(): string {
    return `w-2 h-2 rounded-full ${DOT_COLORS[this.variant]} motion-safe:animate-pulse`;
  }
}
