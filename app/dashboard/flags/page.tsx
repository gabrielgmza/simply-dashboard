'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/flags').then(r => { setFlags(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggle = async (key: string) => {
    setToggling(key);
    await api.put(`/flags/${key}/toggle`).catch(() => {});
    await load();
    setToggling(null);
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const filtered = flags
    .filter(f => filter === 'all' || (filter === 'active' ? f.enabled : !f.enabled))
    .filter(f => f.key?.toLowerCase().includes(search.toLowerCase()) || f.description?.toLowerCase().includes(search.toLowerCase()));

  const stats = { total: flags.length, active: flags.filter(f => f.enabled).length, inactive: flags.filter(f => !f.enabled).length };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Feature Flags</h2>
        <p className="text-gray-500 text-sm mt-0.5">Control de funcionalidades en tiempo real</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total flags', value: stats.total, color: 'text-white' },
          { label: 'Activos', value: stats.active, color: 'text-green-400' },
          { label: 'Inactivos', value: stats.inactive, color: 'text-gray-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-4 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar flag..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-600 text-sm">Sin flags encontrados</p>
          </div>
        ) : filtered.map(f => (
          <div key={f.id} className={`bg-gray-900/80 border rounded-xl p-4 flex items-center justify-between transition ${f.enabled ? 'border-green-900/30' : 'border-gray-800'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${f.enabled ? 'bg-green-400 shadow-lg shadow-green-400/30' : 'bg-gray-600'}`} />
              <div>
                <p className="text-white text-sm font-mono font-semibold">{f.key}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.description || '—'}</p>
                <p className="text-gray-700 text-xs mt-0.5">Actualizado: {fmtDate(f.updatedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${f.enabled ? 'text-green-400 bg-green-400/10' : 'text-gray-500 bg-gray-800'}`}>
                {f.enabled ? 'Activo' : 'Inactivo'}
              </span>
              <button onClick={() => toggle(f.key)} disabled={toggling === f.key}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${f.enabled ? 'bg-green-600' : 'bg-gray-700'} disabled:opacity-50`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${f.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
