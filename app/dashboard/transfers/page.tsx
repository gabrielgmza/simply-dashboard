'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, count: 0, today: 0, todayCount: 0 });

  useEffect(() => {
    api.get('/transfers/all').then(r => {
      const data = r.data;
      setTransfers(data);
      const today = new Date().toDateString();
      const todayTransfers = data.filter((t: any) => new Date(t.createdAt).toDateString() === today);
      setStats({
        total: data.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        count: data.length,
        today: todayTransfers.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        todayCount: todayTransfers.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const filtered = transfers.filter(t =>
    t.fromWalletId?.includes(search) || t.toWalletId?.includes(search) || t.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Transferencias</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total histórico</p>
          <p className="text-white text-lg font-bold mt-1">{fmt(stats.total)}</p>
          <p className="text-gray-600 text-xs">{stats.count} operaciones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Hoy</p>
          <p className="text-blue-400 text-lg font-bold mt-1">{fmt(stats.today)}</p>
          <p className="text-gray-600 text-xs">{stats.todayCount} operaciones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Promedio por op.</p>
          <p className="text-white text-lg font-bold mt-1">{fmt(stats.count > 0 ? stats.total / stats.count : 0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Completadas</p>
          <p className="text-green-400 text-lg font-bold mt-1">{transfers.filter(t => t.status === 'completed').length}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por wallet ID o descripción..."
        className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Origen</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Destino</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Descripción</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.fromWalletId?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.toWalletId?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{t.description}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'completed' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">{fmt(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">Sin resultados</p>}
      </div>
    </div>
  );
}
