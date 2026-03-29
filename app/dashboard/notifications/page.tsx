'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/notifications/all').catch(() => api.get('/notifications')).then(r => {
      setNotifs(r.data);
      setLoading(false);
    });
  }, []);

  const statusColor: Record<string, string> = {
    sent: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    delivered: 'text-blue-400 bg-blue-400/10',
  };

  const channelIcon: Record<string, string> = { email: '📧', sms: '💬', push: '🔔' };

  const stats = {
    total: notifs.length,
    sent: notifs.filter(n => n.status === 'sent').length,
    failed: notifs.filter(n => n.status === 'failed').length,
    push: notifs.filter(n => n.channel === 'push').length,
  };

  const filtered = notifs.filter(n => {
    const matchFilter = filter === 'all' || n.channel === filter || n.status === filter;
    const matchSearch = n.subject?.toLowerCase().includes(search.toLowerCase()) || n.eventType?.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Notificaciones</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total enviadas</p>
          <p className="text-white text-xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Exitosas</p>
          <p className="text-green-400 text-xl font-bold mt-1">{stats.sent}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Fallidas</p>
          <p className="text-red-400 text-xl font-bold mt-1">{stats.failed}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Push</p>
          <p className="text-blue-400 text-xl font-bold mt-1">{stats.push}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
        <div className="flex gap-1">
          {['all', 'email', 'sms', 'push', 'sent', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>
      </div>

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
            {filtered.slice(0, 100).map((n) => (
              <tr key={n.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white">{channelIcon[n.channel] || '🔔'} {n.channel}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{n.eventType}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{n.subject}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[n.status] || 'text-gray-400 bg-gray-400/10'}`}>{n.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(n.createdAt).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">Sin resultados</p>}
      </div>
    </div>
  );
}
