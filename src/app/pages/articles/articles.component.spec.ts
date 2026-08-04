import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';

import { ArticlesComponent } from './articles.component';

describe('ArticlesComponent', () => {
  let component: ArticlesComponent;
  let fixture: ComponentFixture<ArticlesComponent>;
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticlesComponent, ApolloTestingModule],
      // The list rows carry `routerLink`. Under zoneless change detection
      // `whenStable()` waits for the scheduled refresh, so those rows really do
      // render once the query flushes — and `RouterLink` then needs a router.
      providers: [provideRouter([])],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
    fixture = TestBed.createComponent(ArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('leaves the loading state until the query resolves', () => {
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
  });

  it('lists the published posts', async () => {
    controller.expectOne('PublishedPosts').flush({
      data: {
        publishedPosts: [
          {
            id: '1',
            title: 'First',
            slug: 'first',
            excerpt: null,
            publishedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.posts().length).toBe(1);
  });

  // Regression: with no error callback the template's empty state claimed the
  // chronicle was simply unwritten, when the fetch had actually failed.
  it('surfaces a failed fetch as an error rather than an empty archive', async () => {
    controller.expectOne('PublishedPosts').networkError(new Error('offline'));
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeTruthy();
    expect(component.posts()).toEqual([]);
  });
});
