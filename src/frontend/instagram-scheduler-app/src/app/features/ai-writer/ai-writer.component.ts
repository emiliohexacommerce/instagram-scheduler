import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostsService } from '../../core/services/posts.service';

@Component({
  selector: 'app-ai-writer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <h1>🤖 Generador de Captions con IA</h1>
      <div class="layout">
        <div class="form-card">
          <h2>Configura tu caption</h2>
          <form [formGroup]="form" (ngSubmit)="generate()">
            <label>Tema del post *</label>
            <input formControlName="topic" placeholder="Ej: Lanzamiento de Slotium, agendamiento de citas" />
            <label>Tono</label>
            <select formControlName="tone">
              <option value="profesional">Profesional</option>
              <option value="casual">Casual y cercano</option>
              <option value="inspirador">Inspirador</option>
              <option value="humorístico">Humorístico</option>
              <option value="urgente">Urgente / Promocional</option>
            </select>
            <label>Marca / Empresa</label>
            <input formControlName="brandName" placeholder="Ej: Slotium, Hexacommerce" />
            <label>Contexto adicional</label>
            <textarea formControlName="extraContext" rows="3" placeholder="Detalles extra, oferta, público objetivo..."></textarea>
            <label class="checkbox-label">
              <input type="checkbox" formControlName="includeHashtags" />
              Incluir hashtags
            </label>
            <button type="submit" [disabled]="form.invalid || loading">
              {{ loading ? '✨ Generando...' : '✨ Generar Caption' }}
            </button>
          </form>
        </div>
        <div class="result-card">
          <h2>Caption generado</h2>
          <div *ngIf="!caption && !loading" class="placeholder">
            <p>El caption aparecerá aquí...</p>
            <p class="hint">Completa el formulario y presiona "Generar Caption"</p>
          </div>
          <div *ngIf="loading" class="loading">✨ Claude está escribiendo...</div>
          <div *ngIf="caption" class="caption-output">
            <pre>{{ caption }}</pre>
            <div class="actions">
              <button (click)="copy()" class="btn-secondary">📋 Copiar</button>
              <button (click)="regenerate()" class="btn-outline">🔄 Regenerar</button>
            </div>
            <p *ngIf="copied" class="copied">¡Copiado!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    h1 { font-size: 1.8rem; margin-bottom: 24px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .form-card, .result-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { margin-bottom: 16px; color: #333; }
    label { display: block; font-weight: 600; margin-bottom: 4px; margin-top: 12px; color: #555; font-size: 0.9rem; }
    input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 12px; }
    .checkbox-label input { width: auto; }
    button[type=submit] { margin-top: 20px; width: 100%; padding: 12px; background: linear-gradient(135deg, #405de6, #e1306c); color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    button[type=submit]:disabled { opacity: 0.6; }
    .placeholder { text-align: center; padding: 60px 20px; color: #aaa; }
    .hint { font-size: 0.85rem; margin-top: 8px; }
    .loading { text-align: center; padding: 60px; color: #e1306c; font-size: 1.1rem; }
    .caption-output pre { white-space: pre-wrap; font-family: inherit; line-height: 1.6; background: #f8f9fa; padding: 16px; border-radius: 8px; color: #333; }
    .actions { display: flex; gap: 12px; margin-top: 16px; }
    .btn-secondary { padding: 8px 16px; background: #e1306c; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .btn-outline { padding: 8px 16px; background: transparent; border: 1px solid #e1306c; color: #e1306c; border-radius: 6px; cursor: pointer; }
    .copied { color: green; font-size: 0.85rem; margin-top: 8px; }
  `]
})
export class AiWriterComponent {
  private fb = inject(FormBuilder);
  private posts = inject(PostsService);
  form = this.fb.group({
    topic: ['', Validators.required],
    tone: ['profesional'],
    brandName: [''],
    extraContext: [''],
    includeHashtags: [true]
  });
  caption = ''; loading = false; copied = false;

  generate() {
    if (this.form.invalid) return;
    this.loading = true; this.caption = '';
    this.posts.generateCaption(this.form.value as any).subscribe({
      next: (c) => { this.caption = c; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  regenerate() { this.generate(); }
  copy() { navigator.clipboard.writeText(this.caption); this.copied = true; setTimeout(() => this.copied = false, 2000); }
}
