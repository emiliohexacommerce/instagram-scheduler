import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Send, Pencil, Image, Instagram, Facebook } from 'lucide-react';
import {
  usePosts, useCreatePost, useDeletePost, usePublishNow,
  useUploadMedia, type PostStatus, type PostType, type SocialPlatform
} from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const STATUS_BADGE: Record<PostStatus, string> = {
  Draft: 'bg-secondary text-secondary-foreground',
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_LABEL: Record<PostStatus, string> = {
  Draft: 'Borrador', Scheduled: 'Programado', Processing: 'Publicando',
  Published: 'Publicado', Failed: 'Fallido',
};

const PLATFORM_ICON: Record<SocialPlatform, React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
};

const PLATFORMS: SocialPlatform[] = ['Instagram', 'Facebook'];

const postSchema = z.object({
  caption: z.string().min(1, 'Caption requerido'),
  hashtags: z.string().optional(),
  mediaUrls: z.array(z.string().url()).min(1, 'Agrega al menos una imagen'),
  type: z.enum(['Image', 'Carousel', 'Reel'] as const),
  platforms: z.array(z.enum(['Instagram', 'Facebook'] as const)).min(1, 'Selecciona al menos una plataforma'),
  scheduledAt: z.string().optional(),
});
type PostForm = z.infer<typeof postSchema>;

function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['Instagram']);
  const { mutate: createPost, isPending } = useCreatePost();
  const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: 'Image', mediaUrls: [], platforms: ['Instagram'] },
  });

  const togglePlatform = (platform: SocialPlatform) => {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];
    setSelectedPlatforms(next);
    setValue('platforms', next as ['Instagram' | 'Facebook', ...('Instagram' | 'Facebook')[]]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMedia(file, {
      onSuccess: (res) => {
        const newUrls = [...uploadedUrls, res.url];
        setUploadedUrls(newUrls);
        setValue('mediaUrls', newUrls);
        toast.success('Imagen subida');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const onSubmit = (data: PostForm) => {
    createPost({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
    }, {
      onSuccess: () => {
        toast.success('Post creado');
        setOpen(false);
        setUploadedUrls([]);
        setSelectedPlatforms(['Instagram']);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="size-4" />Nuevo Post</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Plataformas</Label>
            <div className="flex gap-2">
              {PLATFORMS.map(platform => {
                const PlatformIcon = PLATFORM_ICON[platform];
                const selected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PlatformIcon className="size-4" />
                    {platform}
                  </button>
                );
              })}
            </div>
            {errors.platforms && <p className="text-xs text-destructive">{errors.platforms.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Caption</Label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Escribe tu caption..."
              {...register('caption')}
            />
            {errors.caption && <p className="text-xs text-destructive">{errors.caption.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Hashtags <span className="text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="#marketing #instagram" {...register('hashtags')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select defaultValue="Image" onValueChange={(v) => setValue('type', v as PostType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Image">Imagen</SelectItem>
                <SelectItem value="Carousel">Carrusel</SelectItem>
                <SelectItem value="Reel">Reel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Imágenes</Label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <Image className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{isUploading ? 'Subiendo...' : 'Haz clic para subir'}</span>
              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} disabled={isUploading} />
            </label>
            {uploadedUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {uploadedUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg border border-border" />
                ))}
              </div>
            )}
            {errors.mediaUrls && <p className="text-xs text-destructive">{errors.mediaUrls.message as string}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Programar para <span className="text-muted-foreground">(opcional)</span></Label>
            <Input type="datetime-local" {...register('scheduledAt')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending ? 'Guardando...' : 'Crear Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  const Icon = PLATFORM_ICON[platform];
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
      <Icon className="size-3" />{platform}
    </span>
  );
}

export default function PostsPage() {
  const { data: posts = [], isLoading } = usePosts();
  const { mutate: deletePost } = useDeletePost();
  const { mutate: publishNow, isPending: isPublishing } = usePublishNow();

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este post?')) return;
    deletePost(id, {
      onSuccess: () => toast.success('Post eliminado'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handlePublishNow = (id: number) => {
    publishNow(id, {
      onSuccess: () => toast.success('Post publicado'),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="container py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts Programados</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} posts en total</p>
        </div>
        <CreatePostDialog />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Pencil className="size-10 text-muted-foreground" />
          <h3 className="font-semibold">No hay posts</h3>
          <p className="text-sm text-muted-foreground">Crea tu primer post programado</p>
          <CreatePostDialog />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {posts.map(post => (
            <div key={post.id} className="p-4 flex items-start gap-4">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
                {post.mediaUrls[0]
                  ? <img src={post.mediaUrls[0]} alt="" className="size-full object-cover rounded-lg" />
                  : <Image className="size-5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {post.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[post.status]}`}>
                    {STATUS_LABEL[post.status]}
                  </span>
                </div>
                <p className="text-sm truncate">{post.caption}</p>
                {post.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    🕐 {new Date(post.scheduledAt).toLocaleString('es')}
                  </p>
                )}
                {post.results.length > 0 && post.results.some(r => r.errorMessage) && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {post.results.filter(r => r.errorMessage).map(r => (
                      <p key={r.platform} className="text-xs text-destructive">
                        {r.platform}: {r.errorMessage}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(post.status === 'Draft' || post.status === 'Scheduled' || post.status === 'Failed') && (
                  <Button
                    variant="ghost" size="sm"
                    className="size-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => handlePublishNow(post.id)}
                    disabled={isPublishing}
                  >
                    <Send className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
