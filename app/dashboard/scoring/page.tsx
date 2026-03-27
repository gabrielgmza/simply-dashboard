'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ScoringPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(async r => {
      setUsers(r.data);
      setLoading(false);
    });
  }, []);

  const riskColor: Record<string, string> = {
    low: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    blocked: 'text-red-400 bg-red-400/10',
    unscored: 'text-gray-400 bg-gray-400/10',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Scoring & Riesgo</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Identity</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Compliance</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Behavior</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Capacity</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Total</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const s = scores[u.id];
              return (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{u.email}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.identityScore || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.complianceScore || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.behaviorScore || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.capacityScore || '—'}</td>
                  <td className="px-4 py-3 text-right text-white font-bold">{s?.totalScore || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {s ? <span className={`text-xs px-2 py-1 rounded-full ${riskColor[s.riskLevel]}`}>{s.riskLevel}</span> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
