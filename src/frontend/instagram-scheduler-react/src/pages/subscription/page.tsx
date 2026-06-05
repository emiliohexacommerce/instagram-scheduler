import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Clock, CreditCard, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useSubscription, type SubscriptionStatus } from '@/lib/queries';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG: Record<SubscriptionStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = {
  Trial: {
    label: 'Trial gratuito',
    icon: Clock,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    description: 'Estás disfrutando tu mes de prueba gratuito.',
  },
  Active: {
    label: 'Activa',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    description: 'Tu suscripción está activa.',
  },
  PendingPayment: {
    label: 'Pago pendiente',
    icon: CreditCard,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    description: 'Tu período expiró. Renueva para seguir publicando.',
  },
  Suspended: {
    label: 'Suspendida',
    icon: XCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    description: 'Tu cuenta ha sido suspendida.',
  },
  Cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-muted-foreground bg-muted',
    description: 'Tu suscripción fue cancelada.',
  },
};

export default function SubscriptionPage() {
  const { data: subscription, isLoading } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') toast.success('¡Pago exitoso! Tu suscripción está activa.');
    if (payment === 'failed') toast.error('El pago no fue procesado. Intenta nuevamente.');
    if (payment === 'error') toast.error('Ocurrió un error al procesar el pago.');
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container py-8 max-w-2xl flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sin suscripción activa</h2>
        <p className="text-muted-foreground text-sm">Elige un plan para comenzar.</p>
        <Button asChild><Link to="/plans">Ver planes <ArrowRight className="size-4 ml-2" /></Link></Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[subscription.status];
  const StatusIcon = config.icon;
  const isExpiring = subscription.daysRemaining <= 7 && subscription.status === 'Trial';
  const needsPayment = subscription.status === 'PendingPayment' || subscription.status === 'Suspended';

  return (
    <div className="container py-8 max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Estado de tu plan actual</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-11 rounded-xl flex items-center justify-center ${config.color}`}>
              <StatusIcon className="size-6" />
            </div>
            <div>
              <p className="font-bold text-lg">{subscription.planName}</p>
              <p className="text-sm text-muted-foreground">{config.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${subscription.priceMonthly.toLocaleString('es-CL')}</p>
            <p className="text-xs text-muted-foreground">CLP/mes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Inicio</p>
            <p className="font-medium text-sm mt-0.5">
              {new Date(subscription.startDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Vencimiento</p>
            <p className="font-medium text-sm mt-0.5">
              {new Date(subscription.endDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {(isExpiring || needsPayment) && (
          <div className={`flex items-start gap-3 p-4 rounded-xl ${needsPayment ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'}`}>
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                {needsPayment ? 'Acceso restringido' : `Quedan ${subscription.daysRemaining} días de trial`}
              </p>
              <p className="text-xs mt-0.5">{config.description}</p>
            </div>
          </div>
        )}

        {(needsPayment || subscription.status === 'Trial') && (
          <Button asChild size="lg" className="w-full">
            <Link to="/plans">
              {needsPayment ? 'Renovar suscripción' : 'Actualizar plan'}
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
