'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  active:               'text-green-400 bg-green-400/10 border-green-400/20',
  pending_verification: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  restricted:           'text-orange-400 bg-orange-400/10 border-orange-400/20',
  frozen:               'text-blue-400 bg-blue-400/10 border-blue-400/20',
  blocked:              'text-red-400 bg-red-400/10 border-red-400/20',
  draft:                'text-gray-400 bg-gray-400/10 border-gray-400/20',
  closed:               'text-gray-600 bg-gray-600/10 border-gray-600/20',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const router = useRouter();

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const counts = users.reduce((acc: any, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});

  const filtered = users
    .filter(u => {
      const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search);
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => sortBy === 'newest'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const activationRate = users.length > 0
    ? ((counts['active'] || 0) / users.length * 100).toFixed(0) : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Usuarios</h2>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} registrados · {activationRate}% tasa de activación</p>
        </div>
      </div>

      {/* KPIs clickeables */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Activos', key: 'active', color: 'text-green-400', border: 'border-green-900/30' },
          { label: 'Pendientes', key: 'pending_verification', color: 'text-yellow-400', border: 'border-yellow-900/30' },
          { label: 'Bloqueados', key: 'blocked', color: 'text-red-400', border: 'border-red-900/30' },
          { label: 'Restringidos', key: 'restricted', color: 'text-orange-400', border: 'border-orange-900/30' },
        ].map(s => (
          <button key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}
            className={`bg-gray-900/80 border rounded-xl p-4 text-left transition hover:border-gray-700 ${filterStatus === s.key ? s.border : 'border-gray-800'}`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key] || 0}</p>
            <div className="mt-2 bg-gray-800 rounded-full h-1">
              <div className={`h-1 rounded-full ${s.color.replace('text-', 'bg-').replace('-400', '-500')}`}
                style={{ width: `${users.length > 0 ? ((counts[s.key] || 0) / users.length * 100) : 0}%` }} />
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email o teléfono..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-400 text-sm rounded-xl px-3 py-2 outline-none">
          <option value="all">Todos los estados</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-gray-900 border border-gray-800 text-gray-400 text-sm rounded-xl px-3 py-2 outline-none">
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <p className="text-gray-500 text-xs">{filtered.length} usuarios encontrados</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Usuario', 'Teléfono', 'Estado', 'Registro', 'Acciones'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-700 py-8">Sin resultados</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/20 transition cursor-pointer"
                onClick={() => router.push('/dashboard/customers')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                      {u.email?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-medium">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border ${statusColors[u.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                    {u.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="text-blue-400 hover:text-blue-300 transition text-xs">Ver legajo →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
