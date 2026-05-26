import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell" *ngIf="auth.isLoggedIn; else noNav">
      <nav class="sidebar">
        <div class="logo">📸 Scheduler</div>
        <a routerLink="/dashboard" routerLinkActive="active">🏠 Dashboard</a>
        <a routerLink="/calendar" routerLinkActive="active">📅 Calendario</a>
        <a routerLink="/posts" routerLinkActive="active">✍️ Posts</a>
        <a routerLink="/ai-writer" routerLinkActive="active">🤖 IA Writer</a>
        <a routerLink="/accounts" routerLinkActive="active">👤 Cuentas</a>
        <div class="spacer"></div>
        <button (click)="auth.logout()">Cerrar sesión</button>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
    <ng-template #noNav><router-outlet /></ng-template>
  `,
  styles: [`
    .app-shell { display: flex; height: 100vh; }
    .sidebar { width: 220px; background: #1a1a2e; color: white; display: flex; flex-direction: column; padding: 20px; gap: 8px; }
    .logo { font-size: 1.2rem; font-weight: bold; margin-bottom: 20px; }
    .sidebar a { color: #ccc; text-decoration: none; padding: 10px 12px; border-radius: 8px; }
    .sidebar a.active, .sidebar a:hover { background: #e1306c; color: white; }
    .spacer { flex: 1; }
    .sidebar button { background: transparent; border: 1px solid #555; color: #aaa; padding: 8px; border-radius: 6px; cursor: pointer; }
    .content { flex: 1; overflow: auto; background: #f8f9fa; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
}
