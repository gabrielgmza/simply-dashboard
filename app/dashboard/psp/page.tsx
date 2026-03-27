'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PspPage() {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    legalName: 'PaySur S.A.',
    cuit: '',
    legalAddress: '',
    phone: '',
    email: '',
    website: 'https://simply.com.ar',
    functions: ['pspcp'],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/psp/registration').then(r => {
      if (r.data) { setRegistration(r.data); setForm(r.data); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await api.post('/psp/registration', form);
    setRegistration(r.data);
    setSaving(false);
  };

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    registered: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl font-semibold">Registro PSP — BCRA</h2>

      {registration && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm font-medium">Estado de inscripción</p>
            <span className={`text-xs px-3 py-1.5 rounded-full ${statusColor[registration.registrationStatus] || 'text-gray-400 bg-gray-400/10'}`}>
              {registration.registrationStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Razón social</p><p className="text-white">{registration.legalName}</p></div>
            <div><p className="text-gray-500">CUIT</p><p className="text-white">{registration.cuit}</p></div>
            <div><p className="text-gray-500">Funciones declaradas</p><p className="text-white">{registration.functions?.join(', ')}</p></div>
            <div><p className="text-gray-500">N° registro BCRA</p><p className="text-white">{registration.bcraRegistrationNumber || '—'}</p></div>
          </div>
        </div>
      )}

      <form onSubmit={save} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm font-medium mb-4">{registration ? 'Actualizar datos' : 'Registrar PSP'}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-500 text-xs block mb-1">Razón social</label>
            <input value={form.legalName} onChange={e => setForm({...form, legalName: e.target.value})}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          </div>
          <div>
            <label className="text-gray-500 text-xs block mb-1">CUIT</label>
            <input value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          </div>
          <div>
            <label className="text-gray-500 text-xs block mb-1">Email</label>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          </div>
          <div>
            <label className="text-gray-500 text-xs block mb-1">Teléfono</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" />
          </div>
          <div className="col-span-2">
            <label className="text-gray-500 text-xs block mb-1">Domicilio legal</label>
            <input value={form.legalAddress} onChange={e => setForm({...form, legalAddress: e.target.value})}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          </div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
