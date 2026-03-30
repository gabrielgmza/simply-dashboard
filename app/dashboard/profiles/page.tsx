'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users').then(r => { setProfiles(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = profiles.filter(p =>
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    pending_verification: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    blocked: 'text-red-400 bg-red-400/10 border-red-400/20',
    frozen: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    restricted: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  };

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.status === 'active').length,
    pending: profiles.filter(p => p.status === 'pending_verification').length,
    blocked: profiles.filter(p => p.status === 'blocked' || p.status === 'frozen').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Perfiles de clientes</h2>
          <p className="text-gray-500 text-sm mt-0.5">Directorio completo de usuarios registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total registrados', value: stats.total, color: 'text-white' },
          { label: 'Activos', value: stats.active, color: 'text-green-400' },
          { label: 'Pendientes verificación', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Bloqueados / Frozen', value: stats.blocked, color: 'text-red-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email o teléfono..."
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Email', 'Teléfono', 'Estado', 'Creado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3 text-white text-xs">{p.email}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[p.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                    {p.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-AR') : '—'}</td>
                <td className="px-4 py-3">
                  <a href={`/dashboard/customers`} className="text-blue-400 hover:text-blue-300 text-xs transition">Ver legajo →</a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-gray-700 py-8 text-sm">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
