import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';

import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, ApolloTestingModule],
      providers: [provideRouter([])],
    });
    controller = TestBed.inject(ApolloTestingController);
  });

  // Regression guard: the tiles used to render hard-coded literals, so an admin
  // with posts still saw "Articles: 0".
  it('renders the real article count from the posts query', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    controller.expectOne('AdminPostCount').flush({
      data: { posts: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }] },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.articleCount()).toBe(3);
    const tile = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="article-count"]'
    );
    expect(tile?.textContent?.trim()).toBe('3');
  });

  // Regression guard: Apollo 4 emits an in-flight result before the response
  // lands. Treating it as data rendered a hard "0" for the whole request.
  it('renders the dash, not a zero, while the count query is in flight', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.componentInstance.articleCount()).toBeNull();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="article-count"]')).toBeNull();
    expect(host.textContent).toContain('—');

    // Settle the operation so `controller.verify()` in afterEach passes.
    controller.expectOne('AdminPostCount').flush({ data: { posts: [{ id: 'p1' }] } });
    fixture.detectChanges();
    expect(fixture.componentInstance.articleCount()).toBe(1);
  });

  it('shows the count as unavailable rather than zero when the query fails', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    controller.expectOne('AdminPostCount').networkError(new Error('offline'));
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.articleCountError()).toBe(true);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="article-count-error"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="article-count"]')).toBeNull();
  });

  // These metrics have no backing query, so no tile or button may claim them.
  it('does not render metrics or actions the server cannot answer', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    controller.expectOne('AdminPostCount').flush({ data: { posts: [] } });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Active Sessions');
    expect(text).not.toContain('Total Users');
    expect(text).not.toContain('New Project');
    expect(text).not.toContain('Analytics');
  });

  afterEach(() => controller.verify());
});
