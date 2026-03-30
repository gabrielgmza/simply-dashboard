'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ReconciliationPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filterItems, setFilterItems] = useState('all');

  const fetchBatches = async () => {
    const [b, s] = await Promise.all([
      api.get('/reconciliation/batches').catch(() => ({ data: [] })),
      api.get('/reconciliation/summary').catch(() => ({ data: null })),
    ]);
    setBatches(b.data);
    setSummary(s.data);
    setLoading(false);
  };

  useEffect(() => { fetchBatches(); }, []);

  const run = async () => {
    setRunning(true);
    await api.post('/reconciliation/run').catch(() => {});
    await fetchBatches();
    setRunning(false);
  };

  const selectBatch = async (batch: any) => {
    setSelectedBatch(batch);
    setFilterItems('all');
    const r = await api.get(`/reconciliation/batches/${batch.id}/items`).catch(() => ({ data: [] }));
    setItems(r.data);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const batchStatusColor: Record<string, string> = {
    closed:              'text-green-400 bg-green-400/10 border-green-400/20',
    closed_with_errors:  'text-red-400 bg-red-400/10 border-red-400/20',
    processing:          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    open:                'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  const filteredItems = filterItems === 'all' ? items : items.filter(i => i.status === filterItems);
  const unmatchedItems = items.filter(i => i.status === 'unmatched');
  const matchedItems = items.filter(i => i.status === 'matched');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Conciliación</h2>
          <p className="text-gray-500 text-sm mt-0.5">Ledger vs Wallets · Ejecución automática 02:00 AM</p>
        </div>
        <button onClick={run} disabled={running}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          {running ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Ejecutando...</> : '▶ Ejecutar ahora'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Último estado', value: summary.status === 'closed' ? 'OK' : 'Con errores', color: summary.status === 'closed' ? 'text-green-400' : 'text-red-400' },
            { label: 'Coincidencias', value: summary.matched || 0, color: 'text-green-400' },
            { label: 'Discrepancias', value: summary.unmatched || 0, color: summary.unmatched > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Diferencia total', value: fmt(summary.difference || 0), color: summary.difference > 0 ? 'text-red-400' : 'text-green-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Historial batches */}
        <div>
          <p className="text-gray-500 text-xs font-medium mb-3 uppercase tracking-wider">Historial de ejecuciones</p>
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
            {batches.length === 0 ? (
              <p className="text-gray-700 text-sm text-center py-8">Sin ejecuciones registradas</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Fecha', 'Estado', '✓', '✗', 'Diferencia'].map(h => (
                      <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} onClick={() => selectBatch(b)}
                      className={`border-b border-gray-800/50 cursor-pointer transition ${selectedBatch?.id === b.id ? 'bg-blue-900/20' : 'hover:bg-gray-800/20'}`}>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(b.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs ${batchStatusColor[b.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                          {b.status === 'closed' ? 'OK' : b.status === 'closed_with_errors' ? 'Errores' : b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-semibold">{b.matchedItems}</td>
                      <td className="px-4 py-3 text-red-400 font-semibold">{b.unmatchedItems}</td>
                      <td className={`px-4 py-3 font-semibold ${Number(b.difference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(b.difference || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detalle batch */}
        <div>
          {!selectedBatch ? (
            <div className="h-full flex items-center justify-center bg-gray-900/40 border border-gray-800 rounded-2xl">
              <p className="text-gray-600 text-sm">Seleccioná una ejecución para ver el detalle</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                  Detalle · {fmtDate(selectedBatch.date)}
                </p>
                <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-lg p-0.5">
                  {['all', 'matched', 'unmatched'].map(f => (
                    <button key={f} onClick={() => setFilterItems(f)}
                      className={`text-xs px-2 py-1 rounded-md transition ${filterItems === f ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                      {f === 'all' ? `Todos (${items.length})` : f === 'matched' ? `✓ ${matchedItems.length}` : `✗ ${unmatchedItems.length}`}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBatch.difference !== 0 && (
                <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <p className="text-red-400 text-xs font-medium">Diferencia detectada</p>
                  <p className="text-red-400 text-sm font-bold">{fmt(selectedBatch.difference)}</p>
                </div>
              )}

              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="text-gray-700 text-center py-8 text-sm">Sin items</p>
                ) : filteredItems.map(item => (
                  <div key={item.id} className={`p-4 border-b border-gray-800/50 ${item.status === 'unmatched' ? 'bg-red-900/10' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${item.status === 'matched' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                        {item.status === 'matched' ? '✓ Coincide' : '✗ Discrepancia'}
                      </span>
                      <span className="text-gray-600 text-xs font-mono">{item.referenceType}</span>
                    </div>
                    {item.notes && <p className="text-gray-500 text-xs mb-2">{item.notes}</p>}
                    {item.status === 'unmatched' && (
                      <div className="flex gap-6 bg-gray-800/60 rounded-lg p-2 mt-1">
                        <div>
                          <p className="text-gray-600 text-xs">Ledger esperado</p>
                          <p className="text-white text-xs font-semibold">{fmt(item.expectedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Wallet real</p>
                          <p className="text-red-400 text-xs font-semibold">{fmt(item.actualAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Diferencia</p>
                          <p className="text-red-400 text-xs font-bold">{fmt(Math.abs((item.expectedAmount || 0) - (item.actualAmount || 0)))}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
