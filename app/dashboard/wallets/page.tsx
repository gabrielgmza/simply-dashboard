'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalFunds, setTotalFunds] = useState(0);

  useEffect(() => {
    api.get('/wallets').then(r => {
      setWallets(r.data);
      setTotalFunds(r.data.reduce((s: number, w: any) => s + Number(w.available || 0), 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const filtered = wallets.filter(w => w.email?.toLowerCase().includes(search.toLowerCase()) || w.walletId?.includes(search));

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Wallets</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
          <p className="text-gray-500 text-xs">Total fondos clientes</p>
          <p className="text-green-400 font-bold">{fmt(totalFunds)}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por email o wallet ID..."
        className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">CVU</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Alias</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.walletId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3 text-white">{w.email}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{w.cvu ? `${w.cvu.slice(0,7)}...` : '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{w.alias || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${w.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">{fmt(w.available)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
