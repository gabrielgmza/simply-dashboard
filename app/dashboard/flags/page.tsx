'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/flags').then(r => { setFlags(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const toggle = async (key: string) => {
    await api.put(`/flags/${key}/toggle`);
    fetch();
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Feature Flags</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Flag</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Descripción</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Última actualización</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white font-mono text-xs">{f.key}</td>
                <td className="px-4 py-3 text-gray-400">{f.description}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(f.updatedAt).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${f.enabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                    {f.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(f.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${f.enabled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    {f.enabled ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
