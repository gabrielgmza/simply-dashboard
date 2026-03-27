'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ReconciliationPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetch = () => api.get('/reconciliation/batches').then(r => { setBatches(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const run = async () => {
    setRunning(true);
    await api.post('/reconciliation/run');
    await fetch();
    setRunning(false);
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Conciliación</h2>
        <button onClick={run} disabled={running} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          {running ? 'Ejecutando...' : 'Ejecutar conciliación'}
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Total</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Matcheados</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Sin match</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white">{new Date(b.date).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${b.status === 'closed' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>{b.status}</span></td>
                <td className="px-4 py-3 text-right text-white">{b.totalItems}</td>
                <td className="px-4 py-3 text-right text-green-400">{b.matchedItems}</td>
                <td className="px-4 py-3 text-right text-red-400">{b.unmatchedItems}</td>
                <td className="px-4 py-3 text-right text-white">{b.difference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
