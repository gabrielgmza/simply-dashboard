'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetch = (action?: string) => {
    const params = action ? `?action=${action}` : '';
    api.get(`/audit/logs${params}`).then(r => { setLogs(r.data); setLoading(false); });
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Audit Trail</h2>
        <div className="flex gap-2">
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por acción..."
            className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 focus:outline-none" />
          <button onClick={() => fetch(filter)} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">Filtrar</button>
          <button onClick={() => { setFilter(''); fetch(); }} className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg">Limpiar</button>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Acción</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Actor</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Entidad</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.actorType}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.entityType || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.createdAt).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
