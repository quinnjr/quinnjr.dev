import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'parchment' | 'wood' | 'tavern';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() hover = true;
  @Input() classOverride = '';

  get cardClasses(): string {
    const baseClasses = 'rounded-xl transition-all duration-300';

    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700',
      elevated: 'bg-gray-800/70 backdrop-blur-md shadow-lg shadow-black/20',
      outlined: 'bg-transparent border-2 border-gray-700',
      ghost: 'bg-transparent',
      parchment:
        'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 border-4 border-amber-800 shadow-lg shadow-black/30 text-amber-900',
      wood:
        'bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-4 border-amber-950 shadow-lg shadow-black/40 text-amber-100',
      tavern:
        'bg-amber-950/90 backdrop-blur-sm border-2 border-amber-800 shadow-lg shadow-orange-900/30 text-amber-100',
    };

    const hoverClassesByVariant: Record<CardVariant, string> = {
      default: 'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1',
      elevated: 'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1',
      outlined: 'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1',
      ghost: 'hover:bg-gray-800/20',
      parchment: 'hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 hover:border-orange-600',
      wood: 'hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-1',
      tavern: 'hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1',
    };

    const hoverClasses = this.hover ? hoverClassesByVariant[this.variant] : '';

    return `${baseClasses} ${variantClasses[this.variant]} ${hoverClasses} ${this.classOverride}`.trim();
  }
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 border-b border-gray-700">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class CardHeaderComponent {}

@Component({
  selector: 'app-card-body',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class CardBodyComponent {}

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 border-t border-gray-700">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class CardFooterComponent {}

@Component({
  selector: 'app-card-title',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-xl font-bold text-white mb-2">
      <ng-content></ng-content>
    </h3>
  `,
  styles: [],
})
export class CardTitleComponent {}

@Component({
  selector: 'app-card-subtitle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-sm text-gray-400">
      <ng-content></ng-content>
    </p>
  `,
  styles: [],
})
export class CardSubtitleComponent {}
