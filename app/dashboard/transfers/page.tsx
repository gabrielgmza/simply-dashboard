'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get('/transfers/all').then(r => { setTransfers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const today = new Date().toDateString();
  const week = new Date(); week.setDate(week.getDate() - 7);

  const todayT = transfers.filter(t => new Date(t.createdAt).toDateString() === today);
  const weekT = transfers.filter(t => new Date(t.createdAt) >= week);

  const stats = {
    total: transfers.reduce((s, t) => s + Number(t.amount || 0), 0),
    count: transfers.length,
    today: todayT.reduce((s, t) => s + Number(t.amount || 0), 0),
    todayCount: todayT.length,
    weekVolume: weekT.reduce((s, t) => s + Number(t.amount || 0), 0),
    completed: transfers.filter(t => t.status === 'completed').length,
    pending: transfers.filter(t => t.status === 'pending').length,
    failed: transfers.filter(t => t.status === 'failed').length,
  };

  const filtered = transfers
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t =>
      t.fromWalletId?.includes(search) ||
      t.toWalletId?.includes(search) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.id?.includes(search)
    );

  const statusColor: Record<string, string> = {
    completed: 'text-green-400 bg-green-400/10 border-green-400/20',
    pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    failed:    'text-red-400 bg-red-400/10 border-red-400/20',
    reversed:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Transferencias</h2>
        <p className="text-gray-500 text-sm mt-0.5">Transferencias CVU · Estándar BCRA · ISO 20022</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Volumen total', value: fmt(stats.total), color: 'text-white', sub: `${stats.count} operaciones` },
          { label: 'Hoy', value: fmt(stats.today), color: 'text-blue-400', sub: `${stats.todayCount} operaciones` },
          { label: 'Esta semana', value: fmt(stats.weekVolume), color: 'text-violet-400', sub: `${weekT.length} operaciones` },
          { label: 'Promedio', value: fmt(stats.count > 0 ? stats.total / stats.count : 0), color: 'text-cyan-400', sub: 'Por operación' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Completadas', value: stats.completed, color: 'text-green-400', pct: stats.count > 0 ? (stats.completed / stats.count * 100).toFixed(0) : 0 },
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-400', pct: stats.count > 0 ? (stats.pending / stats.count * 100).toFixed(0) : 0 },
          { label: 'Fallidas', value: stats.failed, color: 'text-red-400', pct: stats.count > 0 ? (stats.failed / stats.count * 100).toFixed(0) : 0 },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-500 text-xs">{s.label}</p>
              <p className="text-gray-600 text-xs">{s.pct}%</p>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <div className="mt-2 bg-gray-800 rounded-full h-1">
              <div className={`h-1 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'completed', 'pending', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todas' : f === 'completed' ? 'Completadas' : f === 'pending' ? 'Pendientes' : 'Fallidas'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por wallet ID, descripción, ID..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Origen', 'Destino', 'Descripción', 'Estado', 'Monto', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.map(t => (
              <>
                <tr key={t.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition cursor-pointer ${selected?.id === t.id ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.id === t.id ? null : t)}>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{t.fromWalletId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{t.toWalletId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{t.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border ${statusColor[t.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{selected?.id === t.id ? '▲' : '▼'}</td>
                </tr>
                {selected?.id === t.id && (
                  <tr key={`${t.id}-d`} className="border-b border-gray-800">
                    <td colSpan={7} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div><p className="text-gray-600">ID transferencia</p><p className="text-white font-mono mt-0.5">{t.id}</p></div>
                        <div><p className="text-gray-600">Wallet origen</p><p className="text-white font-mono mt-0.5">{t.fromWalletId}</p></div>
                        <div><p className="text-gray-600">Wallet destino</p><p className="text-white font-mono mt-0.5">{t.toWalletId}</p></div>
                        <div><p className="text-gray-600">SCA challenge</p><p className="text-white mt-0.5">{t.challengeId?.slice(0, 8) || '—'}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && <p className="text-gray-700 text-center py-2 text-xs">{filtered.length} transferencias</p>}
      </div>
    </div>
  );
}
