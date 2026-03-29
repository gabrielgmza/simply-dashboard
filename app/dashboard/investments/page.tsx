'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function InvestmentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/investment/all').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const typeColor: Record<string, string> = {
    fci: 'text-blue-400 bg-blue-400/10',
    caucion: 'text-purple-400 bg-purple-400/10',
    accion: 'text-green-400 bg-green-400/10',
    letra_tesoro: 'text-yellow-400 bg-yellow-400/10',
    plazo_fijo: 'text-teal-400 bg-teal-400/10',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Inversiones</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total invertido</p>
          <p className="text-green-400 text-2xl font-bold mt-1">{fmt(data?.totalInvested)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Cuentas activas</p>
          <p className="text-white text-2xl font-bold mt-1">{data?.totalAccounts || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Posiciones abiertas</p>
          <p className="text-white text-2xl font-bold mt-1">{data?.positions?.length || 0}</p>
        </div>
      </div>

      {data?.positions?.length === 0 ? (
        <p className="text-gray-400">No hay posiciones abiertas.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Instrumento</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Tipo</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Cuotas</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Monto</th>
                <th className="text-center text-gray-400 px-4 py-3 font-medium">Colateral</th>
              </tr>
            </thead>
            <tbody>
              {data?.positions?.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{p.instrumentName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColor[p.instrumentType] || 'text-gray-400 bg-gray-400/10'}`}>
                      {p.instrumentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{Number(p.units).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    {p.isCollateralEligible
                      ? <span className="text-green-400 text-xs">✓ Elegible</span>
                      : <span className="text-gray-600 text-xs">—</span>}
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
