import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { FlowbiteService } from '../../services/flowbite.service';

@Component({
  selector: 'app-naviation',
  standalone: true,
  imports: [RouterLink, AuthButtonComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent implements OnInit {
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

  private flowbiteService = inject(FlowbiteService);

  public ngOnInit() {
    this.flowbiteService.loadFlowbite(flowbite => {
      flowbite.init();
    });
  }
}
