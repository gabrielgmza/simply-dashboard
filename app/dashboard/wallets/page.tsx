'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface WalletEntry {
  id: string;
  email: string;
  walletId: string;
  status: string;
  available: string;
  currency: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wallets').then((res) => {
      setWallets(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Wallets</h2>
      {wallets.length === 0 ? (
        <p className="text-gray-400">No hay wallets.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Wallet ID</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Saldo disponible</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.walletId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 text-white">{w.email}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{w.walletId}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full text-green-400 bg-green-400/10">
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {Number(w.available).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
