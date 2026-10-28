import { Pin } from 'lucide-react';

/* Piezas compartidas del estilo Yuuban (papel, tinta, verde yb-forest). */

export const Rise = ({ i = 0, className = '', children, as: Tag = 'div' }) => (
  <Tag className={`animate-yb-rise motion-reduce:animate-none ${className}`} style={{ animationDelay: `${80 + i * 80}ms` }}>
    {children}
  </Tag>
);

export const SectionTitle = ({ children, aside }) => (
  <div className="mb-1 flex items-center justify-between gap-4">
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{children}</h2>
    {aside}
  </div>
);

export const PageTitle = ({ kicker, title, subtitle }) => (
  <header className="mb-8">
    {kicker && <Rise i={0}><p className="text-xs font-medium text-yb-ink-muted">{kicker}</p></Rise>}
    <Rise i={1}>
      <h1 className="mt-2 font-yb-serif text-[38px] leading-[1.05] tracking-[-0.01em] text-yb-ink sm:text-[46px]">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-yb-ink-muted">{subtitle}</p>}
    </Rise>
    <div className="mt-6 h-px origin-left animate-yb-line bg-yb-ink/80 motion-reduce:animate-none" />
  </header>
);

export const EmptyState = ({ title, text, action }) => (
  <div className="border-t border-yb-rule py-10">
    <p className="font-yb-serif text-2xl text-yb-ink">{title}</p>
    {text && <p className="mt-2 max-w-md text-sm text-yb-ink-muted">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const initialsOf = (name = '') =>
  name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export const POST_TYPES = {
  announcement: 'Anuncio',
  schedule:     'Horario',
  result:       'Resultado',
  winner:       'Ganador',
};

/* Publicación estilo red social: encabezado con el festival, título, texto */
export const PostCard = ({ post }) => {
  const evTitle = post.events?.title ?? 'Yuuban';
  return (
    <article className="border border-yb-rule bg-white">
      <header className="flex items-center gap-3 px-5 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-sm text-yb-paper ring-2 ring-yb-forest ring-offset-2 ring-offset-white">
          {initialsOf(evTitle)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-yb-ink">{evTitle}</div>
          <div className="text-xs text-yb-ink-muted">{timeAgo(post.created_at)}</div>
        </div>
        {post.is_pinned && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-yb-forest"><Pin size={11} /> Fijado</span>
        )}
      </header>
      <div className="px-5 pb-5 pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-yb-ink-muted">{POST_TYPES[post.type] ?? 'Anuncio'}</div>
        <h3 className="mt-1.5 font-yb-serif text-[26px] leading-tight text-yb-ink">{post.title}</h3>
        {post.content && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-yb-ink/85">{post.content}</p>}
      </div>
    </article>
  );
};
