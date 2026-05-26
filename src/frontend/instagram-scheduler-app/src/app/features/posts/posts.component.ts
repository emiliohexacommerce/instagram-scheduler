import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostsService } from '../../core/services/posts.service';
import { AccountsService } from '../../core/services/accounts.service';
import { Post, PostStatus, PostType, CreatePostRequest } from '../../core/models/post.model';
import { InstagramAccount } from '../../core/models/account.model';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>✍️ Posts</h1>
        <button class="btn-primary" (click)="showForm = !showForm">{{ showForm ? '✕ Cerrar' : '+ Nuevo Post' }}</button>
      </div>

      <!-- Formulario nuevo post -->
      <div class="form-card" *ngIf="showForm">
        <h2>Crear Post</h2>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Cuenta</label>
          <select formControlName="accountId">
            <option *ngFor="let a of accounts" [value]="a.id">&#64;{{ a.username }}</option>
          </select>
          <label>Caption</label>
          <textarea formControlName="caption" rows="4" placeholder="Escribe tu caption..."></textarea>
          <label>Hashtags</label>
          <input formControlName="hashtags" placeholder="#slotium #agenda #chile" />
          <label>URL de imagen</label>
          <input formControlName="imageUrl" placeholder="https://..." />
          <label>Programar para</label>
          <input formControlName="scheduledAt" type="datetime-local" />
          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="saveDraft()">Guardar borrador</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
              {{ loading ? 'Guardando...' : 'Programar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <button *ngFor="let f of filters" [class.active]="activeFilter === f" (click)="activeFilter = f">{{ f }}</button>
      </div>

      <!-- Lista de posts -->
      <div class="posts-list">
        <div class="post-card" *ngFor="let p of filteredPosts">
          <div class="post-header">
            <span class="account">&#64;{{ p.accountUsername }}</span>
            <span class="badge" [class]="p.status.toLowerCase()">{{ p.status }}</span>
          </div>
          <p class="caption">{{ p.caption }}</p>
          <p class="hashtags" *ngIf="p.hashtags">{{ p.hashtags }}</p>
          <div class="post-footer">
            <span class="date" *ngIf="p.scheduledAt">📅 {{ p.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
            <div class="actions">
              <button *ngIf="p.status !== 'Published'" class="btn-sm btn-publish" (click)="publishNow(p)">Publicar ya</button>
              <button class="btn-sm btn-delete" (click)="delete(p)">Eliminar</button>
            </div>
          </div>
        </div>
        <div *ngIf="filteredPosts.length === 0" class="empty">No hay posts en esta categoría.</div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { font-size: 1.8rem; }
    .btn-primary { background: #e1306c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .btn-outline { background: transparent; border: 1px solid #e1306c; color: #e1306c; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; }
    .form-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
    h2 { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 4px; margin-top: 12px; color: #555; font-size: 0.9rem; }
    select, input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }
    .filters { display: flex; gap: 8px; margin-bottom: 20px; }
    .filters button { padding: 6px 16px; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; }
    .filters button.active { background: #e1306c; color: white; border-color: #e1306c; }
    .posts-list { display: flex; flex-direction: column; gap: 12px; }
    .post-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .account { font-weight: bold; color: #e1306c; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .badge.scheduled { background: #e3f2fd; color: #1976d2; }
    .badge.published { background: #e8f5e9; color: #388e3c; }
    .badge.draft { background: #f5f5f5; color: #666; }
    .badge.failed { background: #ffebee; color: #c62828; }
    .caption { color: #333; margin: 0 0 6px; }
    .hashtags { color: #405de6; font-size: 0.9rem; margin: 0 0 10px; }
    .post-footer { display: flex; justify-content: space-between; align-items: center; }
    .date { color: #888; font-size: 0.85rem; }
    .actions { display: flex; gap: 8px; }
    .btn-sm { padding: 4px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; }
    .btn-publish { background: #405de6; color: white; }
    .btn-delete { background: transparent; border: 1px solid #f44336; color: #f44336; }
    .empty { text-align: center; color: #aaa; padding: 40px; }
  `]
})
export class PostsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postsService = inject(PostsService);
  private accountsService = inject(AccountsService);
  posts: Post[] = [];
  accounts: InstagramAccount[] = [];
  showForm = false;
  loading = false;
  filters = ['Todos', 'Programados', 'Publicados', 'Borradores', 'Fallidos'];
  activeFilter = 'Todos';

  form = this.fb.group({
    accountId: ['', Validators.required],
    caption: ['', Validators.required],
    hashtags: [''],
    imageUrl: ['', Validators.required],
    scheduledAt: ['']
  });

  get filteredPosts() {
    if (this.activeFilter === 'Todos') return this.posts;
    const map: Record<string, PostStatus> = { 'Programados': PostStatus.Scheduled, 'Publicados': PostStatus.Published, 'Borradores': PostStatus.Draft, 'Fallidos': PostStatus.Failed };
    return this.posts.filter(p => p.status === map[this.activeFilter]);
  }

  ngOnInit() {
    this.postsService.getAll().subscribe(p => this.posts = p);
    this.accountsService.getAll().subscribe(a => this.accounts = a);
  }

  buildRequest(scheduled: boolean): CreatePostRequest {
    const v = this.form.value;
    return {
      accountId: Number(v.accountId),
      caption: v.caption ?? '',
      hashtags: v.hashtags || undefined,
      mediaUrls: v.imageUrl ? [v.imageUrl] : [],
      type: PostType.Image,
      scheduledAt: scheduled && v.scheduledAt ? new Date(v.scheduledAt) : undefined
    };
  }

  saveDraft() {
    if (this.form.invalid) return;
    this.loading = true;
    this.postsService.create({ ...this.buildRequest(false), scheduledAt: undefined }).subscribe({
      next: p => { this.posts.unshift(p); this.showForm = false; this.form.reset(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.postsService.create(this.buildRequest(true)).subscribe({
      next: p => { this.posts.unshift(p); this.showForm = false; this.form.reset(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  publishNow(p: Post) {
    if (confirm('¿Publicar este post ahora en Instagram?'))
      this.postsService.publishNow(p.id).subscribe(updated => Object.assign(p, updated));
  }

  delete(p: Post) {
    if (confirm('¿Eliminar este post?'))
      this.postsService.delete(p.id).subscribe(() => this.posts = this.posts.filter(x => x.id !== p.id));
  }
}
