import { provideHttpClient } from '@angular/common/http';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationComponent } from './navigation.component';

describe('NavgiationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideLocationMocks(),
        provideAuth0({
          domain: 'test.auth0.com',
          clientId: 'test-client-id',
          authorizationParams: {
            redirect_uri: 'http://localhost:4200',
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 6 navigation items', () => {
    expect(component.navbarItems().length).toBe(6);
  });

  it('should have LinkedIn link', () => {
    const linkedInItem = component.navbarItems().find(item => item.title === 'LinkedIn');
    expect(linkedInItem).toBeDefined();
    expect(linkedInItem?.link).toBe('https://www.linkedin.com/in/quinnjosephr/');
    expect(linkedInItem?.icon).toBe('fab fa-linkedin');
    expect(linkedInItem?.external).toBe(true);
  });

  it('should have Github link', () => {
    const githubItem = component.navbarItems().find(item => item.title === 'Github');
    expect(githubItem).toBeDefined();
    expect(githubItem?.link).toBe('https://github.com/quinnjr');
    expect(githubItem?.icon).toBe('fab fa-github');
    expect(githubItem?.external).toBe(true);
  });
});
