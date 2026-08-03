import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

// Hoisted out of the getter: pure data, identical for every instance, so
// there is no reason to re-allocate the table on each change detection pass.
const BASE_CLASSES = 'rounded-xl transition-all duration-300';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700',
  elevated: 'bg-gray-800/70 backdrop-blur-md shadow-lg shadow-black/20',
  outlined: 'bg-transparent border-2 border-gray-700',
  ghost: 'bg-transparent',
};

const HOVER_CLASSES =
  'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1';

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
    const hoverClasses = this.hover ? HOVER_CLASSES : '';

    return `${BASE_CLASSES} ${VARIANT_CLASSES[this.variant]} ${hoverClasses} ${this.classOverride}`.trim();
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
