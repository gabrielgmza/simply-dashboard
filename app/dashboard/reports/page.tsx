'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { exportCSV, exportPDF, fmt } from '@/lib/reports';

const REPORTS = [
  {
    id: 'transfers',
    label: 'Transferencias',
    desc: 'Historial completo de transferencias CVU',
    icon: '⇄',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'users',
    label: 'Usuarios',
    desc: 'Directorio de clientes registrados',
    icon: '○',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    id: 'aml',
    label: 'Alertas AML',
    desc: 'Alertas de prevención de lavado · UIF',
    icon: '⚠',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    desc: 'Saldos y estado de billeteras',
    icon: '▣',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    id: 'loans',
    label: 'Préstamos',
    desc: 'Cartera crediticia completa',
    icon: '⊟',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'kyc',
    label: 'KYC',
    desc: 'Estado de verificaciones de identidad',
    icon: '◇',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    id: 'investments',
    label: 'Inversiones',
    desc: 'Posiciones y órdenes de inversión',
    icon: '◈',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    id: 'collections',
    label: 'Cobranzas',
    desc: 'Cuotas y estado de cartera en mora',
    icon: '◫',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({});

  const generate = async (reportId: string, format: 'csv' | 'pdf') => {
    setGenerating(`${reportId}-${format}`);
    try {
      switch (reportId) {
        case 'transfers': {
          const r = await api.get('/transfers/all');
          const data = r.data;
          const headers = ['Fecha', 'Origen', 'Destino', 'Descripción', 'Estado', 'Monto ARS'];
          const rows = data.map((t: any) => [
            new Date(t.createdAt).toLocaleString('es-AR'),
            t.fromWalletId?.slice(0, 12),
            t.toWalletId?.slice(0, 12),
            t.description || '',
            t.status,
            fmt(t.amount),
          ]);
          const summary = [
            { label: 'Total transferencias', value: data.length.toString() },
            { label: 'Volumen total', value: fmt(data.reduce((s: number, t: any) => s + Number(t.amount || 0), 0)) },
            { label: 'Completadas', value: data.filter((t: any) => t.status === 'completed').length.toString() },
          ];
          if (format === 'csv') exportCSV('transferencias', headers, rows);
          else exportPDF('Reporte de Transferencias', 'transferencias', headers, rows, summary);
          break;
        }
        case 'users': {
          const r = await api.get('/users');
          const data = r.data;
          const headers = ['Email', 'Teléfono', 'Estado', 'Fecha registro'];
          const rows = data.map((u: any) => [
            u.email, u.phone || '', u.status,
            new Date(u.createdAt).toLocaleDateString('es-AR'),
          ]);
          const summary = [
            { label: 'Total usuarios', value: data.length.toString() },
            { label: 'Activos', value: data.filter((u: any) => u.status === 'active').length.toString() },
            { label: 'Pendientes verificación', value: data.filter((u: any) => u.status === 'pending_verification').length.toString() },
          ];
          if (format === 'csv') exportCSV('usuarios', headers, rows);
          else exportPDF('Reporte de Usuarios', 'usuarios', headers, rows, summary);
          break;
        }
        case 'aml': {
          const r = await api.get('/aml/alerts');
          const data = r.data;
          const headers = ['Fecha', 'Usuario ID', 'Regla', 'Severidad', 'Estado', 'Monto ARS'];
          const rows = data.map((a: any) => [
            new Date(a.createdAt).toLocaleString('es-AR'),
            a.userId?.slice(0, 12),
            a.ruleName,
            a.severity,
            a.status,
            fmt(a.amount),
          ]);
          const summary = [
            { label: 'Total alertas', value: data.length.toString() },
            { label: 'Críticas', value: data.filter((a: any) => a.severity === 'critical').length.toString() },
            { label: 'Abiertas', value: data.filter((a: any) => a.status === 'open').length.toString() },
          ];
          if (format === 'csv') exportCSV('alertas_aml', headers, rows);
          else exportPDF('Reporte AML · UIF', 'alertas_aml', headers, rows, summary);
          break;
        }
        case 'wallets': {
          const r = await api.get('/wallets');
          const data = r.data;
          const headers = ['Email', 'CVU', 'Alias', 'Estado', 'Saldo ARS', 'En tránsito'];
          const rows = data.map((w: any) => [
            w.email, w.cvu || '', w.alias || '', w.status,
            fmt(w.available), fmt(w.pending),
          ]);
          const summary = [
            { label: 'Total wallets', value: data.length.toString() },
            { label: 'Fondos totales', value: fmt(data.reduce((s: number, w: any) => s + Number(w.available || 0), 0)) },
            { label: 'En tránsito', value: fmt(data.reduce((s: number, w: any) => s + Number(w.pending || 0), 0)) },
          ];
          if (format === 'csv') exportCSV('wallets', headers, rows);
          else exportPDF('Reporte de Wallets', 'wallets', headers, rows, summary);
          break;
        }
        case 'loans': {
          const r = await api.get('/loans/all');
          const data = r.data;
          const headers = ['ID Externo', 'Tipo', 'Estado', 'Monto ARS', 'Cuotas', 'TNA', 'Fecha'];
          const rows = data.map((l: any) => [
            l.externalId || l.id?.slice(0, 8),
            l.type?.toUpperCase(),
            l.status,
            fmt(l.amount),
            `${l.installments}x ${fmt(l.installmentAmount)}`,
            l.interestRate ? `${l.interestRate}%` : '',
            new Date(l.createdAt).toLocaleDateString('es-AR'),
          ]);
          const summary = [
            { label: 'Total préstamos', value: data.length.toString() },
            { label: 'Cartera activa', value: fmt(data.filter((l: any) => l.status === 'active').reduce((s: number, l: any) => s + Number(l.amount || 0), 0)) },
            { label: 'En mora', value: data.filter((l: any) => l.status === 'overdue').length.toString() },
          ];
          if (format === 'csv') exportCSV('prestamos', headers, rows);
          else exportPDF('Reporte de Préstamos', 'prestamos', headers, rows, summary);
          break;
        }
        case 'kyc': {
          const r = await api.get('/kyc/all').catch(() => api.get('/kyc/pending'));
          const data = r.data;
          const headers = ['Usuario ID', 'Estado', 'Score RENAPER', 'Enviado', 'Revisado', 'Notas'];
          const rows = data.map((k: any) => [
            k.userId?.slice(0, 12),
            k.status,
            k.renaperScore ? `${k.renaperScore}%` : '',
            k.submittedAt ? new Date(k.submittedAt).toLocaleDateString('es-AR') : '',
            k.reviewedAt ? new Date(k.reviewedAt).toLocaleDateString('es-AR') : '',
            k.reviewerNotes || '',
          ]);
          const summary = [
            { label: 'Total casos', value: data.length.toString() },
            { label: 'Aprobados', value: data.filter((k: any) => k.status === 'approved').length.toString() },
            { label: 'Pendientes', value: data.filter((k: any) => ['submitted', 'under_review', 'pending'].includes(k.status)).length.toString() },
          ];
          if (format === 'csv') exportCSV('kyc', headers, rows);
          else exportPDF('Reporte KYC · RENAPER', 'kyc', headers, rows, summary);
          break;
        }
        case 'investments': {
          const r = await api.get('/investment/all');
          const data = r.data?.positions || [];
          const headers = ['Instrumento', 'Tipo', 'Unidades', 'Monto ARS', 'Colateral', 'Actualizado'];
          const rows = data.map((p: any) => [
            p.instrumentName, p.instrumentType?.toUpperCase(),
            Number(p.units).toFixed(4), fmt(p.amount),
            p.isCollateralEligible ? 'Sí' : 'No',
            new Date(p.updatedAt).toLocaleDateString('es-AR'),
          ]);
          const summary = [
            { label: 'Posiciones', value: data.length.toString() },
            { label: 'Total invertido', value: fmt(r.data?.totalInvested) },
            { label: 'Cuentas activas', value: (r.data?.totalAccounts || 0).toString() },
          ];
          if (format === 'csv') exportCSV('inversiones', headers, rows);
          else exportPDF('Reporte de Inversiones', 'inversiones', headers, rows, summary);
          break;
        }
        case 'collections': {
          const r = await api.get('/collections/all').catch(() => api.get('/collections/history'));
          const data = r.data;
          const headers = ['Cuota N°', 'Vencimiento', 'Estado', 'Monto ARS', 'Total c/recargo', 'Pagado'];
          const rows = data.map((i: any) => [
            `#${i.number}`,
            new Date(i.dueDate).toLocaleDateString('es-AR'),
            i.status,
            fmt(i.amount),
            fmt(i.totalDue || i.amount),
            i.paidAt ? new Date(i.paidAt).toLocaleDateString('es-AR') : '',
          ]);
          const summary = [
            { label: 'Total cuotas', value: data.length.toString() },
            { label: 'En mora', value: data.filter((i: any) => i.status === 'overdue').length.toString() },
            { label: 'Monto mora', value: fmt(data.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.amount || 0), 0)) },
          ];
          if (format === 'csv') exportCSV('cobranzas', headers, rows);
          else exportPDF('Reporte de Cobranzas', 'cobranzas', headers, rows, summary);
          break;
        }
      }
      setLastGenerated(prev => ({ ...prev, [reportId]: new Date().toLocaleTimeString('es-AR') }));
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Reportes & Exportación</h2>
        <p className="text-gray-500 text-sm mt-0.5">Exportá datos en CSV o PDF con formato institucional</p>
      </div>

      <div className="bg-gray-900/80 border border-blue-900/30 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-blue-400 text-lg">⊙</span>
        <p className="text-blue-400 text-sm">Los reportes PDF incluyen encabezado institucional Simply by PaySur con fecha de generación y referencia regulatoria BCRA/UIF.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {REPORTS.map(report => (
          <div key={report.id} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${report.bg} flex items-center justify-center`}>
                  <span className={`${report.color} text-lg`}>{report.icon}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{report.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{report.desc}</p>
                </div>
              </div>
              {lastGenerated[report.id] && (
                <span className="text-gray-600 text-xs">Último: {lastGenerated[report.id]}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generate(report.id, 'csv')}
                disabled={!!generating}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                {generating === `${report.id}-csv`
                  ? <><span className="w-3 h-3 border border-gray-500 border-t-white rounded-full animate-spin" />Generando...</>
                  : <>▤ Exportar CSV</>}
              </button>
              <button
                onClick={() => generate(report.id, 'pdf')}
                disabled={!!generating}
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 border border-blue-600/30 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                {generating === `${report.id}-pdf`
                  ? <><span className="w-3 h-3 border border-blue-500 border-t-blue-200 rounded-full animate-spin" />Generando...</>
                  : <>◻ Exportar PDF</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
