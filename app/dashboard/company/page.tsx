'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CompanyPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/company/accounts/summary').then(r => { setSummary(r.data); setLoading(false); });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const typeColor: Record<string, string> = { operational: 'text-blue-400 bg-blue-400/10', bridge: 'text-yellow-400 bg-yellow-400/10', comitente: 'text-purple-400 bg-purple-400/10', reserve: 'text-green-400 bg-green-400/10', tax: 'text-orange-400 bg-orange-400/10' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Cuentas de la Empresa</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <p className="text-gray-400 text-sm mb-1">Total en cuentas empresa</p>
        <p className="text-white text-3xl font-bold">{fmt(summary?.totalBalance)}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Cuenta</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Banco</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Tipo</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {summary?.accounts?.map((a: any) => (
              <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <p className="text-white">{a.name}</p>
                  <p className="text-gray-500 text-xs">{a.description}</p>
                </td>
                <td className="px-4 py-3 text-gray-400">{a.bank || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${typeColor[a.type]}`}>{a.type}</span></td>
                <td className="px-4 py-3 text-right text-white font-medium">{fmt(a.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
