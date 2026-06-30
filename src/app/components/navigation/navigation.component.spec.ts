import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';

import { NavigationComponent } from './navigation.component';

describe('NavgiationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent, ApolloTestingModule],
      providers: [provideHttpClient(withXhr()), provideRouter([]), provideLocationMocks()],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 7 navigation items', () => {
    expect(component.navbarItems().length).toBe(7);
  });

  it('should have SLM Manifesto link', () => {
    const slmItem = component.navbarItems().find(item => item.title === 'SLM Manifesto');
    expect(slmItem?.link).toBe('/slm');
  });

  it('should have Guild Hall (LinkedIn) link', () => {
    const linkedInItem = component.navbarItems().find(item => item.title === 'Guild Hall');
    expect(linkedInItem).toBeDefined();
    expect(linkedInItem?.link).toBe('https://www.linkedin.com/in/quinnjosephr/');
    expect(linkedInItem?.icon).toBe('fas fa-users');
    expect(linkedInItem?.external).toBe(true);
  });

  it('should have Arcane Repository (GitHub) link', () => {
    const githubItem = component.navbarItems().find(item => item.title === 'Arcane Repository');
    expect(githubItem).toBeDefined();
    expect(githubItem?.link).toBe('https://github.com/quinnjr');
    expect(githubItem?.icon).toBe('fas fa-code-branch');
    expect(githubItem?.external).toBe(true);
  });
});
