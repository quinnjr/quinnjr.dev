import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'tavern'
  | 'gold'
  | 'parchment';
export type BadgeStyle = 'solid' | 'soft' | 'outline' | 'dot' | 'token' | 'seal';

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
        tavern: 'bg-amber-800 text-amber-100 border border-amber-950',
        gold: 'bg-gradient-to-b from-yellow-500 to-amber-600 text-amber-950 border border-amber-700',
        parchment: 'bg-amber-100 text-amber-900 border border-amber-600',
      },
      soft: {
        primary: 'bg-blue-500/20 text-blue-300',
        secondary: 'bg-purple-500/20 text-purple-300',
        success: 'bg-green-500/20 text-green-300',
        warning: 'bg-yellow-500/20 text-yellow-300',
        danger: 'bg-red-500/20 text-red-300',
        info: 'bg-cyan-500/20 text-cyan-300',
        tavern: 'bg-amber-500/20 text-amber-300',
        gold: 'bg-yellow-500/20 text-yellow-300',
        parchment: 'bg-amber-200/40 text-amber-800',
      },
      outline: {
        primary: 'border border-blue-500 text-blue-400',
        secondary: 'border border-purple-500 text-purple-400',
        success: 'border border-green-500 text-green-400',
        warning: 'border border-yellow-500 text-yellow-400',
        danger: 'border border-red-500 text-red-400',
        info: 'border border-cyan-500 text-cyan-400',
        tavern: 'border-2 border-amber-700 text-amber-400',
        gold: 'border-2 border-yellow-500 text-yellow-400',
        parchment: 'border-2 border-amber-600 text-amber-700',
      },
      dot: {
        primary: 'text-blue-300',
        secondary: 'text-purple-300',
        success: 'text-green-300',
        warning: 'text-yellow-300',
        danger: 'text-red-300',
        info: 'text-cyan-300',
        tavern: 'text-amber-300',
        gold: 'text-yellow-300',
        parchment: 'text-amber-700',
      },
      token: {
        primary:
          'bg-gradient-to-b from-slate-400 to-slate-600 text-slate-900 border-2 border-slate-700 shadow-inner font-serif',
        secondary:
          'bg-gradient-to-b from-purple-400 to-purple-600 text-purple-100 border-2 border-purple-800 shadow-inner font-serif',
        success:
          'bg-gradient-to-b from-emerald-400 to-emerald-600 text-emerald-950 border-2 border-emerald-800 shadow-inner font-serif',
        warning:
          'bg-gradient-to-b from-orange-400 to-orange-600 text-orange-950 border-2 border-orange-800 shadow-inner font-serif',
        danger:
          'bg-gradient-to-b from-red-400 to-red-600 text-red-100 border-2 border-red-800 shadow-inner font-serif',
        info: 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-cyan-950 border-2 border-cyan-800 shadow-inner font-serif',
        tavern:
          'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-100 border-2 border-amber-950 shadow-inner font-serif',
        gold: 'bg-gradient-to-b from-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-700 shadow-inner font-serif font-bold',
        parchment:
          'bg-gradient-to-b from-amber-100 to-amber-300 text-amber-900 border-2 border-amber-600 shadow-inner font-serif',
      },
      seal: {
        primary:
          'bg-gradient-radial from-blue-600 to-blue-800 text-blue-100 rounded-full shadow-lg shadow-blue-900/50 font-serif',
        secondary:
          'bg-gradient-radial from-purple-600 to-purple-800 text-purple-100 rounded-full shadow-lg shadow-purple-900/50 font-serif',
        success:
          'bg-gradient-radial from-green-600 to-green-800 text-green-100 rounded-full shadow-lg shadow-green-900/50 font-serif',
        warning:
          'bg-gradient-radial from-orange-600 to-orange-800 text-orange-100 rounded-full shadow-lg shadow-orange-900/50 font-serif',
        danger:
          'bg-gradient-radial from-red-700 to-red-900 text-red-100 rounded-full shadow-lg shadow-red-900/50 font-serif',
        info: 'bg-gradient-radial from-cyan-600 to-cyan-800 text-cyan-100 rounded-full shadow-lg shadow-cyan-900/50 font-serif',
        tavern:
          'bg-gradient-radial from-amber-700 to-amber-900 text-amber-100 rounded-full shadow-lg shadow-amber-900/50 font-serif',
        gold: 'bg-gradient-radial from-yellow-500 to-amber-600 text-amber-950 rounded-full shadow-lg shadow-yellow-700/50 font-serif font-bold',
        parchment:
          'bg-gradient-radial from-amber-200 to-amber-400 text-amber-900 rounded-full shadow-lg shadow-amber-600/50 font-serif',
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
      tavern: 'bg-amber-500',
      gold: 'bg-yellow-400',
      parchment: 'bg-amber-600',
    };

    return `w-2 h-2 rounded-full ${dotColors[this.variant]} animate-pulse`;
  }
}
