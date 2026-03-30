'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CollectionsPage() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    api.get('/collections/all').catch(() => api.get('/collections/history')).then(r => {
      setInstallments(r.data); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const processOverdue = async () => {
    setProcessing(true);
    await api.post('/collections/process-overdue').catch(() => {});
    await fetchData();
    setProcessing(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    scheduled: { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   label: 'Programada' },
    paid:      { color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20',  label: 'Pagada' },
    overdue:   { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    label: 'Vencida' },
    processing:{ color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', label: 'Procesando' },
  };

  const filtered = installments
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => i.creditLineId?.includes(search) || i.userId?.includes(search));

  const stats = {
    total:   installments.reduce((s, i) => s + Number(i.amount || 0), 0),
    paid:    installments.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0),
    overdue: installments.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0),
    pending: installments.filter(i => i.status === 'scheduled').reduce((s, i) => s + Number(i.amount || 0), 0),
    overdueCount: installments.filter(i => i.status === 'overdue').length,
    totalCount: installments.length,
  };

  const moraPct = stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : '0';
  const cobranzaPct = stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : '0';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Cobranzas</h2>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de cuotas y cartera en mora</p>
        </div>
        <button onClick={processOverdue} disabled={processing}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          {processing ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Procesando...</> : '⚡ Procesar vencidas'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Cartera total', value: fmt(stats.total), color: 'text-white', sub: `${stats.totalCount} cuotas` },
          { label: 'Cobrado', value: fmt(stats.paid), color: 'text-emerald-400', sub: `${cobranzaPct}% de cobranza` },
          { label: 'Pendiente', value: fmt(stats.pending), color: 'text-yellow-400', sub: 'Por vencer' },
          { label: 'En mora', value: fmt(stats.overdue), color: 'text-red-400', sub: `${stats.overdueCount} cuotas · ${moraPct}%` },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Barra composición */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-500 text-xs font-medium mb-4">COMPOSICIÓN DE CARTERA</p>
        <div className="space-y-3">
          {[
            { label: 'Cobrado', value: stats.paid, color: 'bg-emerald-500' },
            { label: 'Pendiente', value: stats.pending, color: 'bg-blue-500' },
            { label: 'En mora', value: stats.overdue, color: 'bg-red-500' },
          ].map(item => {
            const pct = stats.total > 0 ? (item.value / stats.total * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white">{fmt(item.value)} <span className="text-gray-600">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="bg-gray-800 rounded-full h-1.5">
                  <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'scheduled', 'paid', 'overdue'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todas' : f === 'scheduled' ? 'Pendientes' : f === 'paid' ? 'Pagadas' : 'En mora'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ID crédito o usuario..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      {/* Tabla */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['#', 'Vencimiento', 'Estado', 'Pagado', 'Monto', 'Total c/recargo', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.map(i => {
              const cfg = statusConfig[i.status] || { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', label: i.status };
              return (
                <>
                  <tr key={i.id}
                    className={`border-b border-gray-800/50 transition cursor-pointer hover:bg-gray-800/20 ${i.status === 'overdue' ? 'bg-red-900/5' : ''} ${selected?.id === i.id ? 'bg-gray-800/40' : ''}`}
                    onClick={() => setSelected(selected?.id === i.id ? null : i)}>
                    <td className="px-4 py-3 text-white font-semibold">#{i.number}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(i.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{i.paidAt ? fmtDate(i.paidAt) : '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">{fmt(i.amount)}</td>
                    <td className="px-4 py-3 text-white">{fmt(i.totalDue || i.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{selected?.id === i.id ? '▲' : '▼'}</td>
                  </tr>
                  {selected?.id === i.id && (
                    <tr key={`${i.id}-detail`} className="border-b border-gray-800">
                      <td colSpan={7} className="px-4 py-4 bg-gray-800/30">
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div><p className="text-gray-600">ID cuota</p><p className="text-white font-mono mt-0.5">{i.id?.slice(0, 12)}...</p></div>
                          <div><p className="text-gray-600">Línea de crédito</p><p className="text-white font-mono mt-0.5">{i.creditLineId?.slice(0, 12) || '—'}...</p></div>
                          <div><p className="text-gray-600">Recargo mora</p><p className="text-red-400 mt-0.5">{fmt((i.totalDue || i.amount) - i.amount)}</p></div>
                          <div><p className="text-gray-600">Intentos de cobro</p><p className="text-white mt-0.5">{i.paymentAttempts || 0}</p></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
