import { type Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Manifesto — its own immersive "grimoire" layout (no app shell) ──────────
  {
    path: 'slm',
    loadChildren: () => import('./pages/slm/slm.routes').then(m => m.routes),
  },

  // ── Admin — its own layout (no app shell) ───────────────────────────────────
  {
    path: 'admin',
    loadComponent: () =>
      import('./modules/admin/admin-layout/admin-layout.component').then(
        m => m.AdminLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/admin/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          ),
      },
      {
        path: 'articles',
        loadComponent: () =>
          import('./modules/admin/blog-list/blog-list.component').then(m => m.BlogListComponent),
      },
      {
        path: 'articles/new',
        loadComponent: () =>
          import('./modules/admin/blog-editor/blog-editor.component').then(
            m => m.BlogEditorComponent
          ),
      },
      {
        path: 'articles/edit/:id',
        loadComponent: () =>
          import('./modules/admin/blog-editor/blog-editor.component').then(
            m => m.BlogEditorComponent
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./modules/admin/passkeys/passkey-manager.component').then(
            m => m.PasskeyManagerComponent
          ),
      },
    ],
  },

  // ── Everything else — shared app shell (navbar + footer) ────────────────────
  {
    path: '',
    loadComponent: () => import('./components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'resume',
        loadComponent: () => import('./pages/resume/resume.component').then(m => m.ResumeComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'articles',
        loadComponent: () =>
          import('./pages/articles/articles.component').then(m => m.ArticlesComponent),
      },
      {
        path: 'articles/:slug',
        loadComponent: () =>
          import('./pages/article-detail/article-detail.component').then(
            m => m.ArticleDetailComponent
          ),
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      // Terminal catch-all — must stay last. Inside the shell so an unknown
      // URL keeps the nav and footer, and so it renders a real 404 page
      // instead of an empty outlet the server would serve as a soft 404.
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
      },
    ],
  },
];
