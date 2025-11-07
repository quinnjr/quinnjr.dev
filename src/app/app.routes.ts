import { type Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
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
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/callback/callback.component').then(m => m.CallbackComponent),
  },
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
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
