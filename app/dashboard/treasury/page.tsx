'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TreasuryPage() {
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/treasury/current').then(r => { setPosition(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const recalculate = () => { setLoading(true); api.post('/treasury/calculate').then(r => { setPosition(r.data); setLoading(false); }); };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <p className="text-gray-400">Calculando posición...</p>;

  const items = [
    { label: 'Fondos clientes', value: fmt(position?.totalClientFunds), color: 'text-green-400' },
    { label: 'Total invertido', value: fmt(position?.totalInvested), color: 'text-purple-400' },
    { label: 'Crédito utilizado', value: fmt(position?.totalCreditUtilized), color: 'text-red-400' },
    { label: 'Fondos en tránsito', value: fmt(position?.totalPending), color: 'text-yellow-400' },
    { label: 'Buffer operativo (10%)', value: fmt(position?.operationalBuffer), color: 'text-teal-400' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Tesorería</h2>
        <button onClick={recalculate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">Recalcular</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {items.map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-600 text-xs">Última actualización: {new Date(position?.createdAt).toLocaleString('es-AR')}</p>
    </div>
  );
}
