'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardHome() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
      const todayT = transfers.data.filter((t: any) => new Date(t.createdAt).toDateString() === today);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekT = transfers.data.filter((t: any) => new Date(t.createdAt) >= weekAgo);
      setData({
        kycPending: kyc.data.length,
        fraudOpen: fraud.data.length,
        supportOpen: support.data.filter((t: any) => t.status === 'open').length,
        treasury: treasury.data,
        recon: recon.data,
        aml: aml.data,
        totalUsers: users.data.length,
        activeUsers: users.data.filter((u: any) => u.status === 'active').length,
        pendingUsers: users.data.filter((u: any) => u.status === 'pending_verification').length,
        todayTransfers: todayT.length,
        todayVolume: todayT.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        weekVolume: weekT.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
        weekTransfers: weekT.length,
      });
      setLoading(false);
    });
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  const alerts = (data.kycPending || 0) + (data.fraudOpen || 0) + (data.aml?.criticalAlerts || 0);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-mono tracking-widest uppercase">Sistema operativo</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Panel de control</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <span className="font-mono">{time.toLocaleTimeString('es-AR')}</span>
          </p>
        </div>
        {alerts > 0 && (
          <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 rounded-xl px-4 py-3">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-300 text-sm font-medium">{alerts} alerta{alerts > 1 ? 's' : ''} requieren atención</span>
          </div>
        )}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Fondos bajo custodia',
            value: fmtCompact(data.treasury?.totalClientFunds || 0),
            sub: fmt(data.treasury?.totalClientFunds),
            color: 'text-emerald-400',
            bg: 'from-emerald-950/40 to-transparent',
            border: 'border-emerald-900/30',
            icon: '◈',
          },
          {
            label: 'Total invertido',
            value: fmtCompact(data.treasury?.totalInvested || 0),
            sub: 'FCI + instrumentos',
            color: 'text-violet-400',
            bg: 'from-violet-950/40 to-transparent',
            border: 'border-violet-900/30',
            icon: '◆',
          },
          {
            label: 'Volumen hoy',
            value: fmtCompact(data.todayVolume || 0),
            sub: `${data.todayTransfers} transferencias`,
            color: 'text-blue-400',
            bg: 'from-blue-950/40 to-transparent',
            border: 'border-blue-900/30',
            icon: '⬡',
          },
          {
            label: 'Buffer operativo',
            value: fmtCompact(data.treasury?.operationalBuffer || 0),
            sub: '10% fondos clientes',
            color: 'text-cyan-400',
            bg: 'from-cyan-950/40 to-transparent',
            border: 'border-cyan-900/30',
            icon: '⬟',
          },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-b ${kpi.bg} bg-gray-900/80 border ${kpi.border} rounded-2xl p-5 relative overflow-hidden`}>
            <div className="absolute top-3 right-4 text-2xl opacity-10">{kpi.icon}</div>
            <p className="text-gray-400 text-xs font-medium mb-3">{kpi.label}</p>
            <p className={`${kpi.color} text-3xl font-bold tracking-tight`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-2">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Fila central */}
      <div className="grid grid-cols-3 gap-3">

        {/* Usuarios */}
        <Link href="/dashboard/users" className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all hover:bg-gray-900 group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Usuarios</p>
            <span className="text-gray-600 group-hover:text-gray-400 transition text-xs">→</span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-white text-4xl font-bold">{data.totalUsers}</p>
              <p className="text-gray-600 text-xs mt-1">total registrados</p>
            </div>
            <div className="flex flex-col gap-1 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-green-400 text-xs">{data.activeUsers} activos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400 text-xs">{data.pendingUsers} pendientes</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${data.totalUsers ? (data.activeUsers / data.totalUsers) * 100 : 0}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">
            {data.totalUsers ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0}% tasa de activación
          </p>
        </Link>

        {/* Volumen semanal */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">Volumen 7 días</p>
          <p className="text-blue-400 text-4xl font-bold">{fmtCompact(data.weekVolume || 0)}</p>
          <p className="text-gray-600 text-xs mt-1">{data.weekTransfers} operaciones</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Promedio diario</p>
              <p className="text-white text-sm font-semibold mt-1">{fmtCompact((data.weekVolume || 0) / 7)}</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Por operación</p>
              <p className="text-white text-sm font-semibold mt-1">{fmtCompact(data.weekTransfers ? (data.weekVolume || 0) / data.weekTransfers : 0)}</p>
            </div>
          </div>
        </div>

        {/* Conciliación */}
        <Link href="/dashboard/reconciliation" className={`bg-gray-900/80 border rounded-2xl p-5 hover:bg-gray-900 transition-all group ${data.recon?.unmatched > 0 ? 'border-orange-900/50' : 'border-gray-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Conciliación</p>
            {data.recon?.unmatched > 0
              ? <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">REVISAR</span>
              : <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">OK</span>
            }
          </div>
          <p className={`text-2xl font-bold ${data.recon?.status === 'closed' ? 'text-green-400' : 'text-yellow-400'}`}>
            {data.recon?.status === 'closed' ? 'Cerrada' : data.recon?.status || 'Sin datos'}
          </p>
          <p className="text-gray-600 text-xs mt-1">Última ejecución</p>
          <div className="mt-4 flex gap-4">
            <div>
              <p className="text-green-400 text-xl font-bold">{data.recon?.matched || 0}</p>
              <p className="text-gray-600 text-xs">coincidencias</p>
            </div>
            <div>
              <p className={`text-xl font-bold ${data.recon?.unmatched > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{data.recon?.unmatched || 0}</p>
              <p className="text-gray-600 text-xs">discrepancias</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Alertas operativas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'KYC pendientes', value: data.kycPending, href: '/dashboard/kyc', warn: data.kycPending > 0, color: 'yellow', sub: 'Requieren revisión' },
          { label: 'Fraude abierto', value: data.fraudOpen, href: '/dashboard/fraud', warn: data.fraudOpen > 0, color: 'red', sub: 'Casos activos' },
          { label: 'Alertas AML', value: data.aml?.openAlerts || 0, href: '/dashboard/aml', warn: (data.aml?.openAlerts || 0) > 0, color: 'orange', sub: `${data.aml?.criticalAlerts || 0} críticas` },
          { label: 'Soporte', value: data.supportOpen, href: '/dashboard/support', warn: data.supportOpen > 5, color: 'blue', sub: 'Tickets abiertos' },
        ].map((item, i) => {
          const colors: any = {
            yellow: { text: 'text-yellow-400', border: 'border-yellow-900/40', bg: 'bg-yellow-500/10' },
            red: { text: 'text-red-400', border: 'border-red-900/40', bg: 'bg-red-500/10' },
            orange: { text: 'text-orange-400', border: 'border-orange-900/40', bg: 'bg-orange-500/10' },
            blue: { text: 'text-blue-400', border: 'border-blue-900/40', bg: 'bg-blue-500/10' },
          };
          const c = colors[item.color];
          return (
            <Link key={i} href={item.href}
              className={`bg-gray-900/80 border rounded-2xl p-5 hover:bg-gray-900 transition-all group ${item.warn ? c.border : 'border-gray-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-xs font-medium">{item.label}</p>
                <span className="text-gray-600 group-hover:text-gray-400 transition text-xs">→</span>
              </div>
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${item.warn ? c.bg : 'bg-gray-800'} mb-3`}>
                <span className={`text-2xl font-bold ${item.warn ? c.text : 'text-gray-500'}`}>{item.value}</span>
              </div>
              <p className="text-gray-600 text-xs">{item.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-4">Acciones rápidas</p>
        <div className="grid grid-cols-6 gap-2">
          {[
            { label: 'Conciliar ahora', href: '/dashboard/reconciliation', color: 'bg-blue-600 hover:bg-blue-500' },
            { label: 'Alertas AML', href: '/dashboard/aml', color: 'bg-orange-600 hover:bg-orange-500' },
            { label: 'KYC pendientes', href: '/dashboard/kyc', color: 'bg-yellow-600 hover:bg-yellow-500' },
            { label: 'Niveles de cuenta', href: '/dashboard/account-levels', color: 'bg-purple-600 hover:bg-purple-500' },
            { label: 'Reporte UIF', href: '/dashboard/compliance', color: 'bg-teal-600 hover:bg-teal-500' },
            { label: 'Customer 360', href: '/dashboard/customers', color: 'bg-pink-600 hover:bg-pink-500' },
          ].map((a, i) => (
            <Link key={i} href={a.href}
              className={`${a.color} text-white text-xs font-medium px-3 py-3 rounded-xl transition-all text-center leading-tight`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
