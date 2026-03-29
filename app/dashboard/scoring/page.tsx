'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ScoringPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  }, []);

  const loadScores = async () => {
    setLoadingScores(true);
    const results: Record<string, any> = {};
    for (const u of users) {
      try {
        const r = await api.get(`/scoring/user/${u.id}`).catch(() => null);
        if (r) results[u.id] = r.data;
      } catch {}
    }
    setScores(results);
    setLoadingScores(false);
  };

  const riskColor: Record<string, string> = {
    low: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    critical: 'text-red-400 bg-red-400/10',
    blocked: 'text-red-400 bg-red-400/10',
    unscored: 'text-gray-400 bg-gray-400/10',
  };

  const scoredCount = Object.keys(scores).length;
  const avgScore = scoredCount > 0
    ? Object.values(scores).reduce((s: number, v: any) => s + Number(v?.totalScore || 0), 0) / scoredCount
    : 0;

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Scoring & Riesgo</h2>
        <button onClick={loadScores} disabled={loadingScores}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          {loadingScores ? 'Cargando scores...' : 'Cargar scores'}
        </button>
      </div>

      {scoredCount > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Usuarios con score</p>
            <p className="text-white text-2xl font-bold mt-1">{scoredCount}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Score promedio</p>
            <p className="text-white text-2xl font-bold mt-1">{avgScore.toFixed(1)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">Alto riesgo</p>
            <p className="text-red-400 text-2xl font-bold mt-1">
              {Object.values(scores).filter((s: any) => s?.riskLevel === 'high' || s?.riskLevel === 'critical').length}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Email</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Identidad</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Compliance</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Comportamiento</th>
              <th className="text-right text-gray-400 px-4 py-3 font-medium">Capacidad</th>
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
                  <td className="px-4 py-3 text-right text-gray-400">{s?.identityScore ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.complianceScore ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.behaviorScore ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{s?.capacityScore ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-white font-bold">{s?.totalScore ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {s ? <span className={`text-xs px-2 py-1 rounded-full ${riskColor[s.riskLevel] || 'text-gray-400 bg-gray-400/10'}`}>{s.riskLevel}</span> : <span className="text-gray-600 text-xs">sin score</span>}
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
