'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  pending_verification: 'text-yellow-400 bg-yellow-400/10',
  restricted: 'text-orange-400 bg-orange-400/10',
  frozen: 'text-blue-400 bg-blue-400/10',
  blocked: 'text-red-400 bg-red-400/10',
  draft: 'text-gray-400 bg-gray-400/10',
  closed: 'text-gray-600 bg-gray-600/10',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search);
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = users.reduce((acc: any, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Usuarios ({users.length})</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Activos', key: 'active', color: 'text-green-400' },
          { label: 'Pendientes', key: 'pending_verification', color: 'text-yellow-400' },
          { label: 'Bloqueados', key: 'blocked', color: 'text-red-400' },
          { label: 'Restringidos', key: 'restricted', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-700"
            onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}>
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{counts[s.key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por email o teléfono..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">Todos los estados</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Teléfono</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Registro</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => router.push('/dashboard/customers')}>
                <td className="px-4 py-3 text-white">{u.email}</td>
                <td className="px-4 py-3 text-gray-400">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[u.status] || 'text-gray-400 bg-gray-400/10'}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-blue-400 text-xs hover:underline">Ver perfil →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">Sin resultados</p>}
      </div>
    </div>
  );
}
