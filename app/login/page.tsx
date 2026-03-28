'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/employees/auth/login', {
        email,
        password,
        ...(requiresMfa && { mfaToken }),
      });

      if (data.requiresMfa) {
        setRequiresMfa(true);
        setLoading(false);
        return;
      }

      localStorage.setItem('simply_token', data.access_token);
      localStorage.setItem('simply_employee', JSON.stringify(data.employee));
      router.push('/dashboard');
    } catch {
      setError(requiresMfa ? 'Código MFA inválido' : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border border-gray-800">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Simply</h1>
          <p className="text-gray-400 text-sm mt-1">Panel interno PaySur</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {!requiresMfa ? (
            <>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Email corporativo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500" required />
              </div>
            </>
          ) : (
            <div>
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm font-medium">Verificación en dos pasos</p>
                <p className="text-gray-400 text-xs mt-1">Ingresá el código de 6 dígitos de tu aplicación autenticadora</p>
              </div>
              <label className="text-sm text-gray-400 block mb-1">Código MFA</label>
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition disabled:opacity-50">
            {loading ? 'Verificando...' : requiresMfa ? 'Verificar' : 'Ingresar'}
          </button>
          {requiresMfa && (
            <button type="button" onClick={() => { setRequiresMfa(false); setMfaToken(''); setError(''); }}
              className="w-full text-gray-500 hover:text-gray-400 text-sm py-1 transition">
              Volver
            </button>
          )}
        </form>
        <p className="text-gray-600 text-xs text-center mt-6">Acceso exclusivo para empleados de PaySur</p>
      </div>
    </div>
  );
}
