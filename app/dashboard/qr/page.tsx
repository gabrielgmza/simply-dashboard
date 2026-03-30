'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function QrPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, count: 0, today: 0, todayCount: 0 });

  useEffect(() => {
    // QR transactions vienen del ledger filtradas por referenceType = 'qr'
    api.get('/transfers/all').then(r => {
      const data = r.data.filter((t: any) =>
        t.description?.toLowerCase().includes('qr') ||
        t.referenceType === 'qr'
      );
      setTransactions(data);
      const today = new Date().toDateString();
      const todayData = data.filter((t: any) => new Date(t.createdAt).toDateString() === today);
      setStats({
        total: data.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        count: data.length,
        today: todayData.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        todayCount: todayData.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const filtered = transactions.filter(t =>
    t.fromWalletId?.includes(search) ||
    t.toWalletId?.includes(search) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-2">Pagos QR</h2>
      <p className="text-gray-500 text-sm mb-6">Estándar EMVCo · BCRA Interoperable</p>

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
          <p className="text-purple-400 text-lg font-bold mt-1">{fmt(stats.count ? stats.total / stats.count : 0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Estándar</p>
          <p className="text-green-400 text-lg font-bold mt-1">EMVCo</p>
          <p className="text-gray-600 text-xs">BCRA Interoperable</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <input
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none"
          placeholder="Buscar por wallet, descripción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Fecha</th>
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Wallet origen</th>
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Wallet destino</th>
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Descripción</th>
              <th className="text-right text-gray-500 px-4 py-3 font-medium">Monto</th>
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-600 py-8">No hay pagos QR registrados</td></tr>
            ) : (
              filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-400">{new Date(t.createdAt).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{t.fromWalletId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{t.toWalletId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-300">{t.description || '-'}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">{fmt(t.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                      {t.status || 'completado'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
