import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';

import { BlogEditorComponent } from './blog-editor.component';

/** Stub route so the component takes its edit-mode branch off `:id`. */
function routeWithId(id: string | null) {
  return {
    provide: ActivatedRoute,
    useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
  };
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

    // Regression guard: the preview used to call a non-existent
    // `$safeNavigationMigration` helper, so this block threw on first keystroke.
    it('renders the slug preview against the real /articles/ route once a title is typed', () => {
      const fixture = TestBed.createComponent(BlogEditorComponent);
      fixture.detectChanges();
      fixture.componentInstance.postForm.patchValue({ title: 'Hello There World' });
      fixture.detectChanges();

      const preview = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="slug-preview"]'
      );
      expect(preview).toBeTruthy();
      expect(preview?.textContent?.trim()).toBe('/articles/hello-there-world');
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

    afterEach(() => controller.verify());
  });
});
