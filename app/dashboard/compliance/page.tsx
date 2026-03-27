'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CompliancePage() {
  const [summary, setSummary] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = async () => {
    const [s, r, o, d, a] = await Promise.all([
      api.get('/compliance/summary'),
      api.get('/compliance/reports'),
      api.get('/compliance/officers'),
      api.get('/compliance/documents'),
      api.get('/compliance/risk-assessments'),
    ]);
    setSummary(s.data);
    setReports(r.data);
    setOfficers(o.data);
    setDocs(d.data);
    setAssessments(a.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const generateRTE = async () => {
    setGenerating(true);
    const period = new Date().toISOString().slice(0, 7);
    await api.post('/compliance/reports/rte', { period });
    await fetch();
    setGenerating(false);
  };

  const generateRSA = async () => {
    setGenerating(true);
    const year = new Date().getFullYear().toString();
    await api.post('/compliance/reports/rsa', { year });
    await fetch();
    setGenerating(false);
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  const statusColor: Record<string, string> = {
    approved: 'text-green-400 bg-green-400/10',
    draft: 'text-yellow-400 bg-yellow-400/10',
    generated: 'text-blue-400 bg-blue-400/10',
    submitted: 'text-green-400 bg-green-400/10',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl font-semibold">Compliance UIF / BCRA</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className={`bg-gray-900 border rounded-xl p-4 ${summary.hasOfficer ? 'border-green-800' : 'border-red-800'}`}>
          <p className="text-gray-400 text-xs">Oficial de Cumplimiento</p>
          <p className={`text-sm font-bold mt-1 ${summary.hasOfficer ? 'text-green-400' : 'text-red-400'}`}>{summary.hasOfficer ? '✓ Designado' : '✗ Falta'}</p>
        </div>
        <div className={`bg-gray-900 border rounded-xl p-4 ${summary.hasManualAML ? 'border-green-800' : 'border-red-800'}`}>
          <p className="text-gray-400 text-xs">Manual AML</p>
          <p className={`text-sm font-bold mt-1 ${summary.hasManualAML ? 'text-green-400' : 'text-red-400'}`}>{summary.hasManualAML ? '✓ Presente' : '✗ Falta'}</p>
        </div>
        <div className={`bg-gray-900 border rounded-xl p-4 ${summary.hasRiskAssessment ? 'border-green-800' : 'border-red-800'}`}>
          <p className="text-gray-400 text-xs">Autoevaluación riesgos</p>
          <p className={`text-sm font-bold mt-1 ${summary.hasRiskAssessment ? 'text-green-400' : 'text-red-400'}`}>{summary.hasRiskAssessment ? '✓ Aprobada' : '✗ Falta'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs">Reportes UIF</p>
          <p className="text-white text-sm font-bold mt-1">{summary.totalReports || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm font-medium">Reportes UIF</p>
            <div className="flex gap-2">
              <button onClick={generateRTE} disabled={generating} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                {generating ? '...' : 'RTE'}
              </button>
              <button onClick={generateRSA} disabled={generating} className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                {generating ? '...' : 'RSA'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {reports.length === 0 && <p className="text-gray-500 text-sm">Sin reportes</p>}
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <div>
                  <p className="text-white text-sm">{r.type} — {r.period}</p>
                  <p className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString('es-AR')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-4">Documentos compliance</p>
          <div className="space-y-2">
            {docs.length === 0 && <p className="text-gray-500 text-sm">Sin documentos</p>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <div>
                  <p className="text-white text-sm">{d.title}</p>
                  <p className="text-gray-500 text-xs">v{d.version} · {d.type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[d.status]}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {officers.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Oficiales de Cumplimiento</p>
          <div className="space-y-2">
            {officers.map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <p className="text-white text-sm">{o.role} — {o.resolutionNumber || 'Sin resolución'}</p>
                <p className="text-gray-500 text-xs">{new Date(o.appointedAt).toLocaleDateString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
