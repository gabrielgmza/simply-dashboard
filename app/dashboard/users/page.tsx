'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  pending_verification: 'text-yellow-400 bg-yellow-400/10',
  restricted: 'text-orange-400 bg-orange-400/10',
  frozen: 'text-blue-400 bg-blue-400/10',
  blocked: 'text-red-400 bg-red-400/10',
  draft: 'text-gray-400 bg-gray-400/10',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then((res) => {
      setUsers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Usuarios</h2>
      {users.length === 0 ? (
        <p className="text-gray-400">No hay usuarios.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Estado</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 text-white">{u.email}</td>
                  <td className="px-4 py-3 text-gray-400">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[u.status] || 'text-gray-400 bg-gray-400/10'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
