'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface KycCase {
  id: string;
  userId: string;
  status: string;
  dniFrontUrl: string;
  dniBackUrl: string;
  selfieUrl: string;
  submittedAt: string;
}

export default function KycPage() {
  const [cases, setCases] = useState<KycCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    api.get('/kyc/pending').then((res) => {
      setCases(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPending(); }, []);

  const review = async (id: string, status: 'approved' | 'rejected', notes: string) => {
    await api.post(`/kyc/${id}/review`, { status, notes });
    fetchPending();
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Revisión KYC</h2>
      {cases.length === 0 ? (
        <p className="text-gray-400">No hay casos pendientes.</p>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium text-sm">{c.userId}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Enviado: {new Date(c.submittedAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded-full">
                  {c.status}
                </span>
              </div>
              <div className="flex gap-2 text-xs text-gray-400 mb-4">
                <a href={c.dniFrontUrl} target="_blank" className="underline">DNI frente</a>
                <a href={c.dniBackUrl} target="_blank" className="underline">DNI dorso</a>
                <a href={c.selfieUrl} target="_blank" className="underline">Selfie</a>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => review(c.id, 'approved', 'Aprobado desde dashboard')}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => review(c.id, 'rejected', 'Rechazado desde dashboard')}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
