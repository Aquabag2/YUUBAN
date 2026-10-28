import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Rise, PageTitle, PostCard, EmptyState, POST_TYPES } from '../components/yb';

const FILTERS = [{ key: 'all', label: 'Todo' }, ...Object.entries(POST_TYPES).map(([key, label]) => ({ key, label: `${label}s` }))];

export default function Novedades() {
  const [posts, setPosts]   = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/my/feed').then(({ data }) => setPosts(data ?? [])).catch(() => setPosts([]));
  }, []);

  const visible = (posts ?? []).filter((p) => filter === 'all' || p.type === filter);

  return (
    <div className="mx-auto max-w-[640px] font-yb-sans text-yb-ink">
      <PageTitle kicker="Comunidad" title="Noticias" subtitle="Anuncios, horarios y resultados de tus festivales." />

      <Rise i={2} className="border-b border-yb-rule">
        <div className="-mb-px flex gap-6 overflow-x-auto text-sm [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`shrink-0 border-b-2 pb-3 transition-colors ${filter === f.key ? 'border-yb-ink font-semibold text-yb-ink' : 'border-transparent text-yb-ink-muted hover:text-yb-ink'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </Rise>

      <div className="mt-6 space-y-5">
        {posts === null
          ? [0, 1].map((i) => <div key={i} className="h-48 animate-pulse bg-yb-rule/60" />)
          : visible.length === 0
            ? <EmptyState title="Sin noticias por ahora." text="Cuando se publique algo en tus festivales, aparecerá aquí." />
            : visible.map((p, i) => <Rise key={p.id} i={3 + Math.min(i, 5)}><PostCard post={p} /></Rise>)}
      </div>
    </div>
  );
}
