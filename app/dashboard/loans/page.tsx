'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/loans/all'), api.get('/loans/summary')]).then(([l, s]) => {
      setLoans(l.data);
      setSummary(s.data);
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const statusColor: Record<string, string> = { active: 'text-green-400 bg-green-400/10', overdue: 'text-red-400 bg-red-400/10', paid: 'text-gray-400 bg-gray-400/10', pending: 'text-yellow-400 bg-yellow-400/10' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Préstamos y Créditos</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total cartera</p>
          <p className="text-white text-2xl font-bold mt-1">{fmt(summary.total)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Préstamos activos</p>
          <p className="text-green-400 text-2xl font-bold mt-1">{summary.active || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">En mora</p>
          <p className="text-red-400 text-2xl font-bold mt-1">{summary.overdue || 0}</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">ID Externo</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Tipo</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fuente</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Cuotas</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white font-mono text-xs">{l.externalId || l.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-400">{l.type.toUpperCase()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.source}</td>
                <td className="px-4 py-3 text-right text-white font-medium">{fmt(l.amount)}</td>
                <td className="px-4 py-3 text-right text-gray-400">{l.installments}x {fmt(l.installmentAmount)}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[l.status] || 'text-gray-400 bg-gray-400/10'}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
