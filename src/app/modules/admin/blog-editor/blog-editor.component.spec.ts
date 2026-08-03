import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, type ParamMap } from '@angular/router';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { BehaviorSubject } from 'rxjs';

import { BlogEditorComponent } from './blog-editor.component';

/** Drives `:id`, so a test can navigate edit/A → edit/B on the same instance. */
let paramMap$: BehaviorSubject<ParamMap>;

/** Stub route so the component takes its edit-mode branch off `:id`. */
function routeWithId(id: string | null) {
  paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap(id ? { id } : {}));
  return {
    provide: ActivatedRoute,
    useValue: {
      snapshot: { paramMap: paramMap$.value },
      paramMap: paramMap$.asObservable(),
    },
  };
}

function navigateToId(id: string): void {
  paramMap$.next(convertToParamMap({ id }));
}

describe('BlogEditorComponent', () => {
  let controller: ApolloTestingController;

  describe('create mode', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [BlogEditorComponent, ApolloTestingModule],
        providers: [provideRouter([]), routeWithId(null)],
      });
      controller = TestBed.inject(ApolloTestingController);
    });

    it('sends CreatePost mutation on submit of a valid form', () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      cmp.postForm.patchValue({ title: 'Hello', content: '<p>Body</p>' });
      cmp.onSubmit();
      const op = controller.expectOne('CreatePost');
      op.flush({ data: { createPost: { id: 'p1', slug: 'hello' } } });
      expect(op.operation.operationName).toBe('CreatePost');
    });

    it('marks form as touched and does not submit when form is invalid', () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      // Leave form empty (invalid)
      cmp.onSubmit();
      controller.expectNone('CreatePost');
      expect(cmp.postForm.get('title')?.touched).toBe(true);
    });

    // Regression guard: the preview is a claim about the URL the server will
    // mint, so it must use the server's slugify options — not a lookalike
    // regex. "Node.js at Scale" is the cheapest title that tells them apart:
    // the old client algorithm produced `node-js-at-scale`.
    it('previews the slug the server would actually mint', () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      fixture.detectChanges();
      fixture.componentInstance.postForm.patchValue({ title: 'Node.js at Scale' });
      fixture.detectChanges();

      const preview = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="slug-preview"]'
      );
      expect(preview).toBeTruthy();
      expect(preview?.textContent?.trim()).toBe('/articles/nodejs-at-scale');
      // Non-ASCII is transliterated server-side, not dropped.
      expect(fixture.componentInstance.generateSlug('Café Rules')).toBe('cafe-rules');
    });

    // Create mode has no status control and always posts DRAFT, so the button
    // must not promise publication.
    it('labels the create action as saving a draft', () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      fixture.detectChanges();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Save draft');
      expect(text).not.toContain('Publish');
    });

    it('clears the spinner and surfaces the message when the save fails', async () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      cmp.postForm.patchValue({ title: 'Hello', content: '<p>Body</p>' });
      cmp.onSubmit();
      controller.expectOne('CreatePost').networkError(new Error('offline'));
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(cmp.isSubmitting()).toBe(false);
      expect(cmp.saveError()).toBeTruthy();
      const banner = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="editor-save-error"]'
      );
      expect(banner).toBeTruthy();
    });

    afterEach(() => controller.verify());
  });

  describe('edit mode', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [BlogEditorComponent, ApolloTestingModule],
        providers: [provideRouter([]), routeWithId('existing-id')],
      });
      controller = TestBed.inject(ApolloTestingController);
    });

    // Regression guard: the editor used to open blank in edit mode, so a submit
    // overwrote the stored title/content with whatever was retyped.
    it('loads the existing post and patches the form', async () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges(); // ngOnInit issues the load query
      expect(cmp.isEditMode()).toBe(true);
      expect(cmp.isLoading()).toBe(true);

      const load = controller.expectOne('PostById');
      expect(load.operation.variables['id']).toBe('existing-id');
      load.flush({
        data: {
          postById: { id: 'existing-id', title: 'Stored title', content: '<p>Stored body</p>' },
        },
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(cmp.isLoading()).toBe(false);
      expect(cmp.loadError()).toBeNull();
      expect(cmp.postForm.value).toEqual({
        title: 'Stored title',
        content: '<p>Stored body</p>',
      });
    });

    it('sends UpdatePost mutation with the route id after loading', async () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      controller.expectOne('PostById').flush({
        data: { postById: { id: 'existing-id', title: 'Stored', content: '<p>Stored</p>' } },
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      cmp.postForm.patchValue({ title: 'Updated', content: '<p>New content</p>' });
      cmp.onSubmit();
      const op = controller.expectOne('UpdatePost');
      op.flush({ data: { updatePost: { id: 'existing-id', slug: 'updated' } } });
      expect(op.operation.variables['id']).toBe('existing-id');
    });

    it('refuses to submit when the post could not be loaded', async () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      controller.expectOne('PostById').networkError(new Error('offline'));
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(cmp.loadError()).toBeTruthy();
      expect(cmp.canSubmit()).toBe(false);
      const banner = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="editor-load-error"]'
      );
      expect(banner).toBeTruthy();

      // A submit here would blank the stored post — it must not reach the server.
      cmp.postForm.patchValue({ title: 'Whatever', content: '<p>Whatever</p>' });
      cmp.onSubmit();
      controller.expectNone('UpdatePost');
    });

    // Regression guard: the id came from `route.snapshot`, and `edit/:id` is a
    // single route definition — so navigating edit/A → edit/B reused the
    // component without re-running ngOnInit. The form kept A's content and
    // `postId` stayed A, so a submit wrote A back to A while the URL said B.
    it('reloads and re-targets when the route id changes on the same instance', async () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      const cmp = fixture.componentInstance;
      fixture.detectChanges();
      controller.expectOne('PostById').flush({
        data: { postById: { id: 'existing-id', title: 'Post A', content: '<p>Body A</p>' } },
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
      expect(cmp.postForm.value.title).toBe('Post A');

      navigateToId('other-id');
      fixture.detectChanges();

      const second = controller.expectOne('PostById');
      expect(second.operation.variables['id']).toBe('other-id');
      second.flush({
        data: { postById: { id: 'other-id', title: 'Post B', content: '<p>Body B</p>' } },
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(cmp.postForm.value.title).toBe('Post B');
      expect(cmp.postForm.value.content).toBe('<p>Body B</p>');

      cmp.onSubmit();
      const update = controller.expectOne('UpdatePost');
      expect(update.operation.variables['id']).toBe('other-id');
      update.flush({ data: { updatePost: { id: 'other-id', slug: 'post-b' } } });
    });

    afterEach(() => controller.verify());
  });
});
