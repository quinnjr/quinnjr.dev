// Button
export * from './button.component';

// Card
export * from './card.component';

// Badge
export * from './badge.component';

// Export all components as a single array for easy importing
import { BadgeComponent } from './badge.component';
import { ButtonComponent } from './button.component';
import {
  CardComponent,
  CardHeaderComponent,
  CardBodyComponent,
  CardFooterComponent,
  CardTitleComponent,
  CardSubtitleComponent,
} from './card.component';

export const UI_COMPONENTS = [
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardBodyComponent,
  CardFooterComponent,
  CardTitleComponent,
  CardSubtitleComponent,
  BadgeComponent,
] as const;

