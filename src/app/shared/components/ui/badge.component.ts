import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeStyle = 'solid' | 'soft' | 'outline' | 'dot';

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
          class="ml-1 hover:text-white focus:outline-none"
          aria-label="Remove"
        >
          <i class="fas fa-times text-xs"></i>
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
    const baseClasses =
      'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium transition-all duration-200';

    const shapeClasses = this.pill ? 'rounded-full' : 'rounded';

    const styleVariantClasses: Record<BadgeStyle, Record<BadgeVariant, string>> = {
      solid: {
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-purple-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        danger: 'bg-red-600 text-white',
        info: 'bg-cyan-600 text-white',
      },
      soft: {
        primary: 'bg-blue-500/20 text-blue-300',
        secondary: 'bg-purple-500/20 text-purple-300',
        success: 'bg-green-500/20 text-green-300',
        warning: 'bg-yellow-500/20 text-yellow-300',
        danger: 'bg-red-500/20 text-red-300',
        info: 'bg-cyan-500/20 text-cyan-300',
      },
      outline: {
        primary: 'border border-blue-500 text-blue-400',
        secondary: 'border border-purple-500 text-purple-400',
        success: 'border border-green-500 text-green-400',
        warning: 'border border-yellow-500 text-yellow-400',
        danger: 'border border-red-500 text-red-400',
        info: 'border border-cyan-500 text-cyan-400',
      },
      dot: {
        primary: 'text-blue-300',
        secondary: 'text-purple-300',
        success: 'text-green-300',
        warning: 'text-yellow-300',
        danger: 'text-red-300',
        info: 'text-cyan-300',
      },
    };

    return `${baseClasses} ${shapeClasses} ${styleVariantClasses[this.badgeStyle][this.variant]} ${this.classOverride}`.trim();
  }

  get dotClasses(): string {
    const dotColors: Record<BadgeVariant, string> = {
      primary: 'bg-blue-500',
      secondary: 'bg-purple-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
      info: 'bg-cyan-500',
    };

    return `w-2 h-2 rounded-full ${dotColors[this.variant]} animate-pulse`;
  }
}
