import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsService } from '../../core/services/accounts.service';
import { InstagramAccount } from '../../core/models/account.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>👤 Cuentas de Instagram</h1>
        <button class="btn-primary" (click)="showTokenForm = !showTokenForm">
          {{ showTokenForm ? '✕ Cerrar' : '+ Conectar cuenta' }}
        </button>
      </div>

      <div class="token-form" *ngIf="showTokenForm">
        <h2>Conectar con Access Token</h2>
        <p class="hint">Ingresa tu Instagram User Access Token. Puedes obtenerlo desde el <a href="https://developers.facebook.com/tools/explorer/" target="_blank">Graph API Explorer</a> seleccionando tu app y generando un token con permisos <code>instagram_basic</code>, <code>instagram_content_publish</code> y <code>pages_read_engagement</code>.</p>
        <textarea [(ngModel)]="token" rows="3" placeholder="EAAun6eD58lMB..."></textarea>
        <div class="form-actions">
          <button class="btn-primary" (click)="connectToken()" [disabled]="!token || loading">
            {{ loading ? 'Conectando...' : 'Conectar' }}
          </button>
        </div>
        <p class="error" *ngIf="error">{{ error }}</p>
      </div>

      <div *ngIf="accounts.length === 0 && !showTokenForm" class="empty">
        <p>No tienes cuentas conectadas.</p>
        <button class="btn-primary" (click)="showTokenForm = true">Conectar Instagram Business</button>
      </div>

      <div class="accounts-grid">
        <div class="account-card" *ngFor="let a of accounts">
          <img [src]="a.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + a.username" [alt]="a.username" class="avatar" />
          <div class="info">
            <strong>&#64;{{ a.username }}</strong>
            <span>{{ a.name }}</span>
            <span class="date">Conectado {{ a.connectedAt | date:'dd/MM/yyyy' }}</span>
          </div>
          <button class="btn-danger" (click)="disconnect(a.id)">Desconectar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { font-size: 1.8rem; }
    .btn-primary { background: #e1306c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .btn-primary:disabled { opacity: 0.6; }
    .btn-danger { background: transparent; border: 1px solid #f44336; color: #f44336; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
    .token-form { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 12px; line-height: 1.5; }
    .hint a { color: #e1306c; }
    .hint code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; font-family: monospace; resize: vertical; }
    .form-actions { margin-top: 12px; display: flex; justify-content: flex-end; }
    .error { color: #c62828; margin-top: 8px; font-size: 0.9rem; }
    .accounts-grid { display: flex; flex-direction: column; gap: 12px; }
    .account-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
    .info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .date { color: #888; font-size: 0.85rem; }
    .empty { text-align: center; padding: 60px; color: #888; }
    .empty button { margin-top: 16px; }
  `]
})
export class AccountsComponent implements OnInit {
  private service = inject(AccountsService);
  accounts: InstagramAccount[] = [];
  showTokenForm = false;
  token = '';
  loading = false;
  error = '';

  ngOnInit() { this.service.getAll().subscribe(a => this.accounts = a); }

  connectToken() {
    this.loading = true;
    this.error = '';
    this.service.connectWithToken(this.token.trim()).subscribe({
      next: () => {
        this.loading = false;
        this.showTokenForm = false;
        this.token = '';
        this.service.getAll().subscribe(a => this.accounts = a);
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.error ?? 'Error al conectar. Verifica el token.';
      }
    });
  }

  disconnect(id: number) {
    if (confirm('¿Desconectar esta cuenta?'))
      this.service.disconnect(id).subscribe(() => this.accounts = this.accounts.filter(a => a.id !== id));
  }
}
