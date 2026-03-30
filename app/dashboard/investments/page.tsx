'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function InvestmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/investment/all').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

  const typeColor: Record<string, string> = {
    fci: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    caucion: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    accion: 'text-green-400 bg-green-400/10 border-green-400/20',
    letra_tesoro: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    plazo_fijo: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  };

  const positions = data?.positions || [];
  const filtered = positions
    .filter((p: any) => filter === 'all' || p.instrumentType === filter)
    .filter((p: any) => p.instrumentName?.toLowerCase().includes(search.toLowerCase()));

  const byType = positions.reduce((acc: any, p: any) => {
    acc[p.instrumentType] = (acc[p.instrumentType] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Inversiones</h2>
        <p className="text-gray-500 text-sm mt-0.5">Cartera de inversiones de clientes</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total invertido', value: fmt(data?.totalInvested), color: 'text-violet-400', sub: 'Suma de posiciones' },
          { label: 'Cuentas activas', value: data?.totalAccounts || 0, color: 'text-blue-400', sub: 'Inversores únicos' },
          { label: 'Posiciones abiertas', value: positions.length, color: 'text-emerald-400', sub: 'Instrumentos activos' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-xs font-medium mb-4">DISTRIBUCIÓN POR INSTRUMENTO</p>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, amount]: any) => {
              const pct = data?.totalInvested > 0 ? (amount / data.totalInvested * 100) : 0;
              const c = typeColor[type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
              const barColor = c.split(' ')[0].replace('text-', 'bg-');
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full border ${c}`}>{type}</span>
                    <span className="text-white">{fmt(amount)} <span className="text-gray-600">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-1.5">
                    <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-wrap">
          {['all', ...Object.keys(byType)].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar instrumento..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Instrumento', 'Tipo', 'Unidades', 'Monto', 'Colateral', 'Actualizado'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-700 py-8">Sin posiciones</td></tr>
            ) : filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3 text-white font-medium">{p.instrumentName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${typeColor[p.instrumentType] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{p.instrumentType}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{Number(p.units).toFixed(4)}</td>
                <td className="px-4 py-3 text-violet-400 font-semibold">{fmt(p.amount)}</td>
                <td className="px-4 py-3">{p.isCollateralEligible ? <span className="text-green-400">✓ Elegible</span> : <span className="text-gray-600">—</span>}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
