'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SecurityPage() {
  const [summary, setSummary] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const [s, a, b] = await Promise.all([
      api.get('/security/summary'),
      api.get('/security/alerts'),
      api.get('/security/blocks'),
    ]);
    setSummary(s.data);
    setAlerts(a.data);
    setBlocks(b.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const resolveAlert = async (id: string) => {
    await api.put(`/security/alerts/${id}/resolve`);
    fetch();
  };

  const releaseBlock = async (id: string) => {
    await api.put(`/security/blocks/${id}/release`);
    fetch();
  };

  const severityColor: Record<string, string> = { high: 'text-red-400 bg-red-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-green-400 bg-green-400/10' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl font-semibold">Seguridad</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Bloqueos activos</p>
          <p className="text-red-400 text-2xl font-bold mt-1">{summary.activeBlocks || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Alertas sin resolver</p>
          <p className="text-yellow-400 text-2xl font-bold mt-1">{summary.unresolvedAlerts || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Estado</p>
          <p className="text-green-400 text-sm font-medium mt-2">● Sistema operativo</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-4">Alertas activas</p>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{a.description}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(a.createdAt).toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${severityColor[a.severity]}`}>{a.severity}</span>
                  <button onClick={() => resolveAlert(a.id)} className="text-xs text-gray-400 hover:text-white">Resolver</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-4">Bloqueos activos</p>
          <div className="space-y-3">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{b.type} — {b.reason}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(b.createdAt).toLocaleString('es-AR')}</p>
                </div>
                <button onClick={() => releaseBlock(b.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Liberar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && blocks.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-green-400 text-lg">✓ Sin alertas ni bloqueos activos</p>
        </div>
      )}
    </div>
  );
}
