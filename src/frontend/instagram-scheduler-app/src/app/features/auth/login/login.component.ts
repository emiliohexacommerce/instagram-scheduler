import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>📸 Instagram Scheduler</h1>
        <h2>Iniciar Sesión</h2>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <input formControlName="email" type="email" placeholder="Email" />
          <input formControlName="password" type="password" placeholder="Contraseña" />
          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
          <p *ngIf="error" class="error">{{ error }}</p>
        </form>
        <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; height:100vh; background: linear-gradient(135deg, #405de6, #e1306c); }
    .auth-card { background:white; padding:40px; border-radius:16px; width:360px; text-align:center; }
    h1 { font-size:1.5rem; margin-bottom:8px; }
    h2 { color:#555; margin-bottom:24px; }
    input { width:100%; padding:12px; margin-bottom:12px; border:1px solid #ddd; border-radius:8px; font-size:1rem; box-sizing:border-box; }
    button { width:100%; padding:12px; background:#e1306c; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer; }
    button:disabled { opacity:0.6; }
    .error { color:red; margin-top:8px; }
    a { color:#e1306c; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  loading = false; error = '';

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => { this.error = e.error?.error ?? 'Error al iniciar sesión'; this.loading = false; }
    });
  }
}
