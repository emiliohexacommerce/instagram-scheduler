import { useState } from 'react';
import { MessageSquare, Send, RefreshCw, Instagram, Facebook, ChevronDown, ChevronRight } from 'lucide-react';
import { useInbox, useReplyToComment, useAccounts, type InboxPost, type InboxComment } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="size-3.5" />,
  Facebook: <Facebook className="size-3.5" />,
};

const PLATFORM_COLOR: Record<string, string> = {
  Instagram: 'text-pink-500',
  Facebook: 'text-blue-500',
};

function CommentItem({ comment, accountId, platform }: {
  comment: InboxComment; accountId: number; platform: string;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const reply = useReplyToComment();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await reply.mutateAsync({ commentId: comment.id, platform, accountId, message: replyText });
      toast.success('Respuesta enviada');
      setReplyText('');
      setReplying(false);
    } catch {
      toast.error('Error al enviar respuesta');
    }
  };

  return (
    <div className="pl-0">
      <div className="flex gap-3 py-2">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
          {comment.authorUsername[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">@{comment.authorUsername}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(comment.timestamp), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-sm mt-0.5 text-foreground/90">{comment.text}</p>
          <div className="flex items-center gap-3 mt-1">
            <button className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setReplying(!replying)}>
              Responder
            </button>
            {comment.replies.length > 0 && (
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                {comment.replies.length} {comment.replies.length === 1 ? 'respuesta' : 'respuestas'}
              </button>
            )}
          </div>
          {replying && (
            <div className="flex gap-2 mt-2">
              <Input
                className="h-8 text-sm"
                placeholder="Escribe tu respuesta..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
              />
              <Button size="sm" className="h-8 px-3" onClick={handleReply}
                disabled={reply.isPending || !replyText.trim()}>
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
          {expanded && comment.replies.length > 0 && (
            <div className="mt-2 pl-4 border-l border-border flex flex-col gap-1">
              {comment.replies.map(r => (
                <div key={r.id} className="py-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">@{r.authorUsername}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(r.timestamp), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, selected, onClick }: {
  post: InboxPost; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors
        ${selected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:bg-muted/50'
        }`}
    >
      <div className="flex items-start gap-3">
        {post.mediaUrl
          ? <img src={post.mediaUrl} className="size-10 rounded-md object-cover shrink-0" />
          : <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
        }
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1 text-xs mb-1 ${PLATFORM_COLOR[post.platform]}`}>
            {PLATFORM_ICON[post.platform]}
            <span>@{post.accountUsername}</span>
          </div>
          <p className="text-sm truncate">{post.caption || '(sin texto)'}</p>
          <div className="flex items-center gap-2 mt-1">
            <MessageSquare className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {post.commentsCount} {post.commentsCount === 1 ? 'comentario' : 'comentarios'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function InboxPage() {
  const { data: accounts = [] } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data: posts = [], isLoading, refetch, isFetching } = useInbox(selectedAccountId);

  const igFbAccounts = accounts.filter(a => a.platform === 'Instagram' || a.platform === 'Facebook');
  const selectedPost = posts.find(p => p.postId === selectedPostId) ?? posts[0] ?? null;

  if (igFbAccounts.length === 0) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Inbox</h1>
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <MessageSquare className="size-10 mx-auto mb-3 opacity-30" />
          <p>Conecta una cuenta de Instagram o Facebook para ver los comentarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">Comentarios de tus publicaciones</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Account filter */}
          <select
            value={selectedAccountId ?? ''}
            onChange={e => setSelectedAccountId(e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
          >
            <option value="">Todas las cuentas</option>
            {igFbAccounts.map(a => (
              <option key={a.id} value={a.id}>@{a.username} ({a.platform})</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          <div className="w-72 flex flex-col gap-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
          </div>
          <div className="flex-1 h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <MessageSquare className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay publicaciones recientes</p>
          <p className="text-sm mt-1">Los comentarios de tus posts aparecerán aquí</p>
          <p className="text-xs mt-2">Nota: requiere permisos de <code>instagram_manage_comments</code></p>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          {/* Posts sidebar */}
          <div className="w-72 shrink-0 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {posts.length} publicaciones
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-2 flex flex-col gap-1">
              {posts.map(post => (
                <PostCard key={post.postId} post={post}
                  selected={post.postId === (selectedPost?.postId ?? null)}
                  onClick={() => setSelectedPostId(post.postId)} />
              ))}
            </div>
          </div>

          {/* Comment thread */}
          {selectedPost && (
            <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
              {/* Post header */}
              <div className="p-4 border-b border-border flex gap-3 items-start">
                {selectedPost.mediaUrl && (
                  <img src={selectedPost.mediaUrl} className="size-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-1 text-xs mb-1 ${PLATFORM_COLOR[selectedPost.platform]}`}>
                    {PLATFORM_ICON[selectedPost.platform]}
                    <span>@{selectedPost.accountUsername}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{selectedPost.caption || '(sin texto)'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPost.commentsCount} {selectedPost.commentsCount === 1 ? 'comentario' : 'comentarios'}
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-320px)]">
                {selectedPost.comments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Sin comentarios cargados
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedPost.comments.map(c => (
                      <CommentItem key={c.id} comment={c}
                        accountId={selectedPost.accountId}
                        platform={selectedPost.platform} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
