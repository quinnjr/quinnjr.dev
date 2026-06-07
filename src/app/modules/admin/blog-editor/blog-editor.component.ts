import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { QuillModule } from 'ngx-quill';

import { ButtonComponent } from '../../../shared/components/ui';

const CREATE_POST = gql`
  mutation CreatePost($input: CreateBlogPostInput!) {
    createPost(input: $input) {
      id
      slug
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($id: String!, $input: UpdateBlogPostInput!) {
    updatePost(id: $id, input: $input) {
      id
      slug
    }
  }
`;

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ isEditMode ? 'Edit Blog Post' : 'Create New Blog Post' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              {{ isEditMode ? 'Update your existing post' : 'Write and publish a new article' }}
            </p>
          </div>
          <app-button (click)="goBack()" variant="ghost">
            <i class="fas fa-arrow-left mr-2"></i>Back
          </app-button>
        </div>

        <!-- Form -->
        <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Main Content Card -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <i class="fas fa-edit mr-2"></i>Content
            </h2>

            <!-- Title -->
            <div class="mb-4">
              <label
                for="title"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                formControlName="title"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title"
              />
              @if (postForm.get('title')?.invalid && postForm.get('title')?.touched) {
                <p class="mt-1 text-sm text-red-600">Title is required</p>
              }
            </div>

            <!-- Slug Preview -->
            @if (postForm.get('title')?.value) {
              <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  URL:
                  <span class="font-mono text-blue-600 dark:text-blue-400">
                    /blog/{{ generateSlug(postForm.get('title')?.value) }}
                  </span>
                </p>
              </div>
            }

            <!-- Content Editor -->
            <div class="mb-4">
              <label
                for="content"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Content *
              </label>
              <quill-editor
                id="content"
                formControlName="content"
                [modules]="quillModules"
                [styles]="{ height: '400px' }"
                class="bg-white dark:bg-gray-700 rounded-md"
              >
              </quill-editor>
              @if (postForm.get('content')?.invalid && postForm.get('content')?.touched) {
                <p class="mt-1 text-sm text-red-600">Content is required</p>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <app-button type="button" (click)="goBack()" variant="ghost"> Cancel </app-button>

            <app-button
              type="submit"
              [disabled]="postForm.invalid || isSubmitting"
              [loading]="isSubmitting"
              variant="primary"
            >
              @if (!isSubmitting) {
                <i class="fas fa-paper-plane mr-2"></i>
              }
              {{ isEditMode ? 'Update' : 'Publish' }}
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [],
})
export class BlogEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly apollo = inject(Apollo);

  postForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  postId?: string;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
      ['link', 'image'],
    ],
  };

  ngOnInit(): void {
    this.initForm();
    this.postId = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.postId) {
      this.isEditMode = true;
    }
  }

  initForm = (): void => {
    this.postForm = this.fb.group({
      // eslint-disable-next-line @typescript-eslint/unbound-method
      title: ['', Validators.required],
      // eslint-disable-next-line @typescript-eslint/unbound-method
      content: ['', Validators.required],
    });
  };

  generateSlug(title: string | null | undefined): string {
    if (!title) {
      return '';
    }
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  onSubmit = (): void => {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    const { title, content } = this.postForm.value as { title: string; content: string };

    // On update, omit `status` so an existing post's published state is preserved
    // (the editor has no status control yet). New posts start as DRAFT.
    const op = this.isEditMode
      ? this.apollo.mutate({
          mutation: UPDATE_POST,
          variables: { id: this.postId, input: { title, content } },
        })
      : this.apollo.mutate({
          mutation: CREATE_POST,
          variables: { input: { title, content, status: 'DRAFT' as const } },
        });

    op.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/articles']).catch(() => {
          // Navigation error handled
        });
      },
      error: (err: unknown) => {
        this.isSubmitting = false;

        console.error('Failed to save post', err);
      },
    });
  };

  goBack = (): void => {
    this.router.navigate(['/admin/articles']).catch(() => {
      // Navigation error handled
    });
  };
}
