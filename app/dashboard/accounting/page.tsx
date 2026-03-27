'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AccountingPage() {
  const [balance, setBalance] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetch = async () => {
    const [b, p] = await Promise.all([api.get('/accounting/balance'), api.get('/accounting/periods')]);
    setBalance(b.data);
    setPeriods(p.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const closePeriod = async () => {
    setClosing(true);
    await api.post('/accounting/close-period');
    await fetch();
    setClosing(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold">Contabilidad Financiera</h2>
        <button onClick={closePeriod} disabled={closing} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
          {closing ? 'Cerrando...' : 'Cerrar período'}
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm font-medium mb-4">Balance actual</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Total activos</span><span className="text-white font-bold">{fmt(balance.summary?.totalAssets)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Total pasivos</span><span className="text-red-400">{fmt(balance.summary?.totalLiabilities)}</span></div>
              <div className="flex justify-between text-sm border-t border-gray-800 pt-2"><span className="text-gray-400">Patrimonio</span><span className="text-green-400 font-bold">{fmt(balance.summary?.equity)}</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm font-medium mb-4">Plan de cuentas</p>
            <div className="space-y-2">
              {balance.accounts?.map((a: any) => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{a.code} — {a.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.type === 'asset' ? 'text-blue-400 bg-blue-400/10' : a.type === 'liability' ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>{a.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {periods.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Período</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Activos</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Pasivos</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Resultado</th>
                <th className="text-center text-gray-400 px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-white">{new Date(p.date).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-right text-white">{fmt(p.totalAssets)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{fmt(p.totalLiabilities)}</td>
                  <td className="px-4 py-3 text-right text-green-400">{fmt(p.netResult)}</td>
                  <td className="px-4 py-3 text-center"><span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
