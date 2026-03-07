import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-naviation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  public navbarItems = signal([
    {
      title: 'Tavern',
      link: '/',
      icon: 'fas fa-fire',
    },
    {
      title: 'Quest Log',
      link: '/resume',
      icon: 'fas fa-scroll',
    },
    {
      title: 'Crafted Works',
      link: '/projects',
      icon: 'fas fa-hammer',
    },
    {
      title: 'Chronicles',
      link: '/articles',
      icon: 'fas fa-book-open',
    },
    {
      title: 'Guild Hall',
      link: 'https://www.linkedin.com/in/quinnjosephr/',
      icon: 'fas fa-users',
      external: true,
    },
    {
      title: 'Arcane Repository',
      link: 'https://github.com/quinnjr',
      icon: 'fas fa-code-branch',
      external: true,
    },
    {
      title: 'Forge',
      link: 'https://pegausheavy.dev',
      icon: 'fas fa-shield-alt',
      external: true,
    },
  ]);

  public isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
