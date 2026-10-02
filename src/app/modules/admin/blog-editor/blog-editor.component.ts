import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { QuillModule } from 'ngx-quill';
import { distinctUntilChanged, map } from 'rxjs';
import slugify from 'slugify';

import { ButtonComponent } from '../../../shared/components/ui';

// The server is the sole author of a post's slug (see `BlogService.generateSlug`).
// The preview must use the identical call, or it advertises a URL the server
// will not mint: "Node.js at Scale" is `nodejs-at-scale`, not `node-js-at-scale`.
// Emitted by the `quill-snow` entry in angular.json with `inject: false`.
const QUILL_STYLESHEET_ID = 'quill-snow-css';
const QUILL_STYLESHEET_HREF = 'quill-snow.css';

const SLUGIFY_OPTIONS = {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g,
} as const;

// `postById` applies the same ownership rule as the admin list, so a post the
// user may not edit resolves to null rather than being filtered client-side.
const POST_BY_ID = gql`
  query PostById($id: String!) {
    postById(id: $id) {
      id
      title
      content
    }
  }
`;

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
    <div class="blog-editor container mx-auto px-4 py-10 md:py-14">
      <!-- Header -->
      <header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="tavern-eyebrow">Admin console</p>
          <h1 class="mt-2 font-medieval text-3xl text-parchment md:text-4xl">
            {{ isEditMode() ? 'Edit article' : 'New article' }}
          </h1>
          <p class="mt-2 font-body text-muted">
            <!-- Create mode always writes a DRAFT: there is no status control
                 in this editor, so it cannot claim to publish. -->
            {{
              isEditMode()
                ? 'Changes save over the existing post.'
                : 'Saved as a draft. Nothing goes live from here.'
            }}
          </p>
        </div>
        <app-button (click)="goBack()" variant="ghost" class="self-start md:self-auto">
          <i class="fas fa-arrow-left mr-2" aria-hidden="true"></i>Back to articles
        </app-button>
      </header>

      @if (isLoading()) {
        <div class="admin-panel space-y-5" data-testid="editor-loading" aria-busy="true">
          <span class="sr-only" role="status">Loading post…</span>
          <span class="skeleton block h-4 w-24" aria-hidden="true"></span>
          <span class="skeleton block h-11 w-full" aria-hidden="true"></span>
          <span class="skeleton block h-4 w-24" aria-hidden="true"></span>
          <span class="skeleton block h-72 w-full" aria-hidden="true"></span>
        </div>
      }

      @if (loadError()) {
        <p class="notice-error mb-6" role="alert" data-testid="editor-load-error">
          <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>{{ loadError() }}
        </p>
      }

      <!-- Form -->
      <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <section class="admin-panel" aria-labelledby="content-heading">
          <h2 id="content-heading" class="admin-panel-title">
            <i class="fas fa-feather-pointed" aria-hidden="true"></i>Content
          </h2>

          <!-- Title -->
          <div class="mb-5">
            <label for="title" class="field-label">Title <span aria-hidden="true">*</span></label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="field-rune"
              placeholder="Why small models win on cost"
              required
              [attr.aria-invalid]="postForm.get('title')?.invalid && postForm.get('title')?.touched"
              aria-describedby="title-error"
            />
            @if (postForm.get('title')?.invalid && postForm.get('title')?.touched) {
              <p id="title-error" class="mt-2 font-mono text-xs text-blood">Title is required</p>
            }
          </div>

          <!-- Slug Preview -->
          @if (postForm.get('title')?.value) {
            <p class="mb-5 border border-ice/20 bg-ice/5 px-3 py-2 font-mono text-xs text-muted">
              URL:
              <span class="text-ice" data-testid="slug-preview">
                /articles/{{ generateSlug(postForm.get('title')?.value) }}
              </span>
            </p>
          }

          <!-- Content Editor -->
          <div>
            <label for="content" class="field-label"
              >Content <span aria-hidden="true">*</span></label
            >
            <quill-editor
              id="content"
              formControlName="content"
              [modules]="quillModules"
              [styles]="{ height: '400px' }"
            >
            </quill-editor>
            @if (postForm.get('content')?.invalid && postForm.get('content')?.touched) {
              <p class="mt-2 font-mono text-xs text-blood">Content is required</p>
            }
          </div>
        </section>

        <!-- Action Buttons -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-amber/20 pt-6"
        >
          <app-button type="button" (click)="goBack()" variant="ghost">Cancel</app-button>

          <app-button
            type="submit"
            [disabled]="postForm.invalid || isSubmitting() || !canSubmit()"
            [loading]="isSubmitting()"
            variant="primary"
          >
            @if (!isSubmitting()) {
              <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>
            }
            {{ isEditMode() ? 'Update' : 'Save draft' }}
          </app-button>
        </div>

        @if (saveError()) {
          <p class="notice-error" role="alert" data-testid="editor-save-error">
            <i class="fas fa-triangle-exclamation mt-0.5" aria-hidden="true"></i>{{ saveError() }}
          </p>
        }
      </form>
    </div>
  `,
  // Quill builds its toolbar/editor DOM itself, outside Angular's template, so
  // emulated encapsulation would never match it. The sheet is scoped under
  // .blog-editor instead and only loads with this lazy admin route.
  styleUrl: './blog-editor.component.scss',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation -- Quill DOM is not template-owned; rules are scoped under .blog-editor
  encapsulation: ViewEncapsulation.None,
})
export class BlogEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly apollo = inject(Apollo);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  postForm!: FormGroup;
  // OnPush: every piece of mutable view state must be a signal, otherwise a
  // mutation performed inside an async callback never marks the view dirty.
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
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
    this.attachQuillStylesheet();
    this.initForm();
    // `articles/edit/:id` is a single route definition, so the router reuses
    // this component when only :id changes. Reading the snapshot once left the
    // form holding post A's content with `postId` still A while the URL said
    // B — a submit then silently wrote A's body back to A.
    this.route.paramMap
      .pipe(
        map(params => params.get('id') ?? undefined),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(id => this.resetFor(id));
  }

  /** Quill's toolbar is unusable without its sheet; attach it once, on demand. */
  private attachQuillStylesheet(): void {
    if (this.document.getElementById(QUILL_STYLESHEET_ID)) {
      return;
    }
    const link = this.document.createElement('link');
    link.id = QUILL_STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = QUILL_STYLESHEET_HREF;
    this.document.head.appendChild(link);
  }

  /** Re-arms the editor for a (possibly different) post id. */
  private resetFor(id: string | undefined): void {
    this.postId = id;
    this.isSubmitting.set(false);
    this.saveError.set(null);
    this.loadError.set(null);
    this.isLoading.set(false);
    this.postForm.reset({ title: '', content: '' });
    this.isEditMode.set(Boolean(id));
    if (id) {
      this.loadPost(id);
    }
  }

  /**
   * Populate the form with the stored post before the user can submit.
   * Submitting an unpopulated form in edit mode would overwrite the stored
   * title/content with empty values, so submit stays disabled until this
   * resolves — and permanently if it fails.
   */
  private loadPost(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.apollo
      .query<{ postById: { id: string; title: string; content: string } | null }>({
        query: POST_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          // A navigation to another id may have landed while this was in
          // flight; the newer load owns the form.
          if (this.postId !== id) {
            return;
          }
          const post = data?.postById ?? null;
          this.isLoading.set(false);
          if (!post) {
            this.loadError.set('That post could not be found, or you do not have access to it.');
            return;
          }
          this.postForm.patchValue({ title: post.title, content: post.content });
        },
        error: (err: unknown) => {
          if (this.postId !== id) {
            return;
          }
          this.isLoading.set(false);
          this.loadError.set('Failed to load this post. Reload the page to try again.');
          console.error('Failed to load post', err);
        },
      });
  }

  /** Never allow a submit that could overwrite stored content with blanks. */
  canSubmit(): boolean {
    return !this.isLoading() && !this.loadError();
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
    return slugify(title, SLUGIFY_OPTIONS);
  }

  onSubmit = (): void => {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting() || !this.canSubmit()) {
      return;
    }
    this.isSubmitting.set(true);
    this.saveError.set(null);

    const { title, content } = this.postForm.value as { title: string; content: string };

    // On update, omit `status` so an existing post's published state is preserved
    // (the editor has no status control yet). New posts start as DRAFT.
    const op = this.isEditMode()
      ? this.apollo.mutate({
          mutation: UPDATE_POST,
          variables: { id: this.postId, input: { title, content } },
        })
      : this.apollo.mutate({
          mutation: CREATE_POST,
          variables: { input: { title, content, status: 'DRAFT' as const } },
        });

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/admin/articles']).catch(() => {
          // Navigation error handled
        });
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.saveError.set(
          err instanceof Error ? err.message : 'Failed to save this post. Please try again.'
        );
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
