import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

// Hoisted out of the getter: pure data, identical for every instance, so
// there is no reason to re-allocate the table on each change detection pass.
const BASE_CLASSES =
  'rounded-[2px] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-gilt';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'border border-amber/30 bg-panel/85',
  elevated: 'border border-amber/30 bg-panel-hi/90 shadow-elevation',
  outlined: 'border border-amber/45 bg-transparent',
  ghost: 'bg-transparent',
};

const HOVER_CLASSES = 'hover:border-amber/55 hover:shadow-glow motion-safe:hover:-translate-y-1';

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
    <div class="border-b border-amber/20 p-6">
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
    <div class="border-t border-amber/20 p-6">
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
    <h3 class="mb-2 font-heading text-xl text-parchment">
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
    <p class="font-body text-sm text-muted">
      <ng-content></ng-content>
    </p>
  `,
  styles: [],
})
export class CardSubtitleComponent {}
