'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TreasuryPage() {
  const [position, setPosition] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = () => {
    Promise.all([
      api.get('/treasury/current').catch(() => ({ data: {} })),
      Promise.resolve({ data: [] }),
    ]).then(([pos, hist]) => {
      setPosition(pos.data);
      setHistory(hist.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const recalculate = async () => {
    setRecalculating(true);
    await api.post('/treasury/calculate').catch(() => {});
    load();
    setRecalculating(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const ratio = position?.totalClientFunds > 0
    ? ((position?.operationalBuffer / position?.totalClientFunds) * 100).toFixed(1)
    : '0';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Tesorería</h2>
          <p className="text-gray-500 text-sm mt-0.5">Posición de fondos en tiempo real</p>
        </div>
        <button onClick={recalculate} disabled={recalculating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          {recalculating ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Calculando...</> : '↻ Recalcular'}
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Fondos bajo custodia', value: fmt(position?.totalClientFunds), color: 'text-emerald-400', sub: 'Total wallets clientes' },
          { label: 'Total invertido', value: fmt(position?.totalInvested), color: 'text-violet-400', sub: 'FCI + instrumentos' },
          { label: 'Buffer operativo', value: fmt(position?.operationalBuffer), color: 'text-cyan-400', sub: `${ratio}% de fondos clientes` },
          { label: 'Crédito utilizado', value: fmt(position?.totalCreditUtilized), color: 'text-red-400', sub: 'Cupo utilizado' },
          { label: 'Fondos en tránsito', value: fmt(position?.totalPending), color: 'text-yellow-400', sub: 'Transferencias pendientes' },
          { label: 'Posición neta', value: fmt((position?.totalClientFunds || 0) - (position?.totalInvested || 0)), color: 'text-blue-400', sub: 'Custodia - invertido' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Barra de composición */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-500 text-xs font-medium mb-4">COMPOSICIÓN DE FONDOS</p>
        <div className="space-y-3">
          {[
            { label: 'Disponible en wallets', value: position?.totalClientFunds - position?.totalInvested, total: position?.totalClientFunds, color: 'bg-emerald-500' },
            { label: 'Invertido en FCI', value: position?.totalInvested, total: position?.totalClientFunds, color: 'bg-violet-500' },
            { label: 'En tránsito', value: position?.totalPending, total: position?.totalClientFunds, color: 'bg-yellow-500' },
          ].map((item, i) => {
            const pct = item.total > 0 ? Math.min(100, (item.value / item.total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white">{fmt(item.value)} <span className="text-gray-600">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="bg-gray-800 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="text-gray-400 text-sm font-medium">Historial de posiciones</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Fondos clientes', 'Invertido', 'Buffer', 'En tránsito'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-700 py-6">Sin historial disponible</td></tr>
            ) : history.slice(0, 10).map((h: any) => (
              <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-400">{fmtDate(h.createdAt)}</td>
                <td className="px-4 py-3 text-emerald-400">{fmt(h.totalClientFunds)}</td>
                <td className="px-4 py-3 text-violet-400">{fmt(h.totalInvested)}</td>
                <td className="px-4 py-3 text-cyan-400">{fmt(h.operationalBuffer)}</td>
                <td className="px-4 py-3 text-yellow-400">{fmt(h.totalPending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-700 text-xs">Última actualización: {fmtDate(position?.createdAt)}</p>
    </div>
  );
}
