import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Zap, Building2, Rocket } from 'lucide-react';
import { usePlans, useSubscription, useCheckout, type Plan } from '@/lib/queries';
import { Button } from '@/components/ui/button';

const PLAN_ICONS = [Zap, Building2, Rocket];
const PLAN_COLORS = [
  'border-blue-200 dark:border-blue-800',
  'border-purple-400 dark:border-purple-600 ring-2 ring-purple-400 dark:ring-purple-600',
  'border-orange-200 dark:border-orange-800',
];
const PLAN_BADGE = ['', 'Más popular', ''];

function PlanCard({ plan, index, currentPlanId, onSelect, isLoading }: {
  plan: Plan;
  index: number;
  currentPlanId?: number;
  onSelect: (planId: number) => void;
  isLoading: boolean;
}) {
  const isCurrentPlan = currentPlanId === plan.id;
  const isPopular = index === 1;

  const formatLimit = (val: number) => val === -1 ? 'Ilimitado' : val.toString();

  return (
    <div className={`relative bg-card rounded-2xl border-2 p-6 flex flex-col gap-5 ${PLAN_COLORS[index]}`}>
      {PLAN_BADGE[index] && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {PLAN_BADGE[index]}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${isPopular ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-muted text-muted-foreground'}`}>
          {(() => { const Icon = PLAN_ICONS[index]; return <Icon className="size-5" />; })()}
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      <div>
        <span className="text-3xl font-bold">${plan.priceMonthly.toLocaleString('es-CL')}</span>
        <span className="text-muted-foreground text-sm"> CLP/mes</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        <li className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500 shrink-0" />
          <span>{formatLimit(plan.maxAccounts)} cuenta{plan.maxAccounts !== 1 ? 's' : ''} sociales</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500 shrink-0" />
          <span>{formatLimit(plan.maxPostsPerMonth)} posts/mes</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500 shrink-0" />
          <span>{formatLimit(plan.maxPostsPerWeek)} posts/semana</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500 shrink-0" />
          <span>Instagram + Facebook</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500 shrink-0" />
          <span>Programación automática</span>
        </li>
      </ul>

      <Button
        className="w-full mt-auto"
        variant={isPopular ? 'default' : 'outline'}
        disabled={isCurrentPlan || isLoading}
        onClick={() => onSelect(plan.id)}
      >
        {isCurrentPlan ? 'Plan actual' : 'Suscribirse'}
      </Button>
    </div>
  );
}

export default function PlansPage() {
  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: subscription } = useSubscription();
  const { mutate: checkout, isPending } = useCheckout();
  const navigate = useNavigate();

  const handleSelect = (planId: number) => {
    checkout(planId, {
      onSuccess: (res) => {
        window.location.href = res.paymentUrl;
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="container py-8 flex flex-col gap-8 max-w-5xl">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Planes y Precios</h1>
        <p className="text-muted-foreground">Primer mes gratis en cualquier plan. Sin tarjeta requerida.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {loadingPlans
          ? [1, 2, 3].map(i => <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />)
          : plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              currentPlanId={subscription?.planId}
              onSelect={handleSelect}
              isLoading={isPending}
            />
          ))
        }
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Pago seguro con Webpay Plus · Transbank · Cancela cuando quieras
      </p>
    </div>
  );
}
