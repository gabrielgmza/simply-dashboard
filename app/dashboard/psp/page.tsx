'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PspPage() {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    legalName: 'PaySur S.A.',
    cuit: '',
    legalAddress: '',
    phone: '',
    email: '',
    website: 'https://simply.com.ar',
    functions: ['pspcp'],
  });

  useEffect(() => {
    api.get('/psp/registration').then(r => {
      if (r.data) { setRegistration(r.data); setForm(r.data); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await api.post('/psp/registration', form).catch(() => null);
    if (r) { setRegistration(r.data); setEditing(false); }
    setSaving(false);
  };

  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
    pending:     { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-900/30', label: 'Pendiente de envío', desc: 'La inscripción no ha sido enviada al SEFyC' },
    in_progress: { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-900/30',   label: 'En proceso',        desc: 'El BCRA está evaluando la solicitud' },
    registered:  { color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-900/30',  label: 'Registrado',        desc: 'PSP inscripto en el Registro de PSP del BCRA' },
    rejected:    { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-900/30',    label: 'Rechazado',         desc: 'La solicitud fue rechazada por el SEFyC' },
  };

  const cfg = statusConfig[registration?.registrationStatus] || statusConfig.pending;

  const BCRA_STEPS = [
    { step: '1', label: 'Constitución societaria', desc: 'S.A. o S.R.L. inscripta en IGJ/registro provincial', done: true },
    { step: '2', label: 'Habilitación BCRA (SEFyC)', desc: 'Formulario de inscripción como PSPCP', done: registration?.registrationStatus === 'registered' },
    { step: '3', label: 'Inscripción UIF', desc: 'Sujeto obligado · Designar Oficial de Cumplimiento', done: false },
    { step: '4', label: 'Revisión externa (REI)', desc: 'Revisor Externo Independiente designado', done: false },
    { step: '5', label: 'Manual AML aprobado', desc: 'Manual de prevención de LA/FT', done: false },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">Registro PSP — BCRA</h2>
        <p className="text-gray-500 text-sm mt-0.5">Proveedor de Servicios de Pago · Com. A 6885 SEFyC</p>
      </div>

      {/* Estado actual */}
      <div className={`bg-gray-900/80 border rounded-2xl p-5 ${cfg.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-500 text-xs font-medium mb-1">Estado de inscripción BCRA</p>
            <span className={`text-xs px-3 py-1.5 rounded-full ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
          </div>
          {registration?.bcraRegistrationNumber && (
            <div className="text-right">
              <p className="text-gray-500 text-xs">N° Registro BCRA</p>
              <p className="text-white font-mono text-sm mt-0.5">{registration.bcraRegistrationNumber}</p>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-xs">{cfg.desc}</p>
      </div>

      {/* Datos registrados */}
      {registration && !editing && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="text-gray-400 text-sm font-medium">Datos de inscripción</p>
            <button onClick={() => setEditing(true)} className="text-blue-400 hover:text-blue-300 text-xs transition">Editar →</button>
          </div>
          <div className="grid grid-cols-2 gap-0">
            {[
              { label: 'Razón social', value: registration.legalName },
              { label: 'CUIT', value: registration.cuit },
              { label: 'Email', value: registration.email },
              { label: 'Teléfono', value: registration.phone },
              { label: 'Domicilio legal', value: registration.legalAddress },
              { label: 'Sitio web', value: registration.website },
              { label: 'Funciones declaradas', value: registration.functions?.join(', ') },
            ].map((f, i) => (
              <div key={i} className="px-5 py-3 border-b border-gray-800/50">
                <p className="text-gray-500 text-xs">{f.label}</p>
                <p className="text-white text-sm mt-0.5">{f.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {(!registration || editing) && (
        <form onSubmit={save} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-4">
          <p className="text-white text-sm font-semibold">{registration ? 'Actualizar datos' : 'Registrar PSP'}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Razón social', key: 'legalName', type: 'text' },
              { label: 'CUIT', key: 'cuit', type: 'text' },
              { label: 'Email institucional', key: 'email', type: 'email' },
              { label: 'Teléfono', key: 'phone', type: 'text' },
              { label: 'Sitio web', key: 'website', type: 'url' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-gray-500 text-xs block mb-1">{field.label}</label>
                <input value={(form as any)[field.key]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                  type={field.type}
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-gray-500 text-xs block mb-1">Domicilio legal</label>
              <input value={form.legalAddress} onChange={e => setForm({...form, legalAddress: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-xl transition">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="bg-gray-800 text-gray-400 hover:text-white text-sm px-5 py-2.5 rounded-xl transition">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Checklist BCRA */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <p className="text-gray-400 text-sm font-medium mb-4">Checklist regulatorio · Ruta a PSPCP</p>
        <div className="space-y-3">
          {BCRA_STEPS.map(step => (
            <div key={step.step} className={`flex items-start gap-3 p-3 rounded-xl ${step.done ? 'bg-green-900/20 border border-green-900/30' : 'bg-gray-800/40'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${step.done ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {step.done ? '✓' : step.step}
              </div>
              <div>
                <p className={`text-sm font-medium ${step.done ? 'text-green-400' : 'text-white'}`}>{step.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
