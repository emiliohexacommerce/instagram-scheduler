import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService } from '../../core/services/posts.service';
import { Post, PostStatus } from '../../core/models/post.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="header">
        <h1>📅 Calendario de Posts</h1>
        <div class="nav">
          <button (click)="prev()">‹</button>
          <span>{{ monthName }} {{ year }}</span>
          <button (click)="next()">›</button>
        </div>
      </div>
      <div class="calendar-grid">
        <div class="day-header" *ngFor="let d of dayHeaders">{{ d }}</div>
        <div class="day" *ngFor="let day of calendarDays" [class.other-month]="!day.currentMonth" [class.today]="day.isToday">
          <span class="day-number">{{ day.date.getDate() }}</span>
          <div class="posts-in-day">
            <div class="post-dot" *ngFor="let p of day.posts" [class]="'dot-' + p.status.toLowerCase()" [title]="p.caption">
              &#64;{{ p.accountUsername }}
            </div>
          </div>
        </div>
      </div>
      <div class="legend">
        <span class="dot-scheduled">■</span> Programado
        <span class="dot-published">■</span> Publicado
        <span class="dot-draft">■</span> Borrador
        <span class="dot-failed">■</span> Fallido
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { font-size: 1.8rem; }
    .nav { display: flex; align-items: center; gap: 16px; font-size: 1.1rem; font-weight: bold; }
    .nav button { background: white; border: 1px solid #ddd; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 1.2rem; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #eee; border-radius: 12px; overflow: hidden; }
    .day-header { background: #1a1a2e; color: white; text-align: center; padding: 10px; font-weight: bold; font-size: 0.85rem; }
    .day { background: white; min-height: 100px; padding: 8px; }
    .day.other-month { background: #fafafa; }
    .day.today { background: #fff8f9; border: 2px solid #e1306c; }
    .day-number { font-size: 0.85rem; color: #888; font-weight: bold; }
    .posts-in-day { margin-top: 4px; display: flex; flex-direction: column; gap: 2px; }
    .post-dot { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default; }
    .dot-scheduled { background: #e3f2fd; color: #1976d2; }
    .dot-published { background: #e8f5e9; color: #388e3c; }
    .dot-draft { background: #f5f5f5; color: #666; }
    .dot-failed { background: #ffebee; color: #c62828; }
    .legend { margin-top: 16px; display: flex; gap: 16px; color: #555; font-size: 0.9rem; align-items: center; }
  `]
})
export class CalendarComponent implements OnInit {
  private postsService = inject(PostsService);
  posts: Post[] = [];
  dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  currentDate = new Date();
  get year() { return this.currentDate.getFullYear(); }
  get monthName() { return this.currentDate.toLocaleString('es', { month: 'long' }).charAt(0).toUpperCase() + this.currentDate.toLocaleString('es', { month: 'long' }).slice(1); }

  get calendarDays() {
    const year = this.year, month = this.currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() + 6) % 7;
    const days = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, currentMonth: false, isToday: false, posts: [] });
    }
    const today = new Date();
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const postsOnDay = this.posts.filter(p => {
        if (!p.scheduledAt) return false;
        const pd = new Date(p.scheduledAt);
        return pd.getFullYear() === year && pd.getMonth() === month && pd.getDate() === d;
      });
      days.push({ date, currentMonth: true, isToday: date.toDateString() === today.toDateString(), posts: postsOnDay });
    }
    while (days.length % 7 !== 0) {
      const nextD: Date = new Date(year, month + 1, days.length - last.getDate() - startDay + 1);
      days.push({ date: nextD, currentMonth: false, isToday: false, posts: [] });
    }
    return days;
  }

  ngOnInit() { this.postsService.getAll().subscribe(p => this.posts = p); }
  prev() { this.currentDate = new Date(this.year, this.currentDate.getMonth() - 1, 1); }
  next() { this.currentDate = new Date(this.year, this.currentDate.getMonth() + 1, 1); }
}
