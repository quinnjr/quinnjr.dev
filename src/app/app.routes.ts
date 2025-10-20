import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'resume',
    loadComponent: () => import('./resume/resume.component').then(m => m.ResumeComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'articles',
    loadComponent: () => import('./articles/articles.component').then(m => m.ArticlesComponent)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];
