'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActor, setFilterActor] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const load = (action?: string) => {
    setLoading(true);
    const params = action ? `?action=${action}` : '';
    api.get(`/audit/logs${params}`).then(r => { setLogs(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const actorColor: Record<string, string> = {
    employee: 'text-blue-400 bg-blue-400/10',
    system: 'text-purple-400 bg-purple-400/10',
    user: 'text-green-400 bg-green-400/10',
  };

  const filtered = logs.filter(l =>
    (filterActor === 'all' || l.actorType === filterActor) &&
    (l.action?.toLowerCase().includes(search.toLowerCase()) ||
     l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
     l.actorId?.includes(search))
  );

  const stats = {
    total: logs.length,
    employee: logs.filter(l => l.actorType === 'employee').length,
    system: logs.filter(l => l.actorType === 'system').length,
    user: logs.filter(l => l.actorType === 'user').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Audit Trail</h2>
          <p className="text-gray-500 text-sm mt-0.5">Registro inmutable de todas las acciones del sistema</p>
        </div>
        <button onClick={() => load()} className="text-gray-500 hover:text-white text-sm transition">↻ Actualizar</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total registros', value: stats.total, color: 'text-white' },
          { label: 'Por empleados', value: stats.employee, color: 'text-blue-400' },
          { label: 'Por sistema', value: stats.system, color: 'text-purple-400' },
          { label: 'Por usuarios', value: stats.user, color: 'text-green-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'employee', 'system', 'user'].map(f => (
            <button key={f} onClick={() => setFilterActor(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filterActor === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f === 'employee' ? 'Empleados' : f === 'system' ? 'Sistema' : 'Usuarios'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por acción, entidad, ID..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Acción', 'Actor', 'Tipo actor', 'Entidad', 'Detalle'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-700 py-8">Sin registros</td></tr>
            ) : filtered.map((l, i) => (
              <>
                <tr key={l.id || i}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer ${selected?.id === l.id ? 'bg-gray-800/40' : ''}`}
                  onClick={() => setSelected(selected?.id === l.id ? null : l)}>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(l.createdAt)}</td>
                  <td className="px-4 py-3 text-white font-mono">{l.action}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{l.actorId?.slice(0, 8) || '—'}...</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${actorColor[l.actorType] || 'text-gray-400 bg-gray-400/10'}`}>{l.actorType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{l.entityType || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{selected?.id === l.id ? '▲' : '▼'}</td>
                </tr>
                {selected?.id === l.id && (
                  <tr key={`${l.id}-detail`} className="border-b border-gray-800">
                    <td colSpan={6} className="px-4 py-4 bg-gray-800/30">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><p className="text-gray-600">Entity ID</p><p className="text-white font-mono mt-0.5">{l.entityId || '—'}</p></div>
                        <div><p className="text-gray-600">Resource ID</p><p className="text-white font-mono mt-0.5">{l.resourceId || '—'}</p></div>
                        <div><p className="text-gray-600">IP</p><p className="text-white mt-0.5">{l.ipAddress || '—'}</p></div>
                        <div className="col-span-3"><p className="text-gray-600">Metadata</p><p className="text-gray-400 mt-0.5 font-mono text-xs break-all">{l.metadata ? JSON.stringify(l.metadata) : '—'}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
