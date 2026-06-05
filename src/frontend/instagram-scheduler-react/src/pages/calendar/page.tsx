import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePosts, type PostStatus } from '@/lib/queries';
import { Button } from '@/components/ui/button';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const STATUS_DOT: Record<PostStatus, string> = {
  Draft: 'bg-secondary-foreground/50',
  Scheduled: 'bg-blue-500',
  Processing: 'bg-yellow-500',
  Published: 'bg-green-500',
  Failed: 'bg-red-500',
};

export default function CalendarPage() {
  const { data: posts = [] } = usePosts();
  const [current, setCurrent] = useState(() => new Date());

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const postsByDay = useMemo(() => {
    const map: Record<string, typeof posts> = {};
    posts.forEach(p => {
      const date = p.scheduledAt ?? p.publishedAt ?? p.createdAt;
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = String(d.getDate());
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [posts, year, month]);

  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-muted-foreground text-sm mt-1">Vista mensual de tus publicaciones</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="sm" className="size-8 p-0"
            onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="font-semibold">{MONTHS[month]} {year}</h2>
          <Button variant="ghost" size="sm" className="size-8 p-0"
            onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday = day !== null && today.getDate() === day &&
              today.getMonth() === month && today.getFullYear() === year;
            const dayPosts = day ? (postsByDay[String(day)] ?? []) : [];

            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border-b border-r border-border text-sm
                  ${!day ? 'bg-muted/30' : 'hover:bg-muted/20 transition-colors'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                {day && (
                  <>
                    <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-medium
                      ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                      {day}
                    </span>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayPosts.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center gap-1 truncate">
                          <div className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} />
                          <span className="text-[11px] truncate text-muted-foreground">
                            &#64;{p.accountUsername}
                          </span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} más</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {(['Scheduled', 'Published', 'Failed', 'Draft'] as PostStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
            <span>{{
              Scheduled: 'Programado', Published: 'Publicado',
              Failed: 'Fallido', Draft: 'Borrador', Processing: 'Procesando',
            }[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
