import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthButtonComponent } from '../auth-button/auth-button.component';

@Component({
  selector: 'app-naviation',
  standalone: true,
  imports: [RouterLink, AuthButtonComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  public navbarItems = signal([
    {
      title: 'Home',
      link: '/',
      icon: 'fas fa-home',
    },
    {
      title: 'Articles',
      link: '/articles',
      icon: 'fas fa-newspaper',
    },
    {
      title: 'Resume',
      link: '/resume',
      icon: 'fas fa-user-graduate',
    },
    {
      title: 'Projects',
      link: '/projects',
      icon: 'fas fa-project-diagram',
    },
    {
      title: 'Admin',
      link: '/admin',
      icon: 'fas fa-shield-alt',
    },
    {
      title: 'Github',
      link: 'https://github.com/quinnjr',
      icon: 'fab fa-github',
      external: true,
    },
  ]);
}
