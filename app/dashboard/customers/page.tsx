'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  const selectUser = async (user: any) => {
    setSelected(user);
    const [kyc, wallet, score, profile] = await Promise.all([
      api.get(`/kyc/status`).catch(() => ({ data: null })),
      api.get(`/wallet/me`).catch(() => ({ data: null })),
      api.get(`/scoring/me`).catch(() => ({ data: null })),
      api.get(`/profiles/me`).catch(() => ({ data: null })),
    ]);
    setDetail({ kyc: kyc.data, wallet: wallet.data, score: score.data, profile: profile.data });
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const statusColor: Record<string, string> = {
    active: 'text-green-400', pending_verification: 'text-yellow-400',
    blocked: 'text-red-400', frozen: 'text-blue-400', draft: 'text-gray-400',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="flex gap-6">
      <div className="w-80 flex-shrink-0">
        <h2 className="text-white text-lg font-semibold mb-4">Customer 360</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <button key={u.id} onClick={() => selectUser(u)}
              className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition ${selected?.id === u.id ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white text-sm font-medium">{u.email}</p>
              <p className={`text-xs mt-0.5 ${statusColor[u.status] || 'text-gray-400'}`}>{u.status}</p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">Datos del cliente</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Email</p><p className="text-white">{selected.email}</p></div>
              <div><p className="text-gray-500">Teléfono</p><p className="text-white">{selected.phone}</p></div>
              <div><p className="text-gray-500">Estado</p><p className={statusColor[selected.status] || 'text-gray-400'}>{selected.status}</p></div>
              <div><p className="text-gray-500">Registro</p><p className="text-white">{new Date(selected.createdAt).toLocaleDateString('es-AR')}</p></div>
              {detail.profile && <>
                <div><p className="text-gray-500">Nombre</p><p className="text-white">{detail.profile.firstName} {detail.profile.lastName}</p></div>
                <div><p className="text-gray-500">CUIL</p><p className="text-white">{detail.profile.cuil || '—'}</p></div>
                <div><p className="text-gray-500">Ciudad</p><p className="text-white">{detail.profile.city || '—'}</p></div>
                <div><p className="text-gray-500">Ocupación</p><p className="text-white">{detail.profile.occupation || '—'}</p></div>
              </>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">KYC</p>
              <p className={`text-sm font-semibold mt-1 ${detail.kyc?.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                {detail.kyc?.status || '—'}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">Saldo wallet</p>
              <p className="text-white text-sm font-semibold mt-1">{fmt(detail.wallet?.balance?.available)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">Score total</p>
              <p className={`text-sm font-semibold mt-1 ${Number(detail.score?.totalScore) >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                {detail.score?.totalScore || '—'} — {detail.score?.riskLevel || '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
