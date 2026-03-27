'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CrmPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/crm/customers').then(r => { setCustomers(r.data); setLoading(false); });
  }, []);

  const select = async (c: any) => {
    setSelected(c);
    const r = await api.get(`/crm/customers/${c.user.id}/360`);
    setDetail(r.data);
  };

  const addNote = async () => {
    if (!note.trim() || !selected) return;
    await api.post(`/crm/customers/${selected.user.id}/notes`, { content: note, type: 'general' });
    setNote('');
    const r = await api.get(`/crm/customers/${selected.user.id}/360`);
    setDetail(r.data);
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const riskColor: Record<string, string> = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', blocked: 'text-red-400', unscored: 'text-gray-400' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="flex gap-4 h-full">
      <div className="w-72 flex-shrink-0">
        <h2 className="text-white text-lg font-semibold mb-4">CRM Bancario</h2>
        <div className="space-y-2">
          {customers.map((c) => (
            <button key={c.user.id} onClick={() => select(c)}
              className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition ${selected?.user.id === c.user.id ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white text-sm font-medium">{c.profile?.firstName || c.user.email}</p>
              <p className="text-gray-500 text-xs">{c.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{fmt(c.balance?.available)}</span>
                {c.score && <span className={`text-xs ${riskColor[c.score.riskLevel]}`}>{c.score.riskLevel}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {detail && (
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">Saldo wallet</p>
              <p className="text-white font-bold mt-1">{fmt(detail.wallet?.balance?.available)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">Invertido</p>
              <p className="text-purple-400 font-bold mt-1">{fmt(detail.investments?.reduce((s: number, i: any) => s + Number(i.amount), 0))}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">Score</p>
              <p className={`font-bold mt-1 ${riskColor[detail.score?.riskLevel]}`}>{detail.score?.totalScore || '—'} — {detail.score?.riskLevel || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm font-medium mb-3">Perfil</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-500">CUIL: <span className="text-white">{detail.profile?.cuil || '—'}</span></p>
                <p className="text-gray-500">Ciudad: <span className="text-white">{detail.profile?.city || '—'}</span></p>
                <p className="text-gray-500">Ocupación: <span className="text-white">{detail.profile?.occupation || '—'}</span></p>
                <p className="text-gray-500">KYC: <span className={detail.kyc?.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}>{detail.kyc?.status || '—'}</span></p>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm font-medium mb-3">Préstamos</p>
              {detail.loans?.length === 0 ? <p className="text-gray-500 text-sm">Sin préstamos</p> : detail.loans?.map((l: any) => (
                <div key={l.id} className="text-sm mb-2">
                  <p className="text-white">{l.type.toUpperCase()} — {fmt(l.amount)}</p>
                  <p className="text-gray-500 text-xs">{l.installments} cuotas · {l.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm font-medium mb-3">Notas internas</p>
            <div className="space-y-2 mb-3">
              {detail.notes?.length === 0 && <p className="text-gray-500 text-sm">Sin notas</p>}
              {detail.notes?.map((n: any) => (
                <div key={n.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-white text-sm">{n.content}</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(n.createdAt).toLocaleString('es-AR')}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Agregar nota..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none" />
              <button onClick={addNote} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
