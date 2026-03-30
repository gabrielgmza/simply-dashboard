'use client';
import { useRequirePin } from '@/lib/security';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AmlPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [loading, setLoading] = useState(true);
  const requirePin = useRequirePin();
  const [editingRule, setEditingRule] = useState<any>(null);

  const fetchAll = async () => {
    const [a, r, s] = await Promise.all([
      api.get('/aml/alerts'),
      api.get('/aml/rules'),
      api.get('/aml/summary'),
    ]);
    setAlerts(a.data);
    setRules(r.data);
    setSummary(s.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resolveAlert = async (id: string, status: string) => {
    if (['resolved', 'reported_uif', 'false_positive'].includes(status)) {
      const ok = await requirePin(`Resolver alerta AML como "${status}"`);
      if (!ok) return;
    }
    const ok = await requirePin('Resolver alerta AML');
    if (!ok) return;
    await api.put(`/aml/alerts/${id}/resolve`, {
      resolvedBy: 'dashboard',
      notes: `Marcado como ${status} desde dashboard`,
      status,
    });
    fetchAll();
  };

  const saveRule = async () => {
    const ok = await requirePin('Modificar regla AML');
    if (!ok) return;
    await api.put(`/aml/rules/${editingRule.id}`, editingRule);
    setEditingRule(null);
    fetchAll();
  };

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-2">AML — Prevención de Lavado</h2>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Alertas abiertas</p>
            <p className="text-white text-2xl font-bold">{summary.openAlerts}</p>
          </div>
          <div className="bg-gray-900 border border-red-900/40 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Alertas críticas</p>
            <p className="text-red-400 text-2xl font-bold">{summary.criticalAlerts}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Total historial</p>
            <p className="text-white text-2xl font-bold">{summary.totalAlerts}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('alerts')} className={`px-4 py-2 rounded-lg text-sm transition ${tab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Alertas
        </button>
        <button onClick={() => setTab('rules')} className={`px-4 py-2 rounded-lg text-sm transition ${tab === 'rules' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Reglas
        </button>
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? <p className="text-gray-400">No hay alertas.</p> : alerts.map(alert => (
            <div key={alert.id} className={`bg-gray-900 border rounded-xl p-5 ${alert.status === 'open' ? 'border-orange-900/40' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{alert.ruleName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor[alert.severity] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{alert.severity}</span>
                    {alert.autoBlocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30">BLOQUEADO</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{alert.description}</p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(alert.createdAt).toLocaleString('es-AR')} · Usuario: {alert.userId?.slice(0, 8)}...</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${alert.status === 'open' ? 'bg-orange-400/10 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>{alert.status}</span>
              </div>
              {alert.status === 'open' && (
                <div className="flex gap-2">
                  <button onClick={() => resolveAlert(alert.id, 'investigating')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Investigar</button>
                  <button onClick={() => resolveAlert(alert.id, 'resolved')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Resolver</button>
                  <button onClick={() => resolveAlert(alert.id, 'false_positive')} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded-lg transition">Falso positivo</button>
                  <button onClick={() => resolveAlert(alert.id, 'reported_uif')} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Reportar UIF</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-3">
          {editingRule && (
            <div className="bg-gray-900 border border-blue-800 rounded-xl p-5 mb-4">
              <h3 className="text-white font-semibold mb-4">Editando: {editingRule.name}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { key: 'thresholdAmount', label: 'Umbral monto ($)' },
                  { key: 'thresholdCount', label: 'Umbral cantidad' },
                  { key: 'thresholdPeriodHours', label: 'Período (horas)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-gray-400 text-xs block mb-1">{label}</label>
                    <input
                      type="number"
                      value={editingRule[key] ?? ''}
                      onChange={e => setEditingRule({ ...editingRule, [key]: e.target.value })}
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Severidad</label>
                  <select
                    value={editingRule.severity}
                    onChange={e => setEditingRule({ ...editingRule, severity: e.target.value })}
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700"
                  >
                    {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-gray-400 text-sm">
                  <input type="checkbox" checked={editingRule.enabled} onChange={e => setEditingRule({ ...editingRule, enabled: e.target.checked })} />
                  Habilitada
                </label>
                <label className="flex items-center gap-2 text-gray-400 text-sm">
                  <input type="checkbox" checked={editingRule.autoBlock} onChange={e => setEditingRule({ ...editingRule, autoBlock: e.target.checked })} />
                  Bloqueo automático
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={saveRule} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">Guardar</button>
                <button onClick={() => setEditingRule(null)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition">Cancelar</button>
              </div>
            </div>
          )}
          {rules.map(rule => (
            <div key={rule.id} className={`bg-gray-900 border rounded-xl p-5 ${rule.enabled ? 'border-gray-800' : 'border-gray-800 opacity-50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{rule.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor[rule.severity] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{rule.severity}</span>
                    {!rule.enabled && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-500">deshabilitada</span>}
                    {rule.autoBlock && <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30">auto-bloqueo</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{rule.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {rule.thresholdAmount && <span>Umbral: ${Number(rule.thresholdAmount).toLocaleString('es-AR')}</span>}
                    {rule.thresholdCount && <span>Cantidad: {rule.thresholdCount}</span>}
                    {rule.thresholdPeriodHours && <span>Período: {rule.thresholdPeriodHours}h</span>}
                  </div>
                </div>
                <button onClick={() => setEditingRule({ ...rule })} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
