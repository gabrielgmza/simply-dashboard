'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AccountingPage() {
  const [balance, setBalance] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState('balance');

  const load = async () => {
    const [b, p] = await Promise.all([
      api.get('/accounting/balance').catch(() => ({ data: null })),
      api.get('/accounting/periods').catch(() => ({ data: [] })),
    ]);
    setBalance(b.data);
    setPeriods(p.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const closePeriod = async () => {
    setClosing(true);
    await api.post('/accounting/close-period').catch(() => {});
    await load();
    setClosing(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

  const typeColor: Record<string, string> = {
    asset: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    liability: 'text-red-400 bg-red-400/10 border-red-400/20',
    equity: 'text-green-400 bg-green-400/10 border-green-400/20',
    revenue: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    expense: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  const equity = (balance?.summary?.totalAssets || 0) - (balance?.summary?.totalLiabilities || 0);
  const leverage = balance?.summary?.totalAssets > 0
    ? ((balance?.summary?.totalLiabilities / balance?.summary?.totalAssets) * 100).toFixed(1) : '0';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Contabilidad Financiera</h2>
          <p className="text-gray-500 text-sm mt-0.5">Balance general y períodos contables</p>
        </div>
        <button onClick={closePeriod} disabled={closing}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          {closing ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Cerrando...</> : '⊕ Cerrar período'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total activos', value: fmt(balance?.summary?.totalAssets), color: 'text-blue-400' },
          { label: 'Total pasivos', value: fmt(balance?.summary?.totalLiabilities), color: 'text-red-400' },
          { label: 'Patrimonio neto', value: fmt(equity), color: equity >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Ratio de apalancamiento', value: `${leverage}%`, color: Number(leverage) > 80 ? 'text-red-400' : 'text-yellow-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
        {['balance', 'cuentas', 'periodos'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-4 py-2 rounded-lg transition font-medium ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {t === 'balance' ? 'Balance' : t === 'cuentas' ? 'Plan de cuentas' : 'Períodos'}
          </button>
        ))}
      </div>

      {tab === 'balance' && balance && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium mb-4">ACTIVOS</p>
            <div className="space-y-2">
              {(balance.accounts || []).filter((a: any) => a.type === 'asset').map((a: any) => (
                <div key={a.id} className="flex justify-between items-center text-xs border-b border-gray-800/50 pb-2">
                  <div>
                    <p className="text-white">{a.code} — {a.name}</p>
                    <p className="text-gray-600">{a.description || ''}</p>
                  </div>
                  <p className="text-blue-400 font-semibold">{fmt(a.balance)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <p className="text-gray-400 text-xs font-semibold">TOTAL ACTIVOS</p>
                <p className="text-blue-400 font-bold">{fmt(balance?.summary?.totalAssets)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium mb-4">PASIVOS & PATRIMONIO</p>
            <div className="space-y-2">
              {(balance.accounts || []).filter((a: any) => a.type === 'liability' || a.type === 'equity').map((a: any) => (
                <div key={a.id} className="flex justify-between items-center text-xs border-b border-gray-800/50 pb-2">
                  <div>
                    <p className="text-white">{a.code} — {a.name}</p>
                    <p className="text-gray-600">{a.description || ''}</p>
                  </div>
                  <p className={`font-semibold ${a.type === 'liability' ? 'text-red-400' : 'text-green-400'}`}>{fmt(a.balance)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <p className="text-gray-400 text-xs font-semibold">TOTAL PASIVOS</p>
                <p className="text-red-400 font-bold">{fmt(balance?.summary?.totalLiabilities)}</p>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <p className="text-gray-300 text-xs font-bold">PATRIMONIO NETO</p>
                <p className={`font-bold ${equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(equity)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'cuentas' && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Código', 'Cuenta', 'Tipo', 'Saldo'].map(h => (
                  <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(balance?.accounts || []).map((a: any) => (
                <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-mono">{a.code}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{a.name}</p>
                    <p className="text-gray-600 text-xs">{a.description || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${typeColor[a.type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{a.type}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{fmt(a.balance)}</td>
                </tr>
              ))}
              {!balance?.accounts?.length && <tr><td colSpan={4} className="text-center text-gray-700 py-8">Sin cuentas</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'periodos' && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Período', 'Activos', 'Pasivos', 'Patrimonio', 'Resultado', 'Estado'].map(h => (
                  <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-700 py-8">Sin períodos cerrados</td></tr>
              ) : periods.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3 text-blue-400">{fmt(p.totalAssets)}</td>
                  <td className="px-4 py-3 text-red-400">{fmt(p.totalLiabilities)}</td>
                  <td className="px-4 py-3 text-emerald-400">{fmt((p.totalAssets || 0) - (p.totalLiabilities || 0))}</td>
                  <td className="px-4 py-3 text-green-400">{fmt(p.netResult)}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
