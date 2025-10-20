import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

import { slideInAnimation } from './animations';
import { NavigationComponent } from "./navigation/navigation.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavigationComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [slideInAnimation]
})
export class AppComponent {

  private activatedRoute = inject(ActivatedRoute);

  constructor(
  ) {}

  public getRouteAnimationData(): Observable<string | undefined> {
    return this.activatedRoute.data
      .pipe(
        map((data) => data['animation'])
      );
  }

}
