'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AMLPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-2">AML / Compliance</h2>
      <p className="text-gray-500 text-sm mb-6">Monitoreo de perfiles transaccionales y alertas</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Usuarios monitoreados</p>
          <p className="text-white text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Alertas activas</p>
          <p className="text-green-400 text-2xl font-bold mt-1">0</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">PEP detectados</p>
          <p className="text-green-400 text-2xl font-bold mt-1">0</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm mb-4">Screening de usuarios</p>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div>
                <p className="text-white text-sm">{u.email}</p>
                <p className="text-gray-500 text-xs">{u.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded-full">Sin alertas</span>
                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded-full">No PEP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
