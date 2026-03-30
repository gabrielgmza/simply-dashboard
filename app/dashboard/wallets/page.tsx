'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get('/wallets').then(r => { setWallets(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtCompact = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`;

  const filtered = wallets
    .filter(w => filter === 'all' || w.status === filter)
    .filter(w => w.email?.toLowerCase().includes(search.toLowerCase()) || w.cvu?.includes(search) || w.alias?.toLowerCase().includes(search.toLowerCase()));

  const totalFunds = wallets.reduce((s, w) => s + Number(w.available || 0), 0);
  const totalPending = wallets.reduce((s, w) => s + Number(w.pending || 0), 0);
  const activeWallets = wallets.filter(w => w.status === 'active').length;
  const withBalance = wallets.filter(w => Number(w.available || 0) > 0).length;

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    blocked: 'text-red-400 bg-red-400/10 border-red-400/20',
    frozen: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Wallets</h2>
        <p className="text-gray-500 text-sm mt-0.5">Gestión de billeteras digitales</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total fondos clientes', value: fmtCompact(totalFunds), sub: fmt(totalFunds), color: 'text-emerald-400' },
          { label: 'En tránsito', value: fmtCompact(totalPending), sub: fmt(totalPending), color: 'text-yellow-400' },
          { label: 'Wallets activas', value: activeWallets, sub: `de ${wallets.length} totales`, color: 'text-blue-400' },
          { label: 'Con saldo > 0', value: withBalance, sub: `${wallets.length ? Math.round((withBalance/wallets.length)*100) : 0}% del total`, color: 'text-purple-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'active', 'blocked', 'frozen'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : f === 'blocked' ? 'Bloqueadas' : 'Frozen'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email, CVU, alias..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Email', 'CVU', 'Alias', 'Estado', 'Disponible', 'En tránsito', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.map(w => (
              <>
                <tr key={w.walletId}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.walletId === w.walletId ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.walletId === w.walletId ? null : w)}>
                  <td className="px-4 py-3 text-white">{w.email}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{w.cvu ? `${w.cvu.slice(0,8)}...` : '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{w.alias || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${statusColor[w.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(w.available)}</td>
                  <td className="px-4 py-3 text-yellow-400">{fmt(w.pending)}</td>
                  <td className="px-4 py-3 text-gray-600">{selected?.walletId === w.walletId ? '▲' : '▼'}</td>
                </tr>
                {selected?.walletId === w.walletId && (
                  <tr key={`${w.walletId}-detail`} className="border-b border-gray-800">
                    <td colSpan={7} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div><p className="text-gray-600">Wallet ID</p><p className="text-white font-mono mt-0.5">{w.walletId}</p></div>
                        <div><p className="text-gray-600">CVU completo</p><p className="text-white font-mono mt-0.5 text-xs">{w.cvu || '—'}</p></div>
                        <div><p className="text-gray-600">Alias completo</p><p className="text-white mt-0.5">{w.alias || '—'}</p></div>
                        <div><p className="text-gray-600">Moneda</p><p className="text-white mt-0.5">{w.currency || 'ARS'}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
