'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CollectionsPage() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchData = () => {
    api.get('/collections/all').catch(() => api.get('/collections/history')).then(r => {
      setInstallments(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const processOverdue = async () => {
    setProcessing(true);
    await api.post('/collections/process-overdue').catch(() => {});
    await fetchData();
    setProcessing(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const statusColor: Record<string, string> = {
    scheduled: 'text-blue-400 bg-blue-400/10',
    paid: 'text-green-400 bg-green-400/10',
    overdue: 'text-red-400 bg-red-400/10',
    processing: 'text-yellow-400 bg-yellow-400/10',
  };

  const filtered = filter === 'all' ? installments : installments.filter(i => i.status === filter);

  const stats = {
    total: installments.reduce((s, i) => s + Number(i.amount || 0), 0),
    paid: installments.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0),
    overdue: installments.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0),
    pending: installments.filter(i => i.status === 'scheduled').reduce((s, i) => s + Number(i.amount || 0), 0),
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Cobranzas</h2>
        <button onClick={processOverdue} disabled={processing}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          {processing ? 'Procesando...' : 'Procesar vencidas'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total cartera</p>
          <p className="text-white text-xl font-bold mt-1">{fmt(stats.total)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Cobrado</p>
          <p className="text-green-400 text-xl font-bold mt-1">{fmt(stats.paid)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Pendiente</p>
          <p className="text-yellow-400 text-xl font-bold mt-1">{fmt(stats.pending)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">En mora</p>
          <p className="text-red-400 text-xl font-bold mt-1">{fmt(stats.overdue)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'scheduled', 'paid', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'Todas' : f}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Cuota</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Vencimiento</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Total con recargo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i: any) => (
              <tr key={i.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${i.status === 'overdue' ? 'bg-red-900/5' : ''}`}>
                <td className="px-4 py-3 text-white">#{i.number}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(i.dueDate).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[i.status] || 'text-gray-400 bg-gray-400/10'}`}>{i.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-white">{fmt(i.amount)}</td>
                <td className="px-4 py-3 text-right text-white">{fmt(i.totalDue || i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">Sin resultados</p>}
      </div>
    </div>
  );
}
