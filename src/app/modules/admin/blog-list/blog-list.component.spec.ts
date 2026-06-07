import { TestBed } from '@angular/core/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { provideRouter } from '@angular/router';
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

  afterEach(() => controller.verify());
});
