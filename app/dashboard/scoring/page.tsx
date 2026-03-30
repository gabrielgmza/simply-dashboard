'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ScoringPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const loadScores = async () => {
    setLoadingScores(true);
    const results: Record<string, any> = {};
    for (const u of users) {
      try {
        const r = await api.get(`/scoring/user/${u.id}`).catch(() => null);
        if (r?.data) results[u.id] = r.data;
      } catch {}
    }
    setScores(results);
    setLoadingScores(false);
  };

  const riskColor: Record<string, string> = {
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    blocked: 'text-red-500 bg-red-500/10 border-red-500/20',
    unscored: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };

  const scoredCount = Object.keys(scores).length;
  const avgScore = scoredCount > 0
    ? Object.values(scores).reduce((s: number, v: any) => s + Number(v?.totalScore || 0), 0) / scoredCount : 0;
  const highRisk = Object.values(scores).filter((s: any) => s?.riskLevel === 'high' || s?.riskLevel === 'critical').length;

  const scoreBar = (score: number) => {
    const pct = Math.min(100, (score / 100) * 100);
    const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return { pct, color };
  };

  const filtered = users
    .filter(u => filterRisk === 'all' || (scores[u.id]?.riskLevel === filterRisk) || (filterRisk === 'unscored' && !scores[u.id]))
    .filter(u => u.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Scoring & Riesgo</h2>
          <p className="text-gray-500 text-sm mt-0.5">Modelo de riesgo crediticio · Basel III compatible</p>
        </div>
        <button onClick={loadScores} disabled={loadingScores}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          {loadingScores ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Calculando...</> : '↻ Cargar scores'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Usuarios con score', value: scoredCount, color: 'text-white', sub: `de ${users.length} totales` },
          { label: 'Score promedio', value: avgScore.toFixed(1), color: avgScore >= 70 ? 'text-green-400' : avgScore >= 40 ? 'text-yellow-400' : 'text-red-400', sub: 'Sobre 100 puntos' },
          { label: 'Alto riesgo', value: highRisk, color: 'text-red-400', sub: 'High + critical' },
          { label: 'Sin score', value: users.length - scoredCount, color: 'text-gray-400', sub: 'Pendientes de evaluar' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {scoredCount > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-xs font-medium mb-4">DISTRIBUCIÓN DE RIESGO</p>
          <div className="grid grid-cols-4 gap-4">
            {['low', 'medium', 'high', 'critical'].map(level => {
              const count = Object.values(scores).filter((s: any) => s?.riskLevel === level).length;
              const pct = scoredCount > 0 ? (count / scoredCount * 100) : 0;
              return (
                <div key={level}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={riskColor[level].split(' ')[0]}>{level}</span>
                    <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full ${level === 'low' ? 'bg-green-500' : level === 'medium' ? 'bg-yellow-500' : level === 'high' ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
          {['all', 'low', 'medium', 'high', 'critical', 'unscored'].map(f => (
            <button key={f} onClick={() => setFilterRisk(f)}
              className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filterRisk === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Email', 'Identidad', 'Compliance', 'Comportamiento', 'Capacidad', 'Total', 'Score', 'Nivel'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const s = scores[u.id];
              const bar = s ? scoreBar(s.totalScore) : null;
              return (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 text-white">{u.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{s?.identityScore ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{s?.complianceScore ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{s?.behaviorScore ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{s?.capacityScore ?? '—'}</td>
                  <td className="px-4 py-3 text-white font-bold text-right">{s?.totalScore ?? '—'}</td>
                  <td className="px-4 py-3 w-24">
                    {bar ? (
                      <div className="bg-gray-800 rounded-full h-1.5">
                        <div className={`${bar.color} h-1.5 rounded-full`} style={{ width: `${bar.pct}%` }} />
                      </div>
                    ) : <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s ? (
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${riskColor[s.riskLevel] || riskColor.unscored}`}>{s.riskLevel}</span>
                    ) : (
                      <span className="text-gray-600 text-xs">sin score</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-gray-700 py-8">Sin usuarios</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
