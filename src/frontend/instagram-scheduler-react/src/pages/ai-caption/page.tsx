import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Bot, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { useGenerateCaption, type GenerateCaptionRequest } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  topic: z.string().min(3, 'Tema requerido'),
  tone: z.string().min(1, 'Selecciona un tono'),
  brandName: z.string().optional(),
  extraContext: z.string().optional(),
  includeHashtags: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const TONES = [
  { value: 'profesional', label: 'Profesional' },
  { value: 'casual', label: 'Casual' },
  { value: 'motivacional', label: 'Motivacional' },
  { value: 'humoristico', label: 'Humorístico' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'emocional', label: 'Emocional' },
];

export default function AiCaptionPage() {
  const [result, setResult] = useState<string>('');
  const { mutate, isPending } = useGenerateCaption();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tone: 'casual', includeHashtags: true },
  });

  const onSubmit = (data: FormData) => {
    mutate(data as GenerateCaptionRequest, {
      onSuccess: (res) => setResult(res.caption),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Caption copiado');
  };

  return (
    <div className="container py-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Bot className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Caption con IA</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Genera captions atractivos con Claude AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tema o producto *</Label>
              <Input placeholder="Ej: lanzamiento de zapatillas de running" {...register('topic')} />
              {errors.topic && <p className="text-xs text-destructive">{errors.topic.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tono *</Label>
              <Controller control={control} name="tone" render={({ field }) => (
                <Select defaultValue="casual" onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Marca <span className="text-muted-foreground">(opcional)</span></Label>
              <Input placeholder="Nombre de tu marca" {...register('brandName')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Contexto adicional <span className="text-muted-foreground">(opcional)</span></Label>
              <textarea
                className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Información extra, público objetivo, CTA deseado..."
                {...register('extraContext')}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hashtags"
                className="rounded border-input"
                {...register('includeHashtags')}
              />
              <Label htmlFor="hashtags" className="cursor-pointer">Incluir hashtags</Label>
            </div>

            <Button type="submit" className="gap-2 mt-1" disabled={isPending}>
              {isPending ? (
                <><RefreshCw className="size-4 animate-spin" />Generando...</>
              ) : (
                <><Sparkles className="size-4" />Generar Caption</>
              )}
            </Button>
          </form>
        </div>

        {/* Result */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Resultado</h3>
            {result && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                <Copy className="size-3.5" />Copiar
              </Button>
            )}
          </div>
          {result ? (
            <div className="flex-1 p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
              {result}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
              <Bot className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                Completa el formulario y genera tu caption
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
