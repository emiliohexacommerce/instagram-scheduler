import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Instagram, Check } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { useRegister, usePlans } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  planId: z.number().min(1, 'Selecciona un plan'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mutate, isPending } = useRegister();
  const { data: plans = [] } = usePlans();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { planId: 1 },
  });

  const onSubmit = (data: FormData) => {
    mutate({ name: data.name, email: data.email, password: data.password, planId: data.planId }, {
      onSuccess: (res) => {
        login(res);
        navigate('/dashboard', { replace: true });
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Instagram className="size-6" />
          </div>
          <h1 className="text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-muted-foreground text-sm">Primer mes gratis en el plan que elijas</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Tu nombre" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {plans.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Elige tu plan <span className="text-muted-foreground font-normal">(1 mes gratis)</span></Label>
                <Controller
                  control={control}
                  name="planId"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {plans.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => field.onChange(plan.id)}
                          className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-colors ${
                            field.value === plan.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/40'
                          }`}
                        >
                          {field.value === plan.id && (
                            <span className="absolute top-1.5 right-1.5">
                              <Check className="size-3 text-primary" />
                            </span>
                          )}
                          <span className="font-semibold text-sm">{plan.name}</span>
                          <span className="text-xs text-muted-foreground">${plan.priceMonthly.toLocaleString('es-CL')}/mes</span>
                          <span className="text-xs text-muted-foreground">{plan.maxAccounts === -1 ? '∞' : plan.maxAccounts} cuentas</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending ? 'Creando cuenta...' : 'Comenzar prueba gratuita'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
