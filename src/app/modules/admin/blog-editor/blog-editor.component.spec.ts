import { TestBed } from '@angular/core/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { provideRouter } from '@angular/router';
import { BlogEditorComponent } from './blog-editor.component';

describe('BlogEditorComponent', () => {
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BlogEditorComponent, ApolloTestingModule],
      providers: [provideRouter([])],
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

  it('sends UpdatePost mutation in edit mode', () => {
    const fixture = TestBed.createComponent(BlogEditorComponent);
    const cmp = fixture.componentInstance;
    // Set edit state AFTER detectChanges: ngOnInit derives postId from the route
    // param (absent here) and would otherwise clobber a value set beforehand.
    fixture.detectChanges();
    cmp.isEditMode = true;
    cmp.postId = 'existing-id';
    cmp.postForm.patchValue({ title: 'Updated', content: '<p>New content</p>' });
    cmp.onSubmit();
    const op = controller.expectOne('UpdatePost');
    op.flush({ data: { updatePost: { id: 'existing-id', slug: 'updated' } } });
    expect(op.operation.operationName).toBe('UpdatePost');
    expect(op.operation.variables['id']).toBe('existing-id');
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

  afterEach(() => controller.verify());
});
