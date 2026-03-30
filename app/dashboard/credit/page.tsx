'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CreditPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/credit/all').catch(() => ({ data: [] })),
      api.get('/credit/summary').catch(() => ({ data: {} })),
    ]).then(([p, s]) => { setPurchases(p.data); setSummary(s.data); setLoading(false); });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    overdue: 'text-red-400 bg-red-400/10 border-red-400/20',
    paid: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  };

  const filtered = purchases
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.description?.toLowerCase().includes(search.toLowerCase()) || p.userId?.includes(search));

  const tasaMora = summary?.totalFinanced > 0
    ? ((summary?.overdueAmount || 0) / summary?.totalFinanced * 100).toFixed(1) : '0';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Cupo & Crédito</h2>
        <p className="text-gray-500 text-sm mt-0.5">Gestión de compras financiadas y cuotas</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total financiado', value: fmt(summary?.totalFinanced), color: 'text-emerald-400', sub: `${summary?.totalPurchases || 0} compras` },
          { label: 'Activas', value: summary?.activePurchases || 0, color: 'text-blue-400', sub: 'Compras en curso' },
          { label: 'Cuotas pendientes', value: summary?.pending || 0, color: 'text-yellow-400', sub: 'Por cobrar' },
          { label: 'En mora', value: summary?.overdue || 0, color: 'text-red-400', sub: `Tasa ${tasaMora}%` },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'active', 'overdue', 'paid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : f === 'overdue' ? 'En mora' : 'Pagadas'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por descripción, usuario..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Descripción', 'Usuario', 'Fecha', 'Monto', 'Cuotas', 'c/cuota', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-700 py-8">Sin compras financiadas</td></tr>
            ) : filtered.map(p => (
              <>
                <tr key={p.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.id === p.id ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <td className="px-4 py-3 text-white">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{p.userId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-white font-semibold">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-400">{p.installmentsCount}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(p.installmentAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${statusColor[p.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{selected?.id === p.id ? '▲' : '▼'}</td>
                </tr>
                {selected?.id === p.id && (
                  <tr key={`${p.id}-detail`} className="border-b border-gray-800">
                    <td colSpan={8} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div><p className="text-gray-600">ID</p><p className="text-white font-mono mt-0.5">{p.id}</p></div>
                        <div><p className="text-gray-600">TNA</p><p className="text-white mt-0.5">{p.interestRate ? `${p.interestRate}%` : '—'}</p></div>
                        <div><p className="text-gray-600">Cuotas pagas</p><p className="text-emerald-400 mt-0.5">{p.paidInstallments || 0} / {p.installmentsCount}</p></div>
                        <div><p className="text-gray-600">Próx. vencimiento</p><p className="text-yellow-400 mt-0.5">{fmtDate(p.nextDueDate)}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
