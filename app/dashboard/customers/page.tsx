'use client';
import { useRequirePin } from '@/lib/security';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const TABS = ['Resumen', 'Financiero', 'Transferencias', 'Inversiones', 'Préstamos', 'KYC & Docs', 'Cumplimiento', 'Actividad'];

export default function CustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Resumen');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const requirePin = useRequirePin();

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  const selectUser = async (user: any) => {
    setSelected(user);
    setTab('Resumen');
    setLoadingDetail(true);
    try {
      const r = await api.get(`/users/${user.id}/overview`);
      setOverview(r.data);
    } catch {}
    setLoadingDetail(false);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    if (['blocked', 'frozen', 'restricted'].includes(status)) {
      const ok = await requirePin(`Cambiar estado del cliente a "${status}"`);
      if (!ok) return;
    }
    setUpdatingStatus(true);
    try {
      await api.put(`/users/${selected.id}/status`, { status });
      setSelected({ ...selected, status });
      setUsers(users.map(u => u.id === selected.id ? { ...u, status } : u));
    } catch {}
    setUpdatingStatus(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    pending_verification: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    blocked: 'text-red-400 bg-red-400/10 border-red-400/20',
    frozen: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    restricted: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">

      {/* Sidebar lista */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-base font-semibold">Clientes</h2>
          <span className="text-gray-600 text-xs">{filtered.length}</span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar email, teléfono..."
          className="bg-gray-900 border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full"
        />
        <div className="space-y-1 overflow-y-auto flex-1">
          {filtered.map(u => (
            <button key={u.id} onClick={() => selectUser(u)}
              className={`w-full text-left rounded-xl p-3 transition-all border ${selected?.id === u.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white text-xs font-medium truncate">{u.email}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full border ${statusColor[u.status] || 'text-gray-400 bg-gray-400/10'}`}>{u.status?.replace('_', ' ')}</span>
                <span className="text-gray-600 text-xs">{u.phone?.slice(-4) || ''}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel legajo */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">◈</div>
            <p className="text-gray-600 text-sm">Seleccioná un cliente para ver su legajo completo</p>
          </div>
        </div>
      ) : loadingDetail ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
        </div>
      ) : overview && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">

          {/* Header cliente */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg font-bold">
                  {overview.profile?.first_name?.[0] || selected.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">
                    {overview.profile ? `${overview.profile.first_name} ${overview.profile.last_name}` : selected.email}
                  </h3>
                  <p className="text-gray-500 text-sm">{selected.email} · {selected.phone || 'Sin teléfono'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[selected.status] || ''}`}>{selected.status?.replace('_', ' ')}</span>
                    {overview.accountLevel && <span className="text-blue-400 text-xs">★ {overview.accountLevel.name}</span>}
                    {overview.scoring && <span className={`text-xs px-2 py-0.5 rounded-full ${overview.scoring.risk_level === 'low' ? 'text-green-400 bg-green-400/10' : overview.scoring.risk_level === 'high' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>Riesgo {overview.scoring.risk_level || '—'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['active', 'restricted', 'frozen', 'blocked'].map(s => (
                  <button key={s} onClick={() => updateStatus(s)} disabled={updatingStatus || selected.status === s}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 flex-shrink-0 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-xs py-2 rounded-lg transition-all font-medium ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Contenido tabs */}
          <div className="flex-1 overflow-y-auto space-y-3">

            {/* RESUMEN */}
            {tab === 'Resumen' && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Saldo disponible', value: fmt(overview.wallet?.available), color: 'text-emerald-400' },
                    { label: 'En tránsito', value: fmt(overview.wallet?.pending), color: 'text-yellow-400' },
                    { label: 'Total invertido', value: fmt(overview.investments?.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)), color: 'text-violet-400' },
                    { label: 'Cuotas pendientes', value: overview.installments?.filter((i: any) => i.status === 'pending').length || 0, color: 'text-blue-400' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
                      <p className={`${kpi.color} text-xl font-bold`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                    <p className="text-gray-500 text-xs font-medium mb-3">DATOS PERSONALES</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'CUIL', value: overview.profile?.cuil },
                        { label: 'Ciudad', value: overview.profile?.city },
                        { label: 'Ocupación', value: overview.profile?.occupation },
                        { label: 'Origen fondos', value: overview.profile?.funds_origin },
                        { label: 'CVU', value: overview.wallet?.cvu },
                        { label: 'Alias', value: overview.wallet?.alias },
                      ].map((f, i) => (
                        <div key={i}>
                          <p className="text-gray-600 text-xs">{f.label}</p>
                          <p className="text-white text-xs font-medium mt-0.5 truncate">{f.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                    <p className="text-gray-500 text-xs font-medium mb-3">ESTADO GENERAL</p>
                    <div className="space-y-2">
                      {[
                        { label: 'KYC', value: overview.kyc?.status || 'Sin iniciar', color: overview.kyc?.status === 'approved' ? 'text-green-400' : 'text-yellow-400' },
                        { label: 'Score RENAPER', value: overview.kyc?.renaper_score ? `${overview.kyc.renaper_score}%` : '—', color: 'text-blue-400' },
                        { label: 'Nivel de cuenta', value: overview.accountLevel?.name || '—', color: 'text-purple-400' },
                        { label: 'Score riesgo', value: overview.scoring?.score || '—', color: 'text-cyan-400' },
                        { label: 'Alertas AML', value: overview.amlAlerts?.length || 0, color: overview.amlAlerts?.length > 0 ? 'text-orange-400' : 'text-green-400' },
                        { label: 'Casos fraude', value: overview.fraudCases?.length || 0, color: overview.fraudCases?.length > 0 ? 'text-red-400' : 'text-green-400' },
                      ].map((f, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">{f.label}</span>
                          <span className={`font-semibold ${f.color}`}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FINANCIERO */}
            {tab === 'Financiero' && (
              <>
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">WALLET</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-gray-600 text-xs">CVU</p><p className="text-white text-xs font-mono mt-0.5">{overview.wallet?.cvu || '—'}</p></div>
                    <div><p className="text-gray-600 text-xs">Alias</p><p className="text-white text-sm font-semibold mt-0.5">{overview.wallet?.alias || '—'}</p></div>
                    <div><p className="text-gray-600 text-xs">Estado wallet</p><p className="text-white text-sm mt-0.5">{overview.wallet?.status || '—'}</p></div>
                    <div><p className="text-gray-600 text-xs">Disponible</p><p className="text-emerald-400 text-lg font-bold mt-0.5">{fmt(overview.wallet?.available)}</p></div>
                    <div><p className="text-gray-600 text-xs">En tránsito</p><p className="text-yellow-400 text-lg font-bold mt-0.5">{fmt(overview.wallet?.pending)}</p></div>
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">ÚLTIMOS MOVIMIENTOS LEDGER</p>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-800">
                      <th className="text-left text-gray-600 pb-2">Fecha</th>
                      <th className="text-left text-gray-600 pb-2">Tipo</th>
                      <th className="text-left text-gray-600 pb-2">Descripción</th>
                      <th className="text-right text-gray-600 pb-2">Monto</th>
                    </tr></thead>
                    <tbody>
                      {(overview.ledger || []).map((l: any) => (
                        <tr key={l.id} className="border-b border-gray-800/50">
                          <td className="py-2 text-gray-500">{fmtDate(l.created_at)}</td>
                          <td className="py-2"><span className={`px-1.5 py-0.5 rounded text-xs ${l.type?.includes('in') || l.type === 'fee_refund' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>{l.type}</span></td>
                          <td className="py-2 text-gray-400 truncate max-w-xs">{l.description || '—'}</td>
                          <td className={`py-2 text-right font-semibold ${l.type?.includes('in') ? 'text-green-400' : 'text-red-400'}`}>{fmt(l.amount)}</td>
                        </tr>
                      ))}
                      {!overview.ledger?.length && <tr><td colSpan={4} className="text-center text-gray-700 py-4">Sin movimientos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* TRANSFERENCIAS */}
            {tab === 'Transferencias' && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium mb-3">HISTORIAL DE TRANSFERENCIAS</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-800">
                    <th className="text-left text-gray-600 pb-2">Fecha</th>
                    <th className="text-left text-gray-600 pb-2">Desde</th>
                    <th className="text-left text-gray-600 pb-2">Hacia</th>
                    <th className="text-left text-gray-600 pb-2">Descripción</th>
                    <th className="text-left text-gray-600 pb-2">Estado</th>
                    <th className="text-right text-gray-600 pb-2">Monto</th>
                  </tr></thead>
                  <tbody>
                    {(overview.transfers || []).map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-800/50">
                        <td className="py-2 text-gray-500">{fmtDate(t.created_at)}</td>
                        <td className="py-2 text-gray-400 font-mono">{t.from_wallet_id?.slice(0, 8)}...</td>
                        <td className="py-2 text-gray-400 font-mono">{t.to_wallet_id?.slice(0, 8)}...</td>
                        <td className="py-2 text-gray-400">{t.description || '—'}</td>
                        <td className="py-2"><span className={`px-1.5 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{t.status}</span></td>
                        <td className="py-2 text-right text-white font-semibold">{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    {!overview.transfers?.length && <tr><td colSpan={6} className="text-center text-gray-700 py-4">Sin transferencias</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* INVERSIONES */}
            {tab === 'Inversiones' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">POSICIONES ACTUALES</p>
                  {(overview.investments || []).length === 0 ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sin inversiones activas</p>
                  ) : (
                    <div className="space-y-2">
                      {(overview.investments || []).map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3">
                          <div>
                            <p className="text-white text-xs font-semibold">{inv.instrument_name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{inv.instrument_type} · {inv.units} unidades</p>
                          </div>
                          <div className="text-right">
                            <p className="text-violet-400 text-sm font-bold">{fmt(inv.amount)}</p>
                            <p className="text-gray-600 text-xs">{fmtDate(inv.updated_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRÉSTAMOS */}
            {tab === 'Préstamos' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">PRÉSTAMOS</p>
                  {(overview.loans || []).length === 0 ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sin préstamos registrados</p>
                  ) : (overview.loans || []).map((l: any) => (
                    <div key={l.id} className="bg-gray-800/60 rounded-xl p-3 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white text-xs font-semibold">{fmt(l.amount)}</p>
                          <p className="text-gray-500 text-xs">{l.term_months} meses · TNA {l.interest_rate}%</p>
                          <p className="text-gray-600 text-xs">{fmtDate(l.created_at)}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{l.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">CUOTAS</p>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-800">
                      <th className="text-left text-gray-600 pb-2">Vencimiento</th>
                      <th className="text-left text-gray-600 pb-2">Estado</th>
                      <th className="text-left text-gray-600 pb-2">Pagado</th>
                      <th className="text-right text-gray-600 pb-2">Monto</th>
                    </tr></thead>
                    <tbody>
                      {(overview.installments || []).map((i: any) => (
                        <tr key={i.id} className="border-b border-gray-800/50">
                          <td className="py-2 text-gray-400">{fmtDate(i.due_date)}</td>
                          <td className="py-2"><span className={`px-1.5 py-0.5 rounded ${i.status === 'paid' ? 'bg-green-900/40 text-green-400' : i.status === 'overdue' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{i.status}</span></td>
                          <td className="py-2 text-gray-500">{fmtDate(i.paid_at)}</td>
                          <td className="py-2 text-right text-white">{fmt(i.amount)}</td>
                        </tr>
                      ))}
                      {!overview.installments?.length && <tr><td colSpan={4} className="text-center text-gray-700 py-4">Sin cuotas</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KYC & DOCS */}
            {tab === 'KYC & Docs' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">KYC</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Estado', value: overview.kyc?.status || 'Sin iniciar' },
                      { label: 'Score RENAPER', value: overview.kyc?.renaper_score ? `${overview.kyc.renaper_score}%` : '—' },
                      { label: 'Enviado', value: fmtDate(overview.kyc?.submitted_at) },
                      { label: 'Revisado', value: fmtDate(overview.kyc?.reviewed_at) },
                      { label: 'Notas revisor', value: overview.kyc?.reviewer_notes || '—' },
                    ].map((f, i) => (
                      <div key={i}>
                        <p className="text-gray-600 text-xs">{f.label}</p>
                        <p className="text-white text-xs font-medium mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">DOCUMENTOS</p>
                  {(overview.documents || []).length === 0 ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sin documentos cargados</p>
                  ) : (
                    <div className="space-y-2">
                      {(overview.documents || []).map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3">
                          <div>
                            <p className="text-white text-xs font-medium">{d.file_name || d.type}</p>
                            <p className="text-gray-500 text-xs">{d.type} · {fmtDate(d.created_at)}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'approved' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CUMPLIMIENTO */}
            {tab === 'Cumplimiento' && (
              <div className="space-y-3">
                {overview.amlAlerts?.length > 0 && (
                  <div className="bg-gray-900/80 border border-orange-900/40 rounded-xl p-4">
                    <p className="text-orange-400 text-xs font-medium mb-3">ALERTAS AML ({overview.amlAlerts.length})</p>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-orange-900/30">
                        <th className="text-left text-gray-600 pb-2">Fecha</th>
                        <th className="text-left text-gray-600 pb-2">Regla</th>
                        <th className="text-left text-gray-600 pb-2">Severidad</th>
                        <th className="text-left text-gray-600 pb-2">Estado</th>
                        <th className="text-right text-gray-600 pb-2">Monto</th>
                      </tr></thead>
                      <tbody>
                        {overview.amlAlerts.map((a: any) => (
                          <tr key={a.id} className="border-b border-gray-800/50">
                            <td className="py-2 text-gray-500">{fmtDate(a.created_at)}</td>
                            <td className="py-2 text-white">{a.rule_name}</td>
                            <td className="py-2"><span className={`px-1.5 py-0.5 rounded ${a.severity === 'critical' ? 'bg-red-900/40 text-red-400' : a.severity === 'high' ? 'bg-orange-900/40 text-orange-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{a.severity}</span></td>
                            <td className="py-2 text-gray-400">{a.status}</td>
                            <td className="py-2 text-right text-white">{fmt(a.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {overview.fraudCases?.length > 0 && (
                  <div className="bg-gray-900/80 border border-red-900/40 rounded-xl p-4">
                    <p className="text-red-400 text-xs font-medium mb-3">CASOS DE FRAUDE ({overview.fraudCases.length})</p>
                    <div className="space-y-2">
                      {overview.fraudCases.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3">
                          <div>
                            <p className="text-white text-xs font-semibold">{f.type?.replace(/_/g, ' ')}</p>
                            <p className="text-gray-500 text-xs">{f.description || '—'} · {fmtDate(f.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${f.severity === 'high' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{f.severity}</span>
                            <p className="text-gray-500 text-xs mt-0.5">{f.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!overview.amlAlerts?.length && !overview.fraudCases?.length && (
                  <div className="bg-gray-900/80 border border-green-900/30 rounded-xl p-8 text-center">
                    <div className="text-green-400 text-4xl mb-2">✓</div>
                    <p className="text-green-400 text-sm font-medium">Sin alertas de cumplimiento</p>
                    <p className="text-gray-600 text-xs mt-1">Cliente sin observaciones AML ni fraude</p>
                  </div>
                )}

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">SCORING</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-gray-600 text-xs">Score</p><p className="text-cyan-400 text-2xl font-bold">{overview.scoring?.score || '—'}</p></div>
                    <div><p className="text-gray-600 text-xs">Nivel de riesgo</p><p className={`text-sm font-semibold mt-1 ${overview.scoring?.risk_level === 'low' ? 'text-green-400' : overview.scoring?.risk_level === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>{overview.scoring?.risk_level || '—'}</p></div>
                    <div><p className="text-gray-600 text-xs">Actualizado</p><p className="text-gray-400 text-xs mt-1">{fmtDate(overview.scoring?.updated_at)}</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVIDAD */}
            {tab === 'Actividad' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">NOTIFICACIONES ENVIADAS</p>
                  <div className="space-y-2">
                    {(overview.notifications || []).map((n: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-gray-800/50 pb-2">
                        <div>
                          <p className="text-white">{n.event?.replace(/_/g, ' ')}</p>
                          <p className="text-gray-600">{n.channel} · {fmtDate(n.created_at)}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded ${n.status === 'sent' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>{n.status}</span>
                      </div>
                    ))}
                    {!overview.notifications?.length && <p className="text-gray-700 text-xs text-center py-4">Sin notificaciones registradas</p>}
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">AUDIT TRAIL</p>
                  <div className="space-y-2">
                    {(overview.auditLog || []).map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-gray-800/50 pb-2">
                        <div>
                          <p className="text-white">{a.action?.replace(/_/g, ' ')}</p>
                          <p className="text-gray-600">{a.resource_type} · {a.employee_email || 'sistema'}</p>
                        </div>
                        <p className="text-gray-500">{fmtDate(a.created_at)}</p>
                      </div>
                    ))}
                    {!overview.auditLog?.length && <p className="text-gray-700 text-xs text-center py-4">Sin registros de auditoría</p>}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
