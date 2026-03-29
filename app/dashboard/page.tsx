'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardHome() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/kyc/pending').catch(() => ({ data: [] })),
      api.get('/fraud/cases/open').catch(() => ({ data: [] })),
      api.get('/support/tickets').catch(() => ({ data: [] })),
      api.get('/treasury/current').catch(() => ({ data: {} })),
      api.get('/reconciliation/summary').catch(() => ({ data: {} })),
      api.get('/aml/summary').catch(() => ({ data: {} })),
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/transfers/all').catch(() => ({ data: [] })),
    ]).then(([kyc, fraud, support, treasury, recon, aml, users, transfers]) => {
      const today = new Date().toDateString();
      const todayTransfers = transfers.data.filter((t: any) => new Date(t.createdAt).toDateString() === today);
      setData({
        kycPending: kyc.data.length,
        fraudOpen: fraud.data.length,
        supportOpen: support.data.filter((t: any) => t.status === 'open').length,
        treasury: treasury.data,
        recon: recon.data,
        aml: aml.data,
        totalUsers: users.data.length,
        activeUsers: users.data.filter((u: any) => u.status === 'active').length,
        todayTransfers: todayTransfers.length,
        todayVolume: todayTransfers.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
      });
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) return <p className="text-gray-400">Cargando panel...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-semibold">Panel principal</h2>
        <p className="text-gray-500 text-sm mt-1">Resumen operativo en tiempo real</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Fondos clientes</p>
          <p className="text-green-400 text-2xl font-bold mt-1">{fmt(data.treasury?.totalClientFunds)}</p>
          <p className="text-gray-600 text-xs mt-1">Total bajo custodia</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total invertido</p>
          <p className="text-purple-400 text-2xl font-bold mt-1">{fmt(data.treasury?.totalInvested)}</p>
          <p className="text-gray-600 text-xs mt-1">FCI + instrumentos</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Volumen hoy</p>
          <p className="text-blue-400 text-2xl font-bold mt-1">{fmt(data.todayVolume)}</p>
          <p className="text-gray-600 text-xs mt-1">{data.todayTransfers} transferencias</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Buffer operativo</p>
          <p className="text-teal-400 text-2xl font-bold mt-1">{fmt(data.treasury?.operationalBuffer)}</p>
          <p className="text-gray-600 text-xs mt-1">10% fondos clientes</p>
        </div>
      </div>

      {/* Usuarios y alertas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/dashboard/users" className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
            <p className="text-gray-400 text-sm">Total usuarios</p>
            <p className="text-white text-2xl font-bold mt-1">{data.totalUsers}</p>
            <p className="text-green-400 text-xs mt-1">{data.activeUsers} activos</p>
          </Link>
          <Link href="/dashboard/kyc" className="bg-gray-900 border border-yellow-900/30 rounded-xl p-5 hover:border-yellow-800/50 transition">
            <p className="text-gray-400 text-sm">KYC pendientes</p>
            <p className="text-yellow-400 text-2xl font-bold mt-1">{data.kycPending}</p>
            <p className="text-gray-600 text-xs mt-1">Requieren revisión</p>
          </Link>
          <Link href="/dashboard/fraud" className="bg-gray-900 border border-red-900/30 rounded-xl p-5 hover:border-red-800/50 transition">
            <p className="text-gray-400 text-sm">Casos fraude</p>
            <p className="text-red-400 text-2xl font-bold mt-1">{data.fraudOpen}</p>
            <p className="text-gray-600 text-xs mt-1">Abiertos</p>
          </Link>
          <Link href="/dashboard/support" className="bg-gray-900 border border-blue-900/30 rounded-xl p-5 hover:border-blue-800/50 transition">
            <p className="text-gray-400 text-sm">Soporte</p>
            <p className="text-blue-400 text-2xl font-bold mt-1">{data.supportOpen}</p>
            <p className="text-gray-600 text-xs mt-1">Tickets abiertos</p>
          </Link>
        </div>

        <div className="space-y-4">
          {/* AML */}
          <Link href="/dashboard/aml" className={`block bg-gray-900 border rounded-xl p-5 hover:border-gray-700 transition ${data.aml?.criticalAlerts > 0 ? 'border-red-900/40' : 'border-gray-800'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">AML — Alertas</p>
                <p className={`text-2xl font-bold mt-1 ${data.aml?.openAlerts > 0 ? 'text-orange-400' : 'text-green-400'}`}>{data.aml?.openAlerts || 0}</p>
                <p className="text-gray-600 text-xs mt-1">abiertas · {data.aml?.criticalAlerts || 0} críticas</p>
              </div>
              {data.aml?.criticalAlerts > 0 && <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-full border border-red-600/30">CRÍTICO</span>}
            </div>
          </Link>

          {/* Conciliación */}
          <Link href="/dashboard/reconciliation" className={`block bg-gray-900 border rounded-xl p-5 hover:border-gray-700 transition ${data.recon?.unmatched > 0 ? 'border-orange-900/40' : 'border-gray-800'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Última conciliación</p>
                <p className={`text-sm font-semibold mt-1 ${data.recon?.status === 'closed' ? 'text-green-400' : 'text-yellow-400'}`}>{data.recon?.status || 'Sin datos'}</p>
                <p className="text-gray-600 text-xs mt-1">{data.recon?.matched || 0} OK · {data.recon?.unmatched || 0} discrepancias</p>
              </div>
              {data.recon?.unmatched > 0 && <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-full">REVISAR</span>}
            </div>
          </Link>

          {/* Accesos rápidos */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-3 font-medium">ACCIONES RÁPIDAS</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Ejecutar conciliación', href: '/dashboard/reconciliation', color: 'bg-blue-600 hover:bg-blue-700' },
                { label: 'Ver alertas AML', href: '/dashboard/aml', color: 'bg-orange-600 hover:bg-orange-700' },
                { label: 'Niveles de cuenta', href: '/dashboard/account-levels', color: 'bg-purple-600 hover:bg-purple-700' },
                { label: 'Generar reporte UIF', href: '/dashboard/compliance', color: 'bg-teal-600 hover:bg-teal-700' },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className={`${a.color} text-white text-xs px-3 py-2 rounded-lg transition text-center`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
