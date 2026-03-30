'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get('/ledger/all').catch(() => api.get('/ledger/entries')).then(r => {
      setEntries(r.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const typeConfig: Record<string, { color: string; bgColor: string; sign: string; label: string }> = {
    cash_in:      { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/20', sign: '+', label: 'Ingreso' },
    cash_out:     { color: 'text-red-400',     bgColor: 'bg-red-400/10 border-red-400/20',         sign: '-', label: 'Egreso' },
    transfer_in:  { color: 'text-blue-400',    bgColor: 'bg-blue-400/10 border-blue-400/20',       sign: '+', label: 'Transfer entrada' },
    transfer_out: { color: 'text-orange-400',  bgColor: 'bg-orange-400/10 border-orange-400/20',   sign: '-', label: 'Transfer salida' },
    fee_charge:   { color: 'text-red-400',     bgColor: 'bg-red-400/10 border-red-400/20',         sign: '-', label: 'Comisión' },
    fee_refund:   { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/20', sign: '+', label: 'Devolución comisión' },
    reversal:     { color: 'text-purple-400',  bgColor: 'bg-purple-400/10 border-purple-400/20',   sign: '+', label: 'Reversa' },
    adjustment:   { color: 'text-yellow-400',  bgColor: 'bg-yellow-400/10 border-yellow-400/20',   sign: '±', label: 'Ajuste' },
  };

  const types = ['all', 'cash_in', 'cash_out', 'transfer_in', 'transfer_out', 'fee_charge', 'reversal', 'adjustment'];

  const filtered = entries.filter(e => {
    const matchType = filter === 'all' || e.type === filter;
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.walletId?.includes(search) || e.referenceId?.includes(search);
    return matchType && matchSearch;
  });

  const totalIn = entries.filter(e => ['cash_in','transfer_in','fee_refund','reversal'].includes(e.type))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalOut = entries.filter(e => ['cash_out','transfer_out','fee_charge'].includes(e.type))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const net = totalIn - totalOut;

  const byType = types.slice(1).map(t => ({
    type: t,
    count: entries.filter(e => e.type === t).length,
    amount: entries.filter(e => e.type === t).reduce((s, e) => s + Number(e.amount || 0), 0),
  })).filter(t => t.count > 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Ledger Contable</h2>
        <p className="text-gray-500 text-sm mt-0.5">Registro de doble entrada · ISO 20022 compatible</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total entradas', value: fmt(totalIn), color: 'text-emerald-400', sub: `${entries.filter(e => ['cash_in','transfer_in'].includes(e.type)).length} ops` },
          { label: 'Total salidas', value: fmt(totalOut), color: 'text-red-400', sub: `${entries.filter(e => ['cash_out','transfer_out'].includes(e.type)).length} ops` },
          { label: 'Posición neta', value: fmt(net), color: net >= 0 ? 'text-emerald-400' : 'text-red-400', sub: 'Entradas - salidas' },
          { label: 'Total registros', value: entries.length, color: 'text-white', sub: `${filtered.length} filtrados` },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {byType.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-xs font-medium mb-4">DESGLOSE POR TIPO</p>
          <div className="grid grid-cols-4 gap-3">
            {byType.map(t => {
              const cfg = typeConfig[t.type];
              return (
                <div key={t.type} className="bg-gray-800/60 rounded-xl p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg?.bgColor || ''}`}>{t.type.replace('_', ' ')}</span>
                  <p className={`text-sm font-bold mt-2 ${cfg?.color || 'text-gray-400'}`}>{cfg?.sign}{fmt(t.amount)}</p>
                  <p className="text-gray-600 text-xs">{t.count} registros</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`text-xs px-2 py-1.5 rounded-lg transition font-medium ${filter === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t === 'all' ? 'Todos' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por descripción, wallet ID, referencia..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Tipo', 'Descripción', 'Wallet', 'Referencia', 'Monto', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.slice(0, 100).map(e => {
              const cfg = typeConfig[e.type] || { color: 'text-gray-400', bgColor: 'bg-gray-400/10 border-gray-400/20', sign: '', label: e.type };
              return (
                <>
                  <tr key={e.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.id === e.id ? 'bg-gray-800/40' : ''}`}
                    onClick={() => setSelected(selected?.id === e.id ? null : e)}>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${cfg.bgColor}`}>{e.type?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-xs">{e.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{e.walletId?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{e.referenceId?.slice(0, 8) || '—'}</td>
                    <td className={`px-4 py-3 font-bold ${cfg.color}`}>{cfg.sign}{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{selected?.id === e.id ? '▲' : '▼'}</td>
                  </tr>
                  {selected?.id === e.id && (
                    <tr key={`${e.id}-detail`} className="border-b border-gray-800">
                      <td colSpan={7} className="px-4 py-4 bg-gray-800/30">
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div><p className="text-gray-600">ID entrada</p><p className="text-white font-mono mt-0.5">{e.id}</p></div>
                          <div><p className="text-gray-600">Wallet ID</p><p className="text-white font-mono mt-0.5">{e.walletId}</p></div>
                          <div><p className="text-gray-600">Referencia</p><p className="text-white font-mono mt-0.5">{e.referenceId || '—'}</p></div>
                          <div><p className="text-gray-600">Tipo referencia</p><p className="text-white mt-0.5">{e.referenceType || '—'}</p></div>
                          <div><p className="text-gray-600">Cuenta ledger</p><p className="text-white mt-0.5">{e.ledgerAccountId || '—'}</p></div>
                          <div><p className="text-gray-600">Monto exacto</p><p className={`font-bold mt-0.5 ${cfg.color}`}>{cfg.sign}${Number(e.amount).toFixed(2)}</p></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 100 && <p className="text-gray-600 text-center py-3 text-xs">Mostrando 100 de {filtered.length} registros</p>}
      </div>
    </div>
  );
}
