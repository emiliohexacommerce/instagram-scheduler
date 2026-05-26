import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'posts',
    loadComponent: () => import('./features/posts/posts.component').then(m => m.PostsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'accounts',
    loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ai-writer',
    loadComponent: () => import('./features/ai-writer/ai-writer.component').then(m => m.AiWriterComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
