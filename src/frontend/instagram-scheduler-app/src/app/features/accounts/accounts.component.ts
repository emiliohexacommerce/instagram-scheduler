import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsService } from '../../core/services/accounts.service';
import { InstagramAccount } from '../../core/models/account.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>👤 Cuentas de Instagram</h1>
        <button class="btn-primary" (click)="connect()">+ Conectar cuenta</button>
      </div>
      <div *ngIf="accounts.length === 0" class="empty">
        <p>No tienes cuentas conectadas.</p>
        <button class="btn-primary" (click)="connect()">Conectar Instagram Business</button>
      </div>
      <div class="accounts-grid">
        <div class="account-card" *ngFor="let a of accounts">
          <img [src]="a.profilePictureUrl || 'https://via.placeholder.com/60'" [alt]="a.username" class="avatar" />
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
    .btn-danger { background: transparent; border: 1px solid #f44336; color: #f44336; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
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
  ngOnInit() { this.service.getAll().subscribe(a => this.accounts = a); }
  connect() { this.service.connect(); }
  disconnect(id: number) {
    if (confirm('¿Desconectar esta cuenta?'))
      this.service.disconnect(id).subscribe(() => this.accounts = this.accounts.filter(a => a.id !== id));
  }
}
