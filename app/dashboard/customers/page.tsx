'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  const selectUser = async (user: any) => {
    setSelected(user);
    setLoadingDetail(true);
    try {
      const r = await api.get(`/users/${user.id}/overview`);
      setOverview(r.data);
    } catch {}
    setLoadingDetail(false);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/users/${selected.id}/status`, { status });
      setSelected({ ...selected, status });
      setUsers(users.map(u => u.id === selected.id ? { ...u, status } : u));
    } catch {}
    setUpdatingStatus(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    pending_verification: 'text-yellow-400 bg-yellow-400/10',
    blocked: 'text-red-400 bg-red-400/10',
    frozen: 'text-blue-400 bg-blue-400/10',
    draft: 'text-gray-400 bg-gray-400/10',
    restricted: 'text-orange-400 bg-orange-400/10',
  };

  const kycColor: Record<string, string> = {
    approved: 'text-green-400', under_review: 'text-yellow-400',
    rejected: 'text-red-400', submitted: 'text-blue-400', not_started: 'text-gray-400',
  };

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search));

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="flex gap-4 h-full">
      {/* Lista usuarios */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <h2 className="text-white text-lg font-semibold">Customer 360</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email o teléfono..."
          className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        />
        <div className="space-y-1.5 overflow-y-auto">
          {filtered.map((u) => (
            <button key={u.id} onClick={() => selectUser(u)}
              className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition ${selected?.id === u.id ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white text-sm font-medium truncate">{u.email}</p>
              <p className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${statusColor[u.status] || 'text-gray-400 bg-gray-400/10'}`}>{u.status}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detalle */}
      {selected && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {loadingDetail ? (
            <p className="text-gray-400">Cargando perfil...</p>
          ) : overview && (
            <>
              {/* Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white text-lg font-semibold">
                      {overview.profile ? `${overview.profile.first_name} ${overview.profile.last_name}` : selected.email}
                    </h3>
                    <p className="text-gray-500 text-sm">{selected.email} · {selected.phone}</p>
                    {overview.accountLevel && (
                      <p className="text-blue-400 text-sm mt-1">★ {overview.accountLevel.name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[selected.status] || 'text-gray-400 bg-gray-400/10'}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['active', 'restricted', 'frozen', 'blocked'].map(s => (
                    <button key={s} onClick={() => updateStatus(s)} disabled={updatingStatus || selected.status === s}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* KYC + Wallet + Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">KYC</p>
                  <p className={`text-sm font-semibold ${kycColor[overview.kyc?.status] || 'text-gray-400'}`}>
                    {overview.kyc?.status || 'Sin iniciar'}
                  </p>
                  {overview.kyc?.renaper_score && (
                    <p className="text-gray-500 text-xs mt-1">Score RENAPER: {overview.kyc.renaper_score}%</p>
                  )}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Saldo wallet</p>
                  <p className="text-white text-sm font-semibold">{fmt(overview.wallet?.available)}</p>
                  {overview.wallet?.cvu && (
                    <p className="text-gray-600 text-xs mt-1 font-mono">{overview.wallet.cvu.slice(0, 10)}...</p>
                  )}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Alias CVU</p>
                  <p className="text-white text-sm font-semibold">{overview.wallet?.alias || '—'}</p>
                  <p className="text-gray-500 text-xs mt-1">{overview.wallet?.status}</p>
                </div>
              </div>

              {/* Perfil */}
              {overview.profile && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-500 text-xs font-medium mb-3">PERFIL</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500 text-xs">CUIL</p><p className="text-white">{overview.profile.cuil || '—'}</p></div>
                    <div><p className="text-gray-500 text-xs">Ciudad</p><p className="text-white">{overview.profile.city || '—'}</p></div>
                    <div><p className="text-gray-500 text-xs">Ocupación</p><p className="text-white">{overview.profile.occupation || '—'}</p></div>
                    <div><p className="text-gray-500 text-xs">Origen fondos</p><p className="text-white">{overview.profile.funds_origin || '—'}</p></div>
                  </div>
                </div>
              )}

              {/* AML Alerts */}
              {overview.amlAlerts?.length > 0 && (
                <div className="bg-gray-900 border border-orange-900/40 rounded-xl p-5">
                  <p className="text-orange-400 text-xs font-medium mb-3">ALERTAS AML ({overview.amlAlerts.length})</p>
                  <div className="space-y-2">
                    {overview.amlAlerts.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-white">{a.rule_name}</p>
                          <p className="text-gray-500 text-xs">{new Date(a.created_at).toLocaleString('es-AR')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${a.severity === 'critical' ? 'text-red-400' : a.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}`}>{a.severity}</p>
                          <p className="text-gray-500 text-xs">{fmt(a.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Cases */}
              {overview.fraudCases?.length > 0 && (
                <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
                  <p className="text-red-400 text-xs font-medium mb-3">CASOS DE FRAUDE ({overview.fraudCases.length})</p>
                  <div className="space-y-2">
                    {overview.fraudCases.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between text-sm">
                        <p className="text-white">{f.type.replace(/_/g, ' ')}</p>
                        <div className="text-right">
                          <p className={`text-xs ${f.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>{f.severity}</p>
                          <p className="text-gray-500 text-xs">{f.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selected && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Seleccioná un cliente para ver su perfil completo</p>
        </div>
      )}
    </div>
  );
}
