import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Santiago', label: 'Santiago (UTC-4/-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
  { value: 'America/Lima', label: 'Lima (UTC-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6/-5)' },
  { value: 'America/Caracas', label: 'Caracas (UTC-4)' },
  { value: 'America/New_York', label: 'Nueva York (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8/-7)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)' },
  { value: 'Europe/London', label: 'Londres (UTC+0/+1)' },
];

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [name, setName] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTimeZone(profile.timeZone);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, timeZone }, {
      onSuccess: () => toast.success('Configuración guardada'),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) return (
    <div className="container py-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
    </div>
  );

  return (
    <div className="container py-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu perfil y preferencias</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Perfil */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Perfil</h2>

          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
          </div>
        </div>

        {/* Zona horaria */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">Zona Horaria</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Se usa para mostrar las horas de tus posts programados.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Timezone</Label>
            <select
              value={timeZone}
              onChange={e => setTimeZone(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <span>Hora actual en {TIMEZONES.find(t => t.value === timeZone)?.label ?? timeZone}:</span>
            <span className="font-mono font-medium text-foreground">
              {new Date().toLocaleTimeString('es', { timeZone, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
