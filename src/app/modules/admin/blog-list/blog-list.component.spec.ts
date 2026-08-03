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

  // Regression guard: Apollo 4 emits an in-flight result first. Treating it as
  // data told an author "No articles yet" before the server had answered.
  it('renders a loading state, not the empty state, while the query is in flight', () => {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBe(true);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="posts-loading"]')).toBeTruthy();
    expect(host.textContent).not.toContain('No articles yet');
    expect(host.textContent).not.toContain('Create Your First Article');

    // Settle the operation so `controller.verify()` in afterEach passes.
    controller.expectOne('AdminPosts').flush({ data: { posts: [] } });
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No articles yet');
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
