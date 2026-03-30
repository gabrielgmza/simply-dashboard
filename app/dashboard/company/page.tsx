'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CompanyPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/company/accounts/summary').then(r => { setSummary(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

  const typeColor: Record<string, string> = {
    operational: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    bridge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    comitente: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    reserve: 'text-green-400 bg-green-400/10 border-green-400/20',
    tax: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  const totalBalance = summary?.accounts?.reduce((s: number, a: any) => s + Number(a.balance || 0), 0) || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Cuentas de la Empresa</h2>
          <p className="text-gray-500 text-sm mt-0.5">Posición financiera institucional</p>
        </div>
        <button onClick={load} className="text-gray-500 hover:text-white text-sm transition">↻ Actualizar</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/80 border border-emerald-900/30 rounded-xl p-5 col-span-1">
          <p className="text-gray-500 text-xs mb-1">Total en cuentas empresa</p>
          <p className="text-emerald-400 text-3xl font-bold">{fmt(totalBalance)}</p>
          <p className="text-gray-600 text-xs mt-1">{summary?.accounts?.length || 0} cuentas activas</p>
        </div>
        {(summary?.accounts || []).slice(0, 2).map((a: any, i: number) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-xs mb-1">{a.name}</p>
            <p className="text-white text-2xl font-bold">{fmt(a.balance)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border mt-2 inline-block ${typeColor[a.type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{a.type}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-gray-400 text-sm font-medium">Detalle de cuentas</p>
          <p className="text-gray-600 text-xs">{summary?.accounts?.length || 0} registros</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Cuenta', 'Banco / Entidad', 'Tipo', 'Última actualización', 'Saldo'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(summary?.accounts || []).map((a: any) => (
              <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{a.name}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{a.description || '—'}</p>
                </td>
                <td className="px-4 py-3 text-gray-400">{a.bank || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${typeColor[a.type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{a.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(a.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <p className="text-white font-bold">{fmt(a.balance)}</p>
                </td>
              </tr>
            ))}
            {!summary?.accounts?.length && <tr><td colSpan={5} className="text-center text-gray-700 py-8">Sin cuentas registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
