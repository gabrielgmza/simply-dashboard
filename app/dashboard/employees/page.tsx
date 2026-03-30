'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRequirePin } from '@/lib/security';

const ROLES = ['super_admin','kyc_analyst','compliance_analyst','risk_analyst','fraud_analyst','financial_operator','support_operator','accounting_admin','product_admin','access_admin'];

const roleColor: Record<string, string> = {
  super_admin: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  kyc_analyst: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  compliance_analyst: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  fraud_analyst: 'text-red-400 bg-red-400/10 border-red-400/20',
  financial_operator: 'text-green-400 bg-green-400/10 border-green-400/20',
  support_operator: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  risk_analyst: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  accounting_admin: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  product_admin: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  access_admin: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'support_operator' });
  const requirePin = useRequirePin();

  const load = () => api.get('/employees').then(r => { setEmployees(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requirePin('Crear nuevo empleado');
    if (!ok) return;
    setSubmitting(true);
    await api.post('/employees', form).catch(() => {});
    setShowForm(false);
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'support_operator' });
    load();
    setSubmitting(false);
  };

  const toggle = async (id: string, active: boolean) => {
    const ok = await requirePin(`${active ? 'Desactivar' : 'Activar'} empleado`);
    if (!ok) return;
    await api.put(`/employees/${id}/toggle`).catch(() => {});
    load();
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca';

  const filtered = employees
    .filter(e => filterRole === 'all' || e.role === filterRole)
    .filter(e => e.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.active).length,
    inactive: employees.filter(e => !e.active).length,
    mfa: employees.filter(e => e.mfaEnabled).length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Empleados</h2>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de accesos y roles internos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
          ⊕ Nuevo empleado
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total empleados', value: stats.total, color: 'text-white' },
          { label: 'Activos', value: stats.active, color: 'text-green-400' },
          { label: 'Inactivos', value: stats.inactive, color: 'text-red-400' },
          { label: 'Con MFA activo', value: stats.mfa, color: 'text-blue-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900/80 border border-blue-500/30 rounded-2xl p-5 space-y-3">
          <p className="text-white text-sm font-semibold mb-2">Nuevo empleado</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
              placeholder="Nombre" required
              className="bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
              placeholder="Apellido" required
              className="bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="Email corporativo" type="email" required
              className="bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Contraseña inicial" type="password" required minLength={8}
              className="bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="col-span-2 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition">
              {submitting ? 'Creando...' : 'Crear empleado'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-xl transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-3">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-400 text-xs rounded-xl px-3 py-2 outline-none">
          <option value="all">Todos los roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="flex-1 bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Empleado', 'Rol', 'MFA', 'Último acceso', 'Estado', 'Acción'].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-700 py-8">Sin empleados</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {e.firstName?.[0]}{e.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{e.firstName} {e.lastName}</p>
                      <p className="text-gray-500">{e.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${roleColor[e.role] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                    {e.role?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.mfaEnabled
                    ? <span className="text-green-400 text-xs">✓ Activo</span>
                    : <span className="text-red-400 text-xs">✗ Inactivo</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(e.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${e.active ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                    {e.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(e.id, e.active)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${e.active ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}>
                    {e.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
