import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideLocationMocks } from '@angular/common/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('should have 8 navigation items', () => {
    expect(component.navbarItems().length).toBe(8);
  });

  it('should have SLM Manifesto link', () => {
    const slmItem = component.navbarItems().find(item => item.title === 'SLM Manifesto');
    expect(slmItem?.link).toBe('/slm');
  });

  it("should have Parkinson's Map link", () => {
    const mapItem = component.navbarItems().find(item => item.title === "Parkinson's Map");
    expect(mapItem).toBeDefined();
    expect(mapItem?.link).toBe('https://parkinsons.quinnjr.dev/');
    expect(mapItem?.icon).toBe('fas fa-diagram-project');
    expect(mapItem?.external).toBe(true);
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
