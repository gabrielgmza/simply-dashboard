'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/loans/all').catch(() => ({ data: [] })),
      api.get('/loans/summary').catch(() => ({ data: {} })),
    ]).then(([l, s]) => {
      setLoans(l.data);
      setSummary(s.data);
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    overdue: 'text-red-400 bg-red-400/10 border-red-400/20',
    paid: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    defaulted: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  const filtered = loans
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l =>
      l.externalId?.toLowerCase().includes(search.toLowerCase()) ||
      l.type?.toLowerCase().includes(search.toLowerCase()) ||
      l.source?.toLowerCase().includes(search.toLowerCase())
    );

  const totalCartera = loans.filter(l => l.status === 'active').reduce((s, l) => s + Number(l.amount || 0), 0);
  const totalMora = loans.filter(l => l.status === 'overdue').reduce((s, l) => s + Number(l.amount || 0), 0);
  const tasaMora = totalCartera > 0 ? ((totalMora / totalCartera) * 100).toFixed(1) : '0';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Préstamos & Créditos</h2>
        <p className="text-gray-500 text-sm mt-0.5">Cartera crediticia completa</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Cartera activa', value: fmt(totalCartera), color: 'text-emerald-400', sub: `${summary.active || 0} préstamos` },
          { label: 'En mora', value: fmt(totalMora), color: 'text-red-400', sub: `${summary.overdue || 0} préstamos` },
          { label: 'Tasa de mora', value: `${tasaMora}%`, color: Number(tasaMora) > 5 ? 'text-red-400' : 'text-green-400', sub: 'Mora / cartera activa' },
          { label: 'Cancelados', value: summary.paid || 0, color: 'text-gray-400', sub: 'Préstamos pagados' },
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
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : f === 'overdue' ? 'En mora' : 'Pagados'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ID, tipo, fuente..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['ID Externo', 'Tipo', 'Fuente', 'Monto', 'Cuotas', 'TNA', 'Fecha', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-gray-700 py-8">Sin préstamos{filter !== 'all' ? ` con estado "${filter}"` : ''}</td></tr>
            ) : filtered.map(l => (
              <>
                <tr key={l.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.id === l.id ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.id === l.id ? null : l)}>
                  <td className="px-4 py-3 text-white font-mono">{l.externalId || l.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-300">{l.type?.toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-400">{l.source || '—'}</td>
                  <td className="px-4 py-3 text-white font-semibold">{fmt(l.amount)}</td>
                  <td className="px-4 py-3 text-gray-400">{l.installments}x {fmt(l.installmentAmount)}</td>
                  <td className="px-4 py-3 text-gray-400">{l.interestRate ? `${l.interestRate}%` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${statusColor[l.status] || 'text-gray-400 bg-gray-400/10'}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{selected?.id === l.id ? '▲' : '▼'}</td>
                </tr>
                {selected?.id === l.id && (
                  <tr key={`${l.id}-detail`} className="border-b border-gray-800">
                    <td colSpan={9} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div><p className="text-gray-600">ID completo</p><p className="text-white font-mono mt-0.5 text-xs">{l.id}</p></div>
                        <div><p className="text-gray-600">Usuario ID</p><p className="text-white mt-0.5">{l.userId?.slice(0, 12)}...</p></div>
                        <div><p className="text-gray-600">Plazo</p><p className="text-white mt-0.5">{l.termMonths} meses</p></div>
                        <div><p className="text-gray-600">Próximo vencimiento</p><p className="text-white mt-0.5">{fmtDate(l.nextDueDate)}</p></div>
                        <div><p className="text-gray-600">Capital pagado</p><p className="text-emerald-400 mt-0.5">{fmt(l.paidAmount)}</p></div>
                        <div><p className="text-gray-600">Capital pendiente</p><p className="text-yellow-400 mt-0.5">{fmt(l.remainingAmount)}</p></div>
                        <div><p className="text-gray-600">Cuotas pagas</p><p className="text-white mt-0.5">{l.paidInstallments || 0} / {l.installments}</p></div>
                        <div><p className="text-gray-600">Notas</p><p className="text-gray-400 mt-0.5">{l.notes || '—'}</p></div>
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
