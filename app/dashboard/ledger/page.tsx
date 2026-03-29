'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/ledger/all').catch(() => api.get('/ledger/entries')).then(r => {
      setEntries(r.data);
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const typeConfig: Record<string, { color: string; sign: string }> = {
    cash_in: { color: 'text-green-400', sign: '+' },
    cash_out: { color: 'text-red-400', sign: '-' },
    transfer_in: { color: 'text-blue-400', sign: '+' },
    transfer_out: { color: 'text-orange-400', sign: '-' },
    fee_charge: { color: 'text-red-400', sign: '-' },
    fee_refund: { color: 'text-green-400', sign: '+' },
    reversal: { color: 'text-purple-400', sign: '+' },
    adjustment: { color: 'text-yellow-400', sign: '±' },
  };

  const types = ['all', 'cash_in', 'cash_out', 'transfer_in', 'transfer_out', 'fee_charge'];

  const filtered = entries.filter(e => {
    const matchType = filter === 'all' || e.type === filter;
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || e.walletId?.includes(search);
    return matchType && matchSearch;
  });

  const totalIn = entries.filter(e => ['cash_in', 'transfer_in', 'fee_refund', 'reversal'].includes(e.type)).reduce((s, e) => s + Number(e.amount), 0);
  const totalOut = entries.filter(e => ['cash_out', 'transfer_out', 'fee_charge'].includes(e.type)).reduce((s, e) => s + Number(e.amount), 0);

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Ledger contable</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total entradas</p>
          <p className="text-green-400 text-xl font-bold mt-1">{fmt(totalIn)}</p>
          <p className="text-gray-600 text-xs">{entries.filter(e => ['cash_in','transfer_in'].includes(e.type)).length} operaciones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total salidas</p>
          <p className="text-red-400 text-xl font-bold mt-1">{fmt(totalOut)}</p>
          <p className="text-gray-600 text-xs">{entries.filter(e => ['cash_out','transfer_out'].includes(e.type)).length} operaciones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total registros</p>
          <p className="text-white text-xl font-bold mt-1">{entries.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descripción o wallet..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
        <div className="flex gap-1">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${filter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {t === 'all' ? 'Todos' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Tipo</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Descripción</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Wallet</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((e: any) => {
              const cfg = typeConfig[e.type] || { color: 'text-gray-400', sign: '' };
              return (
                <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(e.createdAt).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${cfg.color} bg-current/10`}>{e.type}</span></td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{e.description}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.walletId?.slice(0, 8)}...</td>
                  <td className={`px-4 py-3 text-right font-medium ${cfg.color}`}>{cfg.sign}{fmt(e.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">Sin resultados</p>}
        {filtered.length > 100 && <p className="text-gray-600 text-center py-3 text-xs">Mostrando 100 de {filtered.length} registros</p>}
      </div>
    </div>
  );
}
