'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navSections = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Inicio' },
      { href: '/dashboard/customers', label: 'Customer 360' },
    ],
  },
  {
    title: 'Onboarding',
    items: [
      { href: '/dashboard/users', label: 'Usuarios' },
      { href: '/dashboard/kyc', label: 'KYC Review' },
      { href: '/dashboard/profiles', label: 'Perfiles' },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/dashboard/wallets', label: 'Wallets' },
      { href: '/dashboard/transfers', label: 'Transferencias' },
      { href: '/dashboard/investments', label: 'Inversiones' },
      { href: '/dashboard/credit', label: 'Crédito' },
      { href: '/dashboard/collections', label: 'Cobranzas' },
    ],
  },
  {
    title: 'Riesgo & Compliance',
    items: [
      { href: '/dashboard/scoring', label: 'Scoring' },
      { href: '/dashboard/aml', label: 'AML' },
      { href: '/dashboard/fraud', label: 'Fraude' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/dashboard/treasury', label: 'Tesorería' },
      { href: '/dashboard/reconciliation', label: 'Conciliación' },
      { href: '/dashboard/ledger', label: 'Ledger' },
    ],
  },
  {
    title: 'Operación interna',
    items: [
      { href: '/dashboard/support', label: 'Soporte' },
      { href: '/dashboard/audit', label: 'Audit Trail' },
      { href: '/dashboard/notifications', label: 'Notificaciones' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('simply_token');
    if (!token) router.push('/login');
    else setReady(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('simply_token');
    router.push('/login');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-white font-bold text-lg">Simply</h1>
          <p className="text-gray-500 text-xs mt-0.5">Panel interno PaySur</p>
        </div>
        <nav className="flex-1 p-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-gray-600 text-xs font-medium px-2 mb-1 uppercase tracking-wider">{section.title}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-1.5 rounded-lg text-sm transition mb-0.5 ${
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
