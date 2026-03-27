'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(r => { setNotifs(r.data); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    sent: 'text-green-400', failed: 'text-red-400', pending: 'text-yellow-400', delivered: 'text-blue-400'
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Notificaciones</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Canal</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Evento</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Asunto</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {notifs.map((n) => (
              <tr key={n.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white">{n.channel}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{n.eventType}</td>
                <td className="px-4 py-3 text-gray-400">{n.subject}</td>
                <td className="px-4 py-3"><span className={`text-xs ${statusColor[n.status]}`}>{n.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(n.createdAt).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
