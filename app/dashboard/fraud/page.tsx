'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FraudPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [open, all] = await Promise.all([
        api.get('/fraud/cases/open').catch(() => ({ data: [] })),
        api.get('/fraud/cases').catch(() => ({ data: [] })),
      ]);
      setAllCases(all.data?.length ? all.data : open.data);
      setCases(open.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string) => {
    setUpdating(true);
    await api.put(`/fraud/cases/${id}/status`, { status, analystNotes: notes || `Actualizado a ${status}` }).catch(() => {});
    setSelected(null);
    setNotes('');
    load();
    setUpdating(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const severityColor: Record<string, string> = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
  };
  const statusColor: Record<string, string> = {
    open: 'text-red-400 bg-red-400/10',
    investigating: 'text-blue-400 bg-blue-400/10',
    escalated: 'text-orange-400 bg-orange-400/10',
    resolved: 'text-green-400 bg-green-400/10',
    rejected: 'text-gray-400 bg-gray-400/10',
  };

  const displayCases = (filter === 'open' ? cases : allCases).filter(c =>
    c.type?.toLowerCase().includes(search.toLowerCase()) ||
    c.userId?.includes(search)
  );

  const stats = {
    open: cases.length,
    high: cases.filter(c => c.severity === 'high').length,
    investigating: allCases.filter(c => c.status === 'investigating').length,
    resolved: allCases.filter(c => c.status === 'resolved').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Fraude & Disputas</h2>
        <p className="text-gray-500 text-sm mt-0.5">Gestión de casos e investigaciones</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Casos abiertos', value: stats.open, color: 'text-red-400' },
          { label: 'Alta severidad', value: stats.high, color: 'text-orange-400' },
          { label: 'En investigación', value: stats.investigating, color: 'text-blue-400' },
          { label: 'Resueltos', value: stats.resolved, color: 'text-green-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['open', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-4 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'open' ? 'Abiertos' : 'Todos'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por tipo, usuario..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="space-y-3">
        {displayCases.length === 0 ? (
          <div className="bg-gray-900/80 border border-green-900/30 rounded-xl p-8 text-center">
            <div className="text-green-400 text-4xl mb-2">✓</div>
            <p className="text-green-400 text-sm font-medium">Sin casos {filter === 'open' ? 'abiertos' : 'registrados'}</p>
          </div>
        ) : displayCases.map(c => (
          <div key={c.id} className={`bg-gray-900/80 border rounded-xl p-5 transition ${selected?.id === c.id ? 'border-blue-500/50' : 'border-gray-800 hover:border-gray-700'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">{c.type?.replace(/_/g, ' ')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor[c.severity] || ''}`}>{c.severity}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status] || 'text-gray-400 bg-gray-400/10'}`}>{c.status}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{c.description || '—'}</p>
                  <p className="text-gray-600 text-xs mt-1">Usuario: {c.userId?.slice(0, 8)}... · {fmtDate(c.createdAt)}</p>
                </div>
              </div>
              {c.amount && <p className="text-white font-bold text-sm">{fmt(c.amount)}</p>}
            </div>

            {selected?.id === c.id ? (
              <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notas del analista (opcional)..."
                  className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2 outline-none resize-none h-16 focus:ring-1 focus:ring-blue-500" />
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Investigar', status: 'investigating', color: 'bg-blue-600 hover:bg-blue-500' },
                    { label: 'Resolver', status: 'resolved', color: 'bg-green-600 hover:bg-green-500' },
                    { label: 'Escalar', status: 'escalated', color: 'bg-orange-600 hover:bg-orange-500' },
                    { label: 'Rechazar', status: 'rejected', color: 'bg-red-600 hover:bg-red-500' },
                  ].map(a => (
                    <button key={a.status} onClick={() => update(c.id, a.status)} disabled={updating}
                      className={`${a.color} text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50`}>
                      {a.label}
                    </button>
                  ))}
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-xs px-3 py-2 transition">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setSelected(c)} className="text-blue-400 hover:text-blue-300 text-xs transition mt-2">Gestionar caso →</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
