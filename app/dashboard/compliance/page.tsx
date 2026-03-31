'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const UIF_CHECKLIST = [
  { key: 'hasOfficer',         label: 'Oficial de Cumplimiento designado',        norm: 'Res. UIF 50/2021',   req: true },
  { key: 'hasManualAML',       label: 'Manual de Prevención LA/FT aprobado',      norm: 'Res. UIF 30/2018',   req: true },
  { key: 'hasRiskAssessment',  label: 'Autoevaluación de Riesgos aprobada',       norm: 'Res. UIF 156/2018',  req: true },
  { key: 'hasKycProcedure',    label: 'Procedimiento KYC documentado',            norm: 'Res. UIF 76/2019',   req: true },
  { key: 'hasPepProcedure',    label: 'Procedimiento PEP y listas restrictivas',  norm: 'Res. UIF 52/2012',   req: true },
  { key: 'hasTrainingProgram', label: 'Programa de capacitación anual',           norm: 'Res. UIF 50/2021',   req: false },
  { key: 'hasRei',             label: 'Revisor Externo Independiente (REI)',       norm: 'Res. UIF 169/2001',  req: false },
  { key: 'hasInternalAudit',   label: 'Auditoría interna de cumplimiento',        norm: 'BCRA Com. A 6661',   req: false },
];

export default function CompliancePage() {
  const [summary, setSummary] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'documents' | 'officers'>('overview');

  const load = async () => {
    const [s, r, o, d, a] = await Promise.all([
      api.get('/compliance/summary').catch(() => ({ data: {} })),
      api.get('/compliance/reports').catch(() => ({ data: [] })),
      api.get('/compliance/officers').catch(() => ({ data: [] })),
      api.get('/compliance/documents').catch(() => ({ data: [] })),
      api.get('/compliance/risk-assessments').catch(() => ({ data: [] })),
    ]);
    setSummary(s.data);
    setReports(r.data);
    setOfficers(o.data);
    setDocs(d.data);
    setAssessments(a.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateReport = async (type: 'rte' | 'rsa') => {
    setGenerating(type);
    try {
      if (type === 'rte') {
        await api.post('/compliance/reports/rte', { period: new Date().toISOString().slice(0, 7) });
      } else {
        await api.post('/compliance/reports/rsa', { year: new Date().getFullYear().toString() });
      }
      await load();
    } finally { setGenerating(null); }
  };

  const downloadDoc = async (type: 'gap-matrix' | 'compliance-report') => {
    setDownloading(type);
    try {
      const token = localStorage.getItem('simply_token') || localStorage.getItem('simply_employee_token');
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://simply-backend-888610796336.southamerica-east1.run.app/api/v1';
      const res = await window.fetch(`${base}/documents/${type}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simply_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally { setDownloading(null); }
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const statusColor: Record<string, string> = {
    approved:  'text-green-400 bg-green-400/10 border-green-400/20',
    draft:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    generated: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    submitted: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  const checklistData = {
    hasOfficer:        officers.length > 0,
    hasManualAML:      docs.some(d => d.type === 'manual_aml' && d.status === 'approved'),
    hasRiskAssessment: assessments.some(a => a.status === 'approved'),
    hasKycProcedure:   docs.some(d => d.type === 'kyc_procedure'),
    hasPepProcedure:   docs.some(d => d.type === 'pep_procedure'),
    hasTrainingProgram: docs.some(d => d.type === 'training'),
    hasRei:            false,
    hasInternalAudit:  false,
  };

  const requiredOk = UIF_CHECKLIST.filter(i => i.req).filter(i => checklistData[i.key as keyof typeof checklistData]).length;
  const requiredTotal = UIF_CHECKLIST.filter(i => i.req).length;
  const compliancePct = Math.round((requiredOk / requiredTotal) * 100);

  const TABS = [
    { key: 'overview',   label: 'Resumen' },
    { key: 'reports',    label: `Reportes UIF (${reports.length})` },
    { key: 'documents',  label: `Documentos (${docs.length})` },
    { key: 'officers',   label: `Oficiales (${officers.length})` },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Compliance UIF / BCRA</h2>
          <p className="text-gray-500 text-sm mt-0.5">Ley 25.246 · Res. UIF 30/2018 · Com. BCRA A 6885</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadDoc('gap-matrix')} disabled={!!downloading}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs px-3 py-2 rounded-xl transition border border-gray-700">
            {downloading === 'gap-matrix' ? '...' : '▤ Matriz Gap'}
          </button>
          <button onClick={() => downloadDoc('compliance-report')} disabled={!!downloading}
            className="bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 text-purple-400 text-xs px-3 py-2 rounded-xl transition border border-purple-600/30">
            {downloading === 'compliance-report' ? '...' : '◻ Reporte Compliance'}
          </button>
        </div>
      </div>

      {/* Score compliance */}
      <div className={`bg-gray-900/80 border rounded-2xl p-5 ${compliancePct === 100 ? 'border-green-900/30' : compliancePct >= 60 ? 'border-yellow-900/30' : 'border-red-900/30'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-500 text-xs font-medium mb-1">ÍNDICE DE CUMPLIMIENTO NORMATIVO</p>
            <p className={`text-3xl font-bold ${compliancePct === 100 ? 'text-green-400' : compliancePct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {compliancePct}%
            </p>
            <p className="text-gray-600 text-xs mt-1">{requiredOk}/{requiredTotal} requisitos obligatorios cumplidos</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Estado regulatorio</p>
            <p className={`text-sm font-bold mt-1 ${compliancePct === 100 ? 'text-green-400' : compliancePct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {compliancePct === 100 ? '⊛ Compliant' : compliancePct >= 60 ? '⚠ Parcial' : '✗ Incompleto'}
            </p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${compliancePct === 100 ? 'bg-green-500' : compliancePct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${compliancePct}%` }} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Documentos aprobados', value: summary.approvedDocuments || 0, color: 'text-green-400' },
          { label: 'Reportes UIF', value: summary.totalReports || 0, color: 'text-blue-400' },
          { label: 'Oficiales activos', value: summary.activeOfficers || 0, color: 'text-purple-400' },
          { label: 'Evaluaciones riesgo', value: summary.approvedAssessments || 0, color: 'text-cyan-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`text-xs px-4 py-2 rounded-lg transition font-medium ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview — Checklist */}
      {activeTab === 'overview' && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-gray-400 text-sm font-medium">Checklist normativo UIF · BCRA</p>
          </div>
          <div className="divide-y divide-gray-800/50">
            {UIF_CHECKLIST.map(item => {
              const ok = checklistData[item.key as keyof typeof checklistData];
              return (
                <div key={item.key} className={`flex items-center justify-between px-5 py-4 ${!ok && item.req ? 'bg-red-900/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${ok ? 'bg-green-900/40 text-green-400' : item.req ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-600'}`}>
                      {ok ? '✓' : item.req ? '✗' : '○'}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${ok ? 'text-white' : item.req ? 'text-red-300' : 'text-gray-400'}`}>{item.label}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{item.norm}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.req && <span className="text-xs text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full">Obligatorio</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ok ? 'text-green-400 bg-green-400/10 border-green-400/20' : item.req ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                      {ok ? 'Cumple' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => generateReport('rte')} disabled={!!generating}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2">
              {generating === 'rte' ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Generando...</> : '⊕ Generar RTE'}
            </button>
            <button onClick={() => generateReport('rsa')} disabled={!!generating}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2">
              {generating === 'rsa' ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Generando...</> : '⊕ Generar RSA'}
            </button>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800">
              <p className="text-gray-500 text-xs">RTE = Reporte de Transacciones en Efectivo · RSA = Reporte de Sujetos Activos</p>
            </div>
            {reports.length === 0 ? (
              <p className="text-gray-700 text-center py-8 text-sm">Sin reportes generados</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Tipo', 'Período', 'Estado', 'Generado'].map(h => (
                      <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-4 py-3">
                        <span className="text-white font-semibold">{r.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{r.period}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border ${statusColor[r.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          {docs.length === 0 ? (
            <p className="text-gray-700 text-center py-8 text-sm">Sin documentos registrados</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Título', 'Tipo', 'Versión', 'Estado', 'Aprobado'].map(h => (
                    <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-4 py-3 text-white font-medium">{d.title}</td>
                    <td className="px-4 py-3 text-gray-400">{d.type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-500">v{d.version}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border ${statusColor[d.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(d.approvedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Officers */}
      {activeTab === 'officers' && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          {officers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-red-400 text-sm font-medium">⚠ Sin Oficial de Cumplimiento designado</p>
              <p className="text-gray-600 text-xs mt-1">Requerido por Res. UIF 50/2021</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {officers.map(o => (
                <div key={o.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{o.role?.replace('_', ' ')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Res. {o.resolutionNumber || 'Sin número'} · Designado: {fmtDate(o.appointedAt)}</p>
                  </div>
                  <span className="text-green-400 bg-green-400/10 border border-green-400/20 text-xs px-2 py-0.5 rounded-full">Activo</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
