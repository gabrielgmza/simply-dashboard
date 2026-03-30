'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get('/notifications/all').catch(() => api.get('/notifications')).then(r => {
      setNotifs(r.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    sent: 'text-green-400 bg-green-400/10 border-green-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    delivered: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };
  const channelIcon: Record<string, string> = { email: '✉', sms: '◎', push: '◉' };
  const channelColor: Record<string, string> = {
    email: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    sms: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    push: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const stats = {
    total: notifs.length,
    sent: notifs.filter(n => n.status === 'sent' || n.status === 'delivered').length,
    failed: notifs.filter(n => n.status === 'failed').length,
    email: notifs.filter(n => n.channel === 'email').length,
    sms: notifs.filter(n => n.channel === 'sms').length,
    push: notifs.filter(n => n.channel === 'push').length,
  };

  const successRate = stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : '0';

  const filtered = notifs.filter(n => {
    const matchFilter = filter === 'all' || n.channel === filter || n.status === filter;
    const matchSearch = n.subject?.toLowerCase().includes(search.toLowerCase()) ||
      n.eventType?.toLowerCase().includes(search.toLowerCase()) ||
      n.userId?.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Notificaciones</h2>
        <p className="text-gray-500 text-sm mt-0.5">Historial de comunicaciones enviadas</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total enviadas', value: stats.total, color: 'text-white', sub: `${successRate}% tasa de éxito` },
          { label: 'Exitosas', value: stats.sent, color: 'text-green-400', sub: 'Enviadas + entregadas' },
          { label: 'Fallidas', value: stats.failed, color: 'text-red-400', sub: 'Requieren revisión' },
          { label: 'Por canal', value: `${stats.email}/${stats.sms}/${stats.push}`, color: 'text-blue-400', sub: 'Email / SMS / Push' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-wrap">
          {['all', 'email', 'sms', 'push', 'sent', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todas' : f}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por evento, asunto, usuario..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Canal', 'Evento', 'Asunto', 'Usuario', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.slice(0, 100).map(n => (
              <>
                <tr key={n.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.id === n.id ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(n.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${channelColor[n.channel] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                      {channelIcon[n.channel] || '◉'} {n.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{n.eventType}</td>
                  <td className="px-4 py-3 text-white truncate max-w-xs">{n.subject || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{n.userId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${statusColor[n.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{n.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{selected?.id === n.id ? '▲' : '▼'}</td>
                </tr>
                {selected?.id === n.id && (
                  <tr key={`${n.id}-detail`} className="border-b border-gray-800">
                    <td colSpan={7} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><p className="text-gray-600">ID</p><p className="text-white font-mono mt-0.5">{n.id}</p></div>
                        <div><p className="text-gray-600">Usuario ID</p><p className="text-white font-mono mt-0.5">{n.userId}</p></div>
                        <div><p className="text-gray-600">Error</p><p className="text-red-400 mt-0.5">{n.error || '—'}</p></div>
                        {n.body && <div className="col-span-3"><p className="text-gray-600">Cuerpo</p><p className="text-gray-400 mt-0.5">{n.body}</p></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length > 100 && <p className="text-gray-600 text-center py-3 text-xs">Mostrando 100 de {filtered.length} registros</p>}
      </div>
    </div>
  );
}
