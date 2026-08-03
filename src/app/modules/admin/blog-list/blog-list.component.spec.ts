import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';

import { BlogListComponent } from './blog-list.component';

describe('BlogListComponent', () => {
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BlogListComponent, ApolloTestingModule],
      providers: [provideRouter([])],
    });
    controller = TestBed.inject(ApolloTestingController);
  });

  it('queries admin posts on init', () => {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges(); // triggers ngOnInit
    const op = controller.expectOne('AdminPosts');
    op.flush({
      data: {
        posts: [{ id: 'p1', title: 'Hello', status: 'DRAFT', updatedAt: '2024-01-01T00:00:00Z' }],
      },
    });
    expect(op.operation.operationName).toBe('AdminPosts');
    fixture.detectChanges();
    expect(fixture.componentInstance.posts().length).toBe(1);
  });

  // Regression guard: the subscription had no error callback, so an outage or
  // auth failure rendered the "No articles yet" empty state to an author who
  // does have articles.
  it('renders a failure state, not the empty state, when the query errors', async () => {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges();
    controller.expectOne('AdminPosts').networkError(new Error('offline'));
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTruthy();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="posts-load-error"]')).toBeTruthy();
    expect(host.textContent).not.toContain('No articles yet');
  });

  afterEach(() => controller.verify());
});
