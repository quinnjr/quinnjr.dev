import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CardComponent, CardBodyComponent } from '../../shared/components/ui';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CardComponent, CardBodyComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesComponent {}
