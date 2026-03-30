'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CrmPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('resumen');

  useEffect(() => {
    api.get('/crm/customers').then(r => { setCustomers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const select = async (c: any) => {
    setSelected(c);
    setTab('resumen');
    setLoadingDetail(true);
    const r = await api.get(`/crm/customers/${c.user.id}/360`).catch(() => ({ data: null }));
    setDetail(r.data);
    setLoadingDetail(false);
  };

  const addNote = async () => {
    if (!note.trim() || !selected) return;
    setAddingNote(true);
    await api.post(`/crm/customers/${selected.user.id}/notes`, { content: note, type: noteType }).catch(() => {});
    setNote('');
    const r = await api.get(`/crm/customers/${selected.user.id}/360`).catch(() => ({ data: null }));
    setDetail(r.data);
    setAddingNote(false);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const riskColor: Record<string, string> = {
    low: 'text-green-400', medium: 'text-yellow-400',
    high: 'text-orange-400', blocked: 'text-red-400', unscored: 'text-gray-400',
  };

  const NOTE_TYPES = ['general', 'comercial', 'compliance', 'soporte', 'seguimiento'];

  const filtered = customers.filter(c =>
    c.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.profile?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.profile?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">

      {/* Sidebar clientes */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-base font-bold">CRM Bancario</h2>
          <span className="text-gray-600 text-xs">{filtered.length}</span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="bg-gray-900 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500" />
        <div className="space-y-1 overflow-y-auto flex-1">
          {filtered.map(c => (
            <button key={c.user.id} onClick={() => select(c)}
              className={`w-full text-left rounded-xl p-3 transition-all border ${selected?.user.id === c.user.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white text-xs font-medium truncate">
                {c.profile?.firstName ? `${c.profile.firstName} ${c.profile.lastName}` : c.user.email}
              </p>
              <p className="text-gray-500 text-xs truncate">{c.user.email}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-emerald-400 text-xs">{fmt(c.balance?.available)}</span>
                {c.score && <span className={`text-xs ${riskColor[c.score.riskLevel] || 'text-gray-500'}`}>{c.score.riskLevel}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel detalle */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">◎</div>
            <p className="text-gray-600 text-sm">Seleccioná un cliente para ver su CRM</p>
          </div>
        </div>
      ) : loadingDetail ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
        </div>
      ) : detail && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
              {detail.profile?.firstName?.[0] || selected.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">
                {detail.profile ? `${detail.profile.firstName} ${detail.profile.lastName}` : selected.user.email}
              </h3>
              <p className="text-gray-500 text-xs">{selected.user.email}</p>
            </div>
            <div className="flex gap-3 text-right">
              <div><p className="text-gray-600 text-xs">Saldo</p><p className="text-emerald-400 font-bold text-sm">{fmt(detail.wallet?.balance?.available)}</p></div>
              <div><p className="text-gray-600 text-xs">Invertido</p><p className="text-violet-400 font-bold text-sm">{fmt(detail.investments?.reduce((s: number, i: any) => s + Number(i.amount || 0), 0))}</p></div>
              <div><p className="text-gray-600 text-xs">Score</p><p className={`font-bold text-sm ${riskColor[detail.score?.riskLevel] || 'text-gray-400'}`}>{detail.score?.totalScore || '—'}</p></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-shrink-0">
            {['resumen', 'perfil', 'préstamos', 'notas', 'interacciones'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-xs py-2 rounded-lg transition font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">

            {tab === 'resumen' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">DATOS FINANCIEROS</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Saldo disponible', value: fmt(detail.wallet?.balance?.available), color: 'text-emerald-400' },
                      { label: 'En tránsito', value: fmt(detail.wallet?.balance?.pending), color: 'text-yellow-400' },
                      { label: 'Total invertido', value: fmt(detail.investments?.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)), color: 'text-violet-400' },
                      { label: 'Préstamos activos', value: detail.loans?.filter((l: any) => l.status === 'active').length || 0, color: 'text-blue-400' },
                    ].map((f, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{f.label}</span>
                        <span className={`font-semibold ${f.color}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">ESTADO COMPLIANCE</p>
                  <div className="space-y-2">
                    {[
                      { label: 'KYC', value: detail.kyc?.status || '—', color: detail.kyc?.status === 'approved' ? 'text-green-400' : 'text-yellow-400' },
                      { label: 'Score RENAPER', value: detail.kyc?.renaperScore ? `${detail.kyc.renaperScore}%` : '—', color: 'text-blue-400' },
                      { label: 'Nivel de riesgo', value: detail.score?.riskLevel || '—', color: riskColor[detail.score?.riskLevel] || 'text-gray-400' },
                      { label: 'Alertas AML', value: detail.amlAlerts?.length || 0, color: detail.amlAlerts?.length > 0 ? 'text-orange-400' : 'text-green-400' },
                    ].map((f, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{f.label}</span>
                        <span className={`font-semibold ${f.color}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'perfil' && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium mb-3">DATOS DEL CLIENTE</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'CUIL', value: detail.profile?.cuil },
                    { label: 'Ciudad', value: detail.profile?.city },
                    { label: 'Ocupación', value: detail.profile?.occupation },
                    { label: 'Origen de fondos', value: detail.profile?.fundsOrigin },
                    { label: 'CVU', value: detail.wallet?.cvu },
                    { label: 'Alias', value: detail.wallet?.alias },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-gray-600">{f.label}</p>
                      <p className="text-white font-medium mt-0.5">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'préstamos' && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium mb-3">PRÉSTAMOS</p>
                {!detail.loans?.length ? (
                  <p className="text-gray-700 text-xs text-center py-4">Sin préstamos</p>
                ) : detail.loans.map((l: any) => (
                  <div key={l.id} className="bg-gray-800/60 rounded-xl p-3 mb-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-white font-semibold">{l.type?.toUpperCase()} — {fmt(l.amount)}</p>
                      <p className="text-gray-500">{l.installments} cuotas · TNA {l.interestRate}%</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'notas' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">AGREGAR NOTA</p>
                  <div className="flex gap-2 mb-2">
                    {NOTE_TYPES.map(t => (
                      <button key={t} onClick={() => setNoteType(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${noteType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Escribí una nota interna..."
                      className="flex-1 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500" />
                    <button onClick={addNote} disabled={addingNote || !note.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-xl transition">
                      {addingNote ? '...' : 'Agregar'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-3">HISTORIAL DE NOTAS</p>
                  {!detail.notes?.length ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sin notas registradas</p>
                  ) : detail.notes.map((n: any) => (
                    <div key={n.id} className="bg-gray-800/60 rounded-xl p-3 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-400 text-xs">{n.type}</span>
                        <span className="text-gray-600 text-xs">{fmtDate(n.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 text-xs">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'interacciones' && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium mb-3">HISTORIAL DE INTERACCIONES</p>
                {!detail.interactions?.length ? (
                  <p className="text-gray-700 text-xs text-center py-4">Sin interacciones registradas</p>
                ) : detail.interactions.map((i: any) => (
                  <div key={i.id} className="border-b border-gray-800/50 pb-2 mb-2 text-xs">
                    <div className="flex justify-between">
                      <p className="text-white">{i.type?.replace(/_/g, ' ')}</p>
                      <p className="text-gray-500">{fmtDate(i.createdAt)}</p>
                    </div>
                    <p className="text-gray-400 mt-0.5">{i.notes || '—'}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
