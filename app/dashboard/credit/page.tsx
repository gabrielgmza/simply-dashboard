'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CreditPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/credit/all').catch(() => ({ data: [] })),
      api.get('/credit/summary').catch(() => ({ data: {} })),
    ]).then(([p, s]) => {
      setPurchases(p.data);
      setSummary(s.data);
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Cupo & Crédito</h2>

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Total financiado</p>
            <p className="text-white text-xl font-bold mt-1">{fmt(summary.totalFinanced)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Compras activas</p>
            <p className="text-blue-400 text-xl font-bold mt-1">{summary.totalPurchases}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Cuotas pendientes</p>
            <p className="text-yellow-400 text-xl font-bold mt-1">{summary.pending}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">En mora</p>
            <p className="text-red-400 text-xl font-bold mt-1">{summary.overdue}</p>
          </div>
        </div>
      )}

      {purchases.length === 0 ? (
        <p className="text-gray-400">No hay compras financiadas.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Descripción</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Cuotas</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">c/cuota</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.installmentsCount}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{fmt(p.installmentAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
