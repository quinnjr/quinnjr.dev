import { Component, inject, OnInit, signal } from '@angular/core';

import { FlowbiteService } from '../services/flowbite.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-naviation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  public navbarItems = signal([
    {
      title: 'Home',
      link: '/',
      icon: 'fas fa-home'
    },
    {
      title: 'Articles',
      link: '/articles',
      icon: 'fas fa-newspaper'
    },
    {
      title: 'Resume',
      link: '/resume',
      icon: 'fas fa-user-graduate'
    },
    {
      title: 'Projects',
      link: '/projects',
      icon: 'fas fa-project-diagram'
    },
    {
      title: 'Github',
      link: 'https://github.com/quinnjr',
      icon: 'fab fa-github',
      external: true
    }
  ]);

  private flowbiteService = inject(FlowbiteService);

  constructor() {}

  public ngOnInit() {
    this.flowbiteService.loadFlowbite(flowbite => {
      flowbite.init();
    });
  }
}
