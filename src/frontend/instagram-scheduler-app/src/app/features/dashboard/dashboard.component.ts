import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService } from '../../core/services/posts.service';
import { AccountsService } from '../../core/services/accounts.service';
import { Post, PostStatus } from '../../core/models/post.model';
import { InstagramAccount } from '../../core/models/account.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <h1>🏠 Dashboard</h1>
      <div class="stats">
        <div class="stat-card"><span class="num">{{ accounts.length }}</span><span>Cuentas conectadas</span></div>
        <div class="stat-card"><span class="num">{{ scheduled }}</span><span>Posts programados</span></div>
        <div class="stat-card"><span class="num">{{ published }}</span><span>Posts publicados</span></div>
        <div class="stat-card"><span class="num">{{ drafts }}</span><span>Borradores</span></div>
      </div>
      <div class="section">
        <h2>Próximos posts</h2>
        <div *ngIf="upcoming.length === 0" class="empty">No hay posts programados. <a routerLink="/posts">Crear uno</a></div>
        <div class="post-list">
          <div class="post-item" *ngFor="let p of upcoming">
            <div class="post-meta">
              <span class="account">@{{ p.accountUsername }}</span>
              <span class="time">{{ p.scheduledAt | date:'dd/MM HH:mm' }}</span>
            </div>
            <p class="caption">{{ p.caption | slice:0:100 }}{{ p.caption.length > 100 ? '...' : '' }}</p>
            <span class="badge" [class]="p.status.toLowerCase()">{{ p.status }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    h1 { font-size: 1.8rem; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 4px; }
    .num { font-size: 2.5rem; font-weight: bold; color: #e1306c; }
    .section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { margin-bottom: 16px; }
    .post-item { border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .post-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .account { font-weight: bold; color: #e1306c; }
    .time { color: #888; font-size: 0.9rem; }
    .caption { color: #444; margin: 0 0 8px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .badge.scheduled { background: #e3f2fd; color: #1976d2; }
    .badge.published { background: #e8f5e9; color: #388e3c; }
    .badge.draft { background: #f5f5f5; color: #666; }
    .empty { color: #888; }
    .empty a { color: #e1306c; }
  `]
})
export class DashboardComponent implements OnInit {
  private postsService = inject(PostsService);
  private accountsService = inject(AccountsService);
  posts: Post[] = [];
  accounts: InstagramAccount[] = [];
  get scheduled() { return this.posts.filter(p => p.status === PostStatus.Scheduled).length; }
  get published() { return this.posts.filter(p => p.status === PostStatus.Published).length; }
  get drafts() { return this.posts.filter(p => p.status === PostStatus.Draft).length; }
  get upcoming() { return this.posts.filter(p => p.status === PostStatus.Scheduled).slice(0, 5); }

  ngOnInit() {
    this.postsService.getAll().subscribe(p => this.posts = p);
    this.accountsService.getAll().subscribe(a => this.accounts = a);
  }
}
