'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ReconciliationPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchBatches = () => api.get('/reconciliation/batches').then(r => { setBatches(r.data); setLoading(false); });
  useEffect(() => { fetchBatches(); }, []);

  const run = async () => {
    setRunning(true);
    await api.post('/reconciliation/run');
    await fetchBatches();
    setRunning(false);
  };

  const selectBatch = async (batch: any) => {
    setSelectedBatch(batch);
    const r = await api.get(`/reconciliation/batches/${batch.id}/items`);
    setItems(r.data);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Conciliación</h2>
        <button onClick={run} disabled={running}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          {running ? 'Ejecutando...' : '▶ Ejecutar conciliación'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lista batches */}
        <div>
          <p className="text-gray-500 text-xs mb-3">HISTORIAL DE CONCILIACIONES</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
                  <th className="text-right text-gray-400 px-4 py-3 font-medium">✓</th>
                  <th className="text-right text-gray-400 px-4 py-3 font-medium">✗</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}
                    onClick={() => selectBatch(b)}
                    className={`border-b border-gray-800/50 cursor-pointer transition ${selectedBatch?.id === b.id ? 'bg-blue-900/20' : 'hover:bg-gray-800/30'}`}>
                    <td className="px-4 py-3 text-white">{new Date(b.date).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        b.status === 'closed' ? 'text-green-400 bg-green-400/10' :
                        b.status === 'closed_with_errors' ? 'text-red-400 bg-red-400/10' :
                        'text-yellow-400 bg-yellow-400/10'
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">{b.matchedItems}</td>
                    <td className="px-4 py-3 text-right text-red-400">{b.unmatchedItems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items del batch */}
        <div>
          {selectedBatch ? (
            <>
              <p className="text-gray-500 text-xs mb-3">
                DETALLE — {new Date(selectedBatch.date).toLocaleDateString('es-AR')} · Diferencia total: {fmt(selectedBatch.difference)}
              </p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className={`p-4 border-b border-gray-800/50 ${item.status === 'unmatched' ? 'bg-red-900/10' : ''}`}>
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'matched' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {item.status}
                      </span>
                      <span className="text-gray-500 text-xs">{item.referenceType}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">{item.notes}</p>
                    {item.status === 'unmatched' && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-gray-500">Ledger: <span className="text-white">{fmt(item.expectedAmount)}</span></span>
                        <span className="text-gray-500">Wallet: <span className="text-red-400">{fmt(item.actualAmount)}</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-600">Seleccioná un batch para ver el detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
