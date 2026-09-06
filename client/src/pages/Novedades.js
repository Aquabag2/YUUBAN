import { useEffect, useState } from 'react';
import { Megaphone, Trophy, Calendar, Star, Pin, Clock, Loader2 } from 'lucide-react';
import api from '../lib/api';

const TYPE_CONFIG = {
  announcement: { label: 'Anuncio',   icon: Megaphone, bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  schedule:     { label: 'Horario',   icon: Calendar,  bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
  result:       { label: 'Resultado', icon: Star,      bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  winner:       { label: 'Ganador',   icon: Trophy,    bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',dot: 'bg-emerald-500' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
};

export default function Novedades() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/my/feed')
      .then(({ data }) => setPosts(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = [
    { key: 'all',          label: 'Todo' },
    { key: 'announcement', label: 'Anuncios' },
    { key: 'schedule',     label: 'Horarios' },
    { key: 'result',       label: 'Resultados' },
    { key: 'winner',       label: 'Ganadores' },
  ];

  const visible = filter === 'all' ? posts : posts.filter(p => p.type === filter);
  const pinned  = visible.filter(p => p.is_pinned);
  const normal  = visible.filter(p => !p.is_pinned);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Novedades</h1>
        <p className="text-sm text-gray-500">Anuncios, horarios y resultados de tu festival</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      )}

      {/* Sin posts */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <Megaphone size={32} className="text-gray-200" />
          <p className="text-sm text-gray-400">No hay publicaciones aún</p>
          <p className="text-xs text-gray-300">El organizador publicará anuncios aquí</p>
        </div>
      )}

      {/* Posts fijados */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Pin size={12} /> Fijados
          </div>
          {pinned.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Posts normales */}
      {normal.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div className="text-xs font-medium text-gray-400">Recientes</div>
          )}
          {normal.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }) {
  const cfg = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.announcement;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${post.is_pinned ? 'border-violet-200 ring-1 ring-violet-100' : 'border-gray-100'}`}>
      {/* Evento origen */}
      {post.events?.title && (
        <div className="mb-3 text-xs text-gray-400">{post.events.title}</div>
      )}

      {/* Badge tipo + fecha */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <Icon size={11} />
          {cfg.label}
          {post.is_pinned && <Pin size={10} className="ml-0.5" />}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {timeAgo(post.created_at)}
        </span>
      </div>

      {/* Título */}
      <h3 className="font-semibold text-gray-900">{post.title}</h3>

      {/* Contenido */}
      {post.content && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {post.content}
        </p>
      )}
    </div>
  );
}
