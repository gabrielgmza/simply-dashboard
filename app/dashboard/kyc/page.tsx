'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRequirePin } from '@/lib/security';

export default function KycPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const requirePin = useRequirePin();

  const fetchData = async () => {
    const [pending, all] = await Promise.all([
      api.get('/kyc/pending').catch(() => ({ data: [] })),
      api.get('/kyc/all').catch(() => ({ data: [] })),
    ]);
    setCases(pending.data);
    setAllCases(all.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const review = async (id: string, status: 'approved' | 'approved_with_limits' | 'rejected') => {
    const ok = await requirePin(`KYC: ${status === 'approved' ? 'Aprobar' : status === 'rejected' ? 'Rechazar' : 'Aprobar con límites'} identidad`);
    if (!ok) return;
    setReviewing(id);
    await api.post(`/kyc/${id}/review`, { status, notes: notes[id] || `${status} desde dashboard` }).catch(() => {});
    await fetchData();
    setReviewing(null);
  };

  const statusColor: Record<string, string> = {
    approved: 'text-green-400 bg-green-400/10 border-green-400/20',
    approved_with_limits: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    under_review: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    submitted: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    not_started: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const displayed = (tab === 'pending' ? cases : allCases)
    .filter(c => c.userId?.includes(search) || notes[c.id]?.includes(search));

  const stats = {
    pending: cases.length,
    approved: allCases.filter(c => c.status === 'approved').length,
    rejected: allCases.filter(c => c.status === 'rejected').length,
    total: allCases.length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Revisión KYC</h2>
        <p className="text-gray-500 text-sm mt-0.5">Verificación de identidad RENAPER · Norma BCRA A 5952</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-400', urgent: stats.pending > 0 },
          { label: 'Aprobados', value: stats.approved, color: 'text-green-400', urgent: false },
          { label: 'Rechazados', value: stats.rejected, color: 'text-red-400', urgent: false },
          { label: 'Total casos', value: stats.total, color: 'text-white', urgent: false },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gray-900/80 border rounded-xl p-4 ${kpi.urgent ? 'border-yellow-900/40' : 'border-gray-800'}`}>
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          <button onClick={() => setTab('pending')}
            className={`text-xs px-4 py-2 rounded-lg transition font-medium ${tab === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Pendientes ({cases.length})
          </button>
          <button onClick={() => setTab('all')}
            className={`text-xs px-4 py-2 rounded-lg transition font-medium ${tab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Todos ({allCases.length})
          </button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ID de usuario..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      {displayed.length === 0 ? (
        <div className="bg-gray-900/80 border border-green-900/30 rounded-xl p-8 text-center">
          <div className="text-green-400 text-4xl mb-2">✓</div>
          <p className="text-green-400 text-sm font-medium">Sin casos pendientes</p>
          <p className="text-gray-600 text-xs mt-1">Todos los KYC han sido revisados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(c => (
            <div key={c.id} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[c.status] || ''}`}>{c.status}</span>
                    {c.renaperScore && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.renaperScore >= 80 ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                        RENAPER {c.renaperScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs font-mono">Usuario: {c.userId}</p>
                  <p className="text-gray-600 text-xs mt-0.5">Enviado: {fmtDate(c.submittedAt)}</p>
                  {c.reviewedAt && <p className="text-gray-600 text-xs">Revisado: {fmtDate(c.reviewedAt)}</p>}
                </div>

                {c.renaperData && (() => {
                  try {
                    const data = JSON.parse(c.renaperData);
                    return (
                      <div className="text-right bg-gray-800/60 rounded-xl p-3">
                        <p className="text-white text-sm font-semibold">{data.nombre} {data.apellido}</p>
                        <p className="text-gray-400 text-xs">DNI: {data.dni}</p>
                        <p className="text-gray-400 text-xs">CUIL: {data.cuil}</p>
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>

              {/* Score biométrico */}
              {c.renaperScore && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Score biométrico RENAPER</span>
                    <span className={c.renaperScore >= 80 ? 'text-green-400' : 'text-yellow-400'}>{c.renaperScore}%</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full ${c.renaperScore >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${c.renaperScore}%` }} />
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {c.dniFrontUrl && (
                  <a href={c.dniFrontUrl} target="_blank" rel="noreferrer"
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    ◻ DNI frente
                  </a>
                )}
                {c.dniBackUrl && (
                  <a href={c.dniBackUrl} target="_blank" rel="noreferrer"
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    ◻ DNI dorso
                  </a>
                )}
                {c.selfieUrl && (
                  <a href={c.selfieUrl} target="_blank" rel="noreferrer"
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    ◉ Selfie
                  </a>
                )}
              </div>

              {c.reviewerNotes && (
                <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
                  <p className="text-gray-600 text-xs mb-1">Notas del revisor</p>
                  <p className="text-gray-300 text-xs">{c.reviewerNotes}</p>
                </div>
              )}

              {(c.status === 'submitted' || c.status === 'under_review' || c.status === 'pending') && (
                <div className="space-y-2 border-t border-gray-800 pt-4">
                  <textarea
                    value={notes[c.id] || ''}
                    onChange={e => setNotes({ ...notes, [c.id]: e.target.value })}
                    placeholder="Notas del revisor (obligatorio para rechazo)..."
                    className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 resize-none h-16"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => review(c.id, 'approved')} disabled={reviewing === c.id}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded-xl transition disabled:opacity-50">
                      ✓ Aprobar
                    </button>
                    <button onClick={() => review(c.id, 'approved_with_limits')} disabled={reviewing === c.id}
                      className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 py-2 rounded-xl transition disabled:opacity-50">
                      Aprobar con límites
                    </button>
                    <button onClick={() => review(c.id, 'rejected')} disabled={reviewing === c.id}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2 rounded-xl transition disabled:opacity-50">
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
