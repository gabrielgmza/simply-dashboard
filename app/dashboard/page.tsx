'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DashboardHome() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    Promise.all([
      api.get('/kyc/pending').catch(() => ({ data: [] })),
      api.get('/fraud/cases/open').catch(() => ({ data: [] })),
      api.get('/support/tickets').catch(() => ({ data: [] })),
      api.get('/treasury/current').catch(() => ({ data: {} })),
      api.get('/reconciliation/batches').catch(() => ({ data: [] })),
    ]).then(([kyc, fraud, support, treasury, recon]) => {
      setData({
        kycPending: kyc.data.length,
        fraudOpen: fraud.data.length,
        supportOpen: support.data.filter((t: any) => t.status === 'open').length,
        treasury: treasury.data,
        lastRecon: recon.data[0],
      });
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const stats = [
    { label: 'KYC pendientes', value: data.kycPending || 0, color: 'text-yellow-400', href: '/dashboard/kyc' },
    { label: 'Casos fraude abiertos', value: data.fraudOpen || 0, color: 'text-red-400', href: '/dashboard/fraud' },
    { label: 'Tickets soporte abiertos', value: data.supportOpen || 0, color: 'text-blue-400', href: '/dashboard/support' },
    { label: 'Fondos clientes', value: fmt(data.treasury?.totalClientFunds), color: 'text-green-400', href: '/dashboard/treasury' },
    { label: 'Total invertido', value: fmt(data.treasury?.totalInvested), color: 'text-purple-400', href: '/dashboard/investments' },
    { label: 'Buffer operativo', value: fmt(data.treasury?.operationalBuffer), color: 'text-teal-400', href: '/dashboard/treasury' },
  ];

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-2">Panel principal</h2>
      <p className="text-gray-500 text-sm mb-6">Resumen operativo en tiempo real</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </a>
        ))}
      </div>
      {data.lastRecon && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-2">Última conciliación</p>
          <div className="flex gap-8">
            <div><p className="text-white font-bold">{data.lastRecon.matchedItems}</p><p className="text-gray-500 text-xs">Matcheados</p></div>
            <div><p className="text-red-400 font-bold">{data.lastRecon.unmatchedItems}</p><p className="text-gray-500 text-xs">Sin match</p></div>
            <div><p className="text-white font-bold">{data.lastRecon.status}</p><p className="text-gray-500 text-xs">Estado</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
