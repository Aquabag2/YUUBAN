import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pin, Heart, Send, Bookmark, Megaphone, CalendarClock, ListOrdered, Trophy } from 'lucide-react';

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

/* Recordar "me gusta" y "guardados" solo en este navegador (sin contadores públicos) */
const readSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
};
const toggleInSet = (key, id) => {
  const set = readSet(key);
  set.has(id) ? set.delete(id) : set.add(id);
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* modo privado */ }
  return set.has(id);
};

/* Portada de cada tipo de publicación: color y sello */
const COVERS = {
  announcement: { cls: 'bg-yb-ink text-yb-paper',    accent: 'text-yb-helecho', Icon: Megaphone },
  schedule:     { cls: 'bg-yb-forest text-yb-paper', accent: 'text-yb-helecho', Icon: CalendarClock },
  result:       { cls: 'bg-yb-laton text-yb-ink',    accent: 'text-yb-ink',     Icon: ListOrdered },
  winner:       { cls: 'bg-yb-madera text-yb-paper', accent: 'text-yb-laton',   Icon: Trophy },
};

export const EventAvatar = ({ title, size = 'h-9 w-9 text-sm', ring = true }) => (
  <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-yb-ink font-yb-serif text-yb-paper ${ring ? 'ring-2 ring-yb-forest ring-offset-2 ring-offset-white' : ''}`}>
    {initialsOf(title)}
  </span>
);

/* Publicación estilo Instagram: encabezado, portada (doble toque = me gusta), acciones y texto */
export const PostCard = ({ post }) => {
  const evTitle = post.events?.title ?? 'Yuuban';
  const cover   = COVERS[post.type] ?? COVERS.announcement;
  const [liked, setLiked] = useState(() => readSet('yb-likes').has(post.id));
  const [saved, setSaved] = useState(() => readSet('yb-saved').has(post.id));
  const [burst, setBurst] = useState(0);
  const [open, setOpen]   = useState(false);
  const long = (post.content?.length ?? 0) > 140;

  const like = () => setLiked(toggleInSet('yb-likes', post.id));
  const likeFromCover = () => {
    if (!liked) setLiked(toggleInSet('yb-likes', post.id));
    setBurst((b) => b + 1);
  };
  const share = async () => {
    const url = post.events?.slug ? `${window.location.origin}/e/${post.events.slug}` : window.location.origin;
    const data = { title: post.title, text: `${evTitle}: ${post.title}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); toast.success('Enlace copiado'); }
    } catch { /* el usuario canceló */ }
  };

  return (
    <article className="border-b border-yb-rule pb-5 sm:border sm:bg-white sm:pb-0">
      <header className="flex items-center gap-3 py-3 sm:px-4">
        <EventAvatar title={evTitle} />
        <div className="min-w-0 flex-1 leading-tight">
          {post.events?.slug
            ? <Link to={`/e/${post.events.slug}`} className="truncate text-sm font-semibold text-yb-ink hover:underline">{evTitle}</Link>
            : <span className="truncate text-sm font-semibold text-yb-ink">{evTitle}</span>}
          <div className="text-xs text-yb-ink-muted">{POST_TYPES[post.type] ?? 'Anuncio'} · {timeAgo(post.created_at)}</div>
        </div>
        {post.is_pinned && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-yb-forest"><Pin size={11} /> Fijado</span>
        )}
      </header>

      {/* Portada */}
      <div onDoubleClick={likeFromCover}
        className={`relative flex aspect-[5/4] select-none flex-col justify-between overflow-hidden p-6 sm:p-8 ${cover.cls}`}>
        <cover.Icon aria-hidden="true" strokeWidth={1} className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 opacity-[0.12]" />
        <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${cover.accent}`}>{POST_TYPES[post.type] ?? 'Anuncio'}</span>
        <h3 className="relative font-yb-serif text-[clamp(28px,7vw,42px)] leading-[1.02] tracking-[-0.01em]">{post.title}</h3>
        <span className="relative text-xs opacity-70">{evTitle}</span>
        {burst > 0 && (
          <Heart key={burst} aria-hidden="true" fill="currentColor" strokeWidth={0}
            className="pointer-events-none absolute left-1/2 top-1/2 -ml-12 -mt-12 h-24 w-24 animate-yb-heart text-white drop-shadow-lg motion-reduce:hidden" />
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-4 pt-3 sm:px-4">
        <button type="button" onClick={like} aria-pressed={liked} aria-label="Me gusta"
          className="transition-transform active:scale-90">
          <Heart size={24} strokeWidth={1.7} className={liked ? 'fill-red-600 text-red-600' : 'text-yb-ink hover:text-yb-ink-muted'} />
        </button>
        <button type="button" onClick={share} aria-label="Compartir" className="text-yb-ink transition-transform hover:text-yb-ink-muted active:scale-90">
          <Send size={22} strokeWidth={1.7} />
        </button>
        <button type="button" onClick={() => setSaved(toggleInSet('yb-saved', post.id))} aria-pressed={saved} aria-label="Guardar"
          className="ml-auto transition-transform active:scale-90">
          <Bookmark size={23} strokeWidth={1.7} className={saved ? 'fill-yb-ink text-yb-ink' : 'text-yb-ink hover:text-yb-ink-muted'} />
        </button>
      </div>

      {/* Texto */}
      {post.content && (
        <p className={`pt-2 text-[14px] leading-relaxed text-yb-ink sm:px-4 ${open ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
          <span className="mr-1.5 font-semibold">{evTitle}</span>{post.content}
        </p>
      )}
      {long && !open && (
        <button type="button" onClick={() => setOpen(true)} className="pt-1 text-sm text-yb-ink-muted sm:px-4">más</button>
      )}
      <div className="hidden h-4 sm:block" />
    </article>
  );
};
