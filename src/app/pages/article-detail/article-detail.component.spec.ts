import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { BehaviorSubject } from 'rxjs';

import { ArticleDetailComponent } from './article-detail.component';

describe('ArticleDetailComponent', () => {
  let fixture: ComponentFixture<ArticleDetailComponent>;
  let component: ArticleDetailComponent;
  let controller: ApolloTestingController;
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function post(slug: string, title: string) {
    return {
      id: slug,
      title,
      content: `<p>${title}</p>`,
      excerpt: null,
      featuredImage: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: '2024-01-01T00:00:00.000Z',
      updatedAt: null,
      author: { id: '1', name: 'Joseph R. Quinn' },
    };
  }

  function postOp(slug: string) {
    return controller.expectOne(op => op.operationName === 'Post' && op.variables['slug'] === slug);
  }

  beforeEach(async () => {
    paramMap = new BehaviorSubject(convertToParamMap({ slug: 'first' }));

    await TestBed.configureTestingModule({
      imports: [ArticleDetailComponent, ApolloTestingModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap.asObservable() } },
      ],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
    fixture = TestBed.createComponent(ArticleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the requested article', async () => {
    postOp('first').flush({ data: { post: post('first', 'First') } });
    await fixture.whenStable();

    expect(component.post()?.title).toBe('First');
    expect(component.loaded()).toBe(true);
    expect(component.failed()).toBe(false);
  });

  // Regression: reading route.snapshot once left the previous article's body
  // and metadata in place, because the router reuses the component instance.
  it('re-fetches when only the slug changes', async () => {
    postOp('first').flush({ data: { post: post('first', 'First') } });
    await fixture.whenStable();

    paramMap.next(convertToParamMap({ slug: 'second' }));
    postOp('second').flush({ data: { post: post('second', 'Second') } });
    await fixture.whenStable();

    expect(component.post()?.title).toBe('Second');
  });

  // Regression: a query failure with no error callback left `loaded` false, so
  // neither the article nor the fallback card rendered — a blank page forever.
  it('reports a failed fetch instead of rendering nothing', async () => {
    postOp('first').networkError(new Error('offline'));
    await fixture.whenStable();

    expect(component.loaded()).toBe(true);
    expect(component.failed()).toBe(true);
    expect(component.post()).toBeNull();
  });

  it('recovers on a later slug after a failure', async () => {
    postOp('first').networkError(new Error('offline'));
    await fixture.whenStable();

    paramMap.next(convertToParamMap({ slug: 'second' }));
    postOp('second').flush({ data: { post: post('second', 'Second') } });
    await fixture.whenStable();

    expect(component.failed()).toBe(false);
    expect(component.post()?.title).toBe('Second');
  });

  it('treats a null post as a genuine 404', async () => {
    postOp('first').flush({ data: { post: null } });
    await fixture.whenStable();

    expect(component.loaded()).toBe(true);
    expect(component.failed()).toBe(false);
    expect(component.post()).toBeNull();
  });
});
