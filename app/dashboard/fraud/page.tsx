'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FraudPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/fraud/cases/open').then(r => { setCases(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const update = async (id: string, status: string) => {
    await api.put(`/fraud/cases/${id}/status`, { status, analystNotes: `Actualizado a ${status}` });
    fetch();
  };

  const severityColor: Record<string, string> = { high: 'text-red-400 bg-red-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-green-400 bg-green-400/10' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Fraude & Disputas</h2>
      {cases.length === 0 ? <p className="text-gray-400">No hay casos abiertos.</p> : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{c.type.replace(/_/g, ' ')}</p>
                  <p className="text-gray-400 text-sm mt-1">{c.description}</p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(c.createdAt).toLocaleString('es-AR')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${severityColor[c.severity] || 'text-gray-400 bg-gray-400/10'}`}>{c.severity}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => update(c.id, 'investigating')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Investigar</button>
                <button onClick={() => update(c.id, 'resolved')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Resolver</button>
                <button onClick={() => update(c.id, 'escalated')} className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Escalar</button>
                <button onClick={() => update(c.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
