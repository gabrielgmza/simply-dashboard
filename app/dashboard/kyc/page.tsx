'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function KycPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  const fetchData = async () => {
    const [pending, all] = await Promise.all([
      api.get('/kyc/pending'),
      api.get('/kyc/all').catch(() => ({ data: [] })),
    ]);
    setCases(pending.data);
    setAllCases(all.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const review = async (id: string, status: 'approved' | 'approved_with_limits' | 'rejected') => {
    setReviewing(id);
    await api.post(`/kyc/${id}/review`, { status, notes: notes[id] || `${status} desde dashboard` });
    await fetchData();
    setReviewing(null);
  };

  const statusColor: Record<string, string> = {
    approved: 'text-green-400 bg-green-400/10',
    approved_with_limits: 'text-teal-400 bg-teal-400/10',
    under_review: 'text-yellow-400 bg-yellow-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    submitted: 'text-blue-400 bg-blue-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    not_started: 'text-gray-400 bg-gray-400/10',
  };

  const displayed = tab === 'pending' ? cases : allCases;

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Revisión KYC</h2>
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm transition ${tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Pendientes ({cases.length})
          </button>
          <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm transition ${tab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Todos ({allCases.length})
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <p className="text-gray-400">No hay casos {tab === 'pending' ? 'pendientes' : ''}.</p>
      ) : (
        <div className="space-y-4">
          {displayed.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-medium text-sm font-mono">{c.userId}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Enviado: {new Date(c.submittedAt).toLocaleString('es-AR')}</p>
                  {c.reviewedAt && <p className="text-gray-500 text-xs">Revisado: {new Date(c.reviewedAt).toLocaleString('es-AR')}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[c.status] || 'text-gray-400 bg-gray-400/10'}`}>{c.status}</span>
              </div>

              {/* Score RENAPER */}
              {c.renaperScore && (
                <div className="bg-gray-800 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">Score biométrico RENAPER</p>
                    <p className={`text-lg font-bold ${c.renaperScore >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{c.renaperScore}%</p>
                  </div>
                  {c.renaperData && (() => {
                    try {
                      const data = JSON.parse(c.renaperData);
                      return (
                        <div className="text-right">
                          <p className="text-white text-sm font-medium">{data.nombre} {data.apellido}</p>
                          <p className="text-gray-400 text-xs">DNI: {data.dni} · CUIL: {data.cuil}</p>
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )}

              {/* Documentos */}
              <div className="flex gap-3 mb-4">
                {c.dniFrontUrl && <a href={c.dniFrontUrl} target="_blank" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition">📄 DNI frente</a>}
                {c.dniBackUrl && <a href={c.dniBackUrl} target="_blank" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition">📄 DNI dorso</a>}
                {c.selfieUrl && <a href={c.selfieUrl} target="_blank" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition">🤳 Selfie</a>}
              </div>

              {/* Notas del revisor */}
              {c.reviewerNotes && (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                  <p className="text-gray-500 text-xs mb-1">Notas</p>
                  <p className="text-gray-300 text-sm">{c.reviewerNotes}</p>
                </div>
              )}

              {/* Acciones */}
              {(c.status === 'submitted' || c.status === 'under_review' || c.status === 'pending') && (
                <div className="space-y-2">
                  <textarea
                    value={notes[c.id] || ''}
                    onChange={e => setNotes({ ...notes, [c.id]: e.target.value })}
                    placeholder="Notas del revisor (opcional)..."
                    className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 border border-gray-700 resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => review(c.id, 'approved')} disabled={reviewing === c.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50">
                      ✓ Aprobar
                    </button>
                    <button onClick={() => review(c.id, 'approved_with_limits')} disabled={reviewing === c.id}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50">
                      Aprobar con límites
                    </button>
                    <button onClick={() => review(c.id, 'rejected')} disabled={reviewing === c.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50">
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
