import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
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
          <button
            (click)="goBack()"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <i class="fas fa-arrow-left mr-2"></i>Back
          </button>
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
            <button
              type="button"
              (click)="goBack()"
              class="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              [disabled]="postForm.invalid || isSubmitting"
              class="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isSubmitting) {
                <i class="fas fa-spinner fa-spin mr-2"></i>Saving...
              } @else {
                <i class="fas fa-paper-plane mr-2"></i>{{ isEditMode ? 'Update' : 'Publish' }}
              }
            </button>
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
    if (this.postForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    // eslint-disable-next-line no-console
    console.log('Submitting:', this.postForm.value);
    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/admin/articles']).catch(() => {
        // Navigation error handled
      });
    }, 1000);
  };

  goBack = (): void => {
    this.router.navigate(['/admin/articles']).catch(() => {
      // Navigation error handled
    });
  };
}
