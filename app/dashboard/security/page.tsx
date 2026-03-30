'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRequirePin } from '@/lib/security';

export default function SecurityPage() {
  const [summary, setSummary] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const requirePin = useRequirePin();

  const load = async () => {
    setLoading(true);
    const [s, a, b] = await Promise.all([
      api.get('/security/summary').catch(() => ({ data: {} })),
      api.get('/security/alerts').catch(() => ({ data: [] })),
      api.get('/security/blocks').catch(() => ({ data: [] })),
    ]);
    setSummary(s.data);
    setAlerts(a.data);
    setBlocks(b.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolveAlert = async (id: string) => {
    const ok = await requirePin('Resolver alerta de seguridad');
    if (!ok) return;
    await api.put(`/security/alerts/${id}/resolve`).catch(() => {});
    load();
  };

  const releaseBlock = async (id: string) => {
    const ok = await requirePin('Liberar bloqueo de seguridad');
    if (!ok) return;
    await api.put(`/security/blocks/${id}/release`).catch(() => {});
    load();
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const severityColor: Record<string, string> = {
    high:   'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low:    'text-green-400 bg-green-400/10 border-green-400/20',
  };

  const blockTypeColor: Record<string, string> = {
    aml:      'text-orange-400 bg-orange-400/10',
    fraud:    'text-red-400 bg-red-400/10',
    manual:   'text-purple-400 bg-purple-400/10',
    kyc:      'text-yellow-400 bg-yellow-400/10',
    system:   'text-blue-400 bg-blue-400/10',
  };

  const filteredAlerts = alerts
    .filter(a => filterSeverity === 'all' || a.severity === filterSeverity)
    .filter(a => a.description?.toLowerCase().includes(search.toLowerCase()) || a.userId?.includes(search));

  const systemOk = (summary.unresolvedAlerts || 0) === 0 && (summary.activeBlocks || 0) === 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Seguridad</h2>
          <p className="text-gray-500 text-sm mt-0.5">Monitoreo de alertas y bloqueos en tiempo real</p>
        </div>
        <button onClick={load} className="text-gray-500 hover:text-white text-sm transition">↻ Actualizar</button>
      </div>

      {/* Estado sistema */}
      <div className={`bg-gray-900/80 border rounded-2xl p-5 flex items-center gap-4 ${systemOk ? 'border-green-900/30' : 'border-red-900/30'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${systemOk ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
          <span className={`text-xl ${systemOk ? 'text-green-400' : 'text-red-400'}`}>{systemOk ? '⊛' : '⚠'}</span>
        </div>
        <div>
          <p className={`font-semibold text-sm ${systemOk ? 'text-green-400' : 'text-red-400'}`}>
            {systemOk ? 'Sistema operativo — Sin alertas activas' : 'Requiere atención — Hay alertas pendientes'}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Monitoreo continuo · Rate limiting activo · SCA habilitado</p>
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full ${systemOk ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Bloqueos activos', value: summary.activeBlocks || 0, color: 'text-red-400', warn: (summary.activeBlocks || 0) > 0 },
          { label: 'Alertas sin resolver', value: summary.unresolvedAlerts || 0, color: 'text-yellow-400', warn: (summary.unresolvedAlerts || 0) > 0 },
          { label: 'Alta severidad', value: alerts.filter(a => a.severity === 'high').length, color: 'text-orange-400', warn: false },
          { label: 'Resueltas hoy', value: summary.resolvedToday || 0, color: 'text-green-400', warn: false },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gray-900/80 border rounded-xl p-4 ${kpi.warn ? 'border-red-900/40' : 'border-gray-800'}`}>
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
              {['all', 'high', 'medium', 'low'].map(f => (
                <button key={f} onClick={() => setFilterSeverity(f)}
                  className={`text-xs px-3 py-2 rounded-lg transition font-medium ${filterSeverity === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {f === 'all' ? 'Todas' : f}
                </button>
              ))}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por descripción, usuario..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <p className="text-gray-400 text-sm font-medium">Alertas activas ({filteredAlerts.length})</p>
            </div>
            <div className="divide-y divide-gray-800/50">
              {filteredAlerts.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-8">Sin alertas con ese filtro</p>
              ) : filteredAlerts.map(a => (
                <div key={a.id} className="flex items-start justify-between px-5 py-4 hover:bg-gray-800/20 transition">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 ${severityColor[a.severity] || ''}`}>{a.severity}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{a.description}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Usuario: {a.userId?.slice(0, 8)}... · {fmtDate(a.createdAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => resolveAlert(a.id)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition flex-shrink-0 ml-4">
                    Resolver
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bloqueos */}
      {blocks.length > 0 && (
        <div className="bg-gray-900/80 border border-red-900/30 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-red-400 text-sm font-medium">Bloqueos activos ({blocks.length})</p>
          </div>
          <div className="divide-y divide-gray-800/50">
            {blocks.map(b => (
              <div key={b.id} className="flex items-start justify-between px-5 py-4 hover:bg-gray-800/20 transition">
                <div className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${blockTypeColor[b.type] || 'text-gray-400 bg-gray-400/10'}`}>{b.type}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{b.reason}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Usuario: {b.userId?.slice(0, 8)}... · {fmtDate(b.createdAt)}</p>
                  </div>
                </div>
                <button onClick={() => releaseBlock(b.id)}
                  className="text-xs bg-green-900/40 hover:bg-green-900/60 text-green-400 px-3 py-1.5 rounded-lg transition flex-shrink-0 ml-4 border border-green-900/30">
                  Liberar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && blocks.length === 0 && (
        <div className="bg-gray-900/80 border border-green-900/30 rounded-2xl p-10 text-center">
          <div className="text-green-400 text-5xl mb-3">⊛</div>
          <p className="text-green-400 text-base font-semibold">Sin alertas ni bloqueos activos</p>
          <p className="text-gray-600 text-sm mt-1">El sistema opera con normalidad</p>
        </div>
      )}
    </div>
  );
}
