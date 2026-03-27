'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const ROLES = ['super_admin','kyc_analyst','compliance_analyst','risk_analyst','fraud_analyst','financial_operator','support_operator','accounting_admin','product_admin','access_admin'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'support_operator' });

  const fetch = () => api.get('/employees').then(r => { setEmployees(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/employees', form);
    setShowForm(false);
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'support_operator' });
    fetch();
  };

  const toggle = async (id: string) => {
    await api.put(`/employees/${id}/toggle`);
    fetch();
  };

  const roleColor: Record<string, string> = {
    super_admin: 'text-purple-400 bg-purple-400/10',
    kyc_analyst: 'text-blue-400 bg-blue-400/10',
    compliance_analyst: 'text-orange-400 bg-orange-400/10',
    fraud_analyst: 'text-red-400 bg-red-400/10',
    financial_operator: 'text-green-400 bg-green-400/10',
    support_operator: 'text-gray-400 bg-gray-400/10',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Empleados</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
          + Nuevo empleado
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Nombre"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Apellido"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Contraseña" type="password"
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700" required />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 col-span-2">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white rounded-lg py-2 text-sm">Crear</button>
          <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 text-white rounded-lg py-2 text-sm">Cancelar</button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Empleado</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Rol</th>
              <th className="text-left text-gray-400 px-4 py-3 font-medium">Último acceso</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Estado</th>
              <th className="text-center text-gray-400 px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <p className="text-white">{e.firstName} {e.lastName}</p>
                  <p className="text-gray-500 text-xs">{e.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${roleColor[e.role] || 'text-gray-400 bg-gray-400/10'}`}>{e.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {e.lastLoginAt ? new Date(e.lastLoginAt).toLocaleString('es-AR') : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${e.active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {e.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(e.id)} className="text-xs text-gray-400 hover:text-white transition">
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
