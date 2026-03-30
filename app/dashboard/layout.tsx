'use client';
import { useEffect, useState } from 'react';
import { SecurityProvider } from '@/lib/security';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navSections = [
  {
    title: 'Principal',
    icon: '◈',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: '⊞' },
      { href: '/dashboard/customers', label: 'Customer 360', icon: '◉' },
      { href: '/dashboard/crm', label: 'CRM', icon: '◎' },
    ],
  },
  {
    title: 'Onboarding',
    icon: '◆',
    items: [
      { href: '/dashboard/users', label: 'Usuarios', icon: '○' },
      { href: '/dashboard/kyc', label: 'KYC Review', icon: '◇' },
    ],
  },
  {
    title: 'Operaciones',
    icon: '⬡',
    items: [
      { href: '/dashboard/wallets', label: 'Wallets', icon: '▣' },
      { href: '/dashboard/transfers', label: 'Transferencias', icon: '⇄' },
      { href: '/dashboard/qr', label: 'Pagos QR', icon: '⊡' },
      { href: '/dashboard/investments', label: 'Inversiones', icon: '◈' },
      { href: '/dashboard/credit', label: 'Cupo', icon: '▤' },
      { href: '/dashboard/collections', label: 'Cobranzas', icon: '◫' },
      { href: '/dashboard/loans', label: 'Préstamos', icon: '⊟' },
    ],
  },
  {
    title: 'Riesgo & Compliance',
    icon: '⬟',
    items: [
      { href: '/dashboard/scoring', label: 'Scoring', icon: '◐' },
      { href: '/dashboard/aml', label: 'AML', icon: '⚠' },
      { href: '/dashboard/fraud', label: 'Fraude', icon: '◑' },
      { href: '/dashboard/security', label: 'Seguridad', icon: '⊛' },
      { href: '/dashboard/compliance', label: 'Compliance UIF', icon: '◻' },
    ],
  },
  {
    title: 'Finanzas',
    icon: '▲',
    items: [
      { href: '/dashboard/treasury', label: 'Tesorería', icon: '◈' },
      { href: '/dashboard/reconciliation', label: 'Conciliación', icon: '⇌' },
      { href: '/dashboard/accounting', label: 'Contabilidad', icon: '▦' },
      { href: '/dashboard/company', label: 'Cuentas empresa', icon: '⊞' },
      { href: '/dashboard/ledger', label: 'Ledger', icon: '▤' },
    ],
  },
  {
    title: 'Producto',
    icon: '◇',
    items: [
      { href: '/dashboard/account-levels', label: 'Niveles de Cuenta', icon: '◈' },
      { href: '/dashboard/flags', label: 'Feature Flags', icon: '⚑' },
    ],
  },
  {
    title: 'Regulatorio',
    icon: '⊙',
    items: [
      { href: '/dashboard/psp', label: 'Registro PSP BCRA', icon: '◻' },
    ],
  },
  {
    title: 'Operación interna',
    icon: '⊕',
    items: [
      { href: '/dashboard/support', label: 'Soporte', icon: '◎' },
      { href: '/dashboard/reports', label: 'Reportes', icon: '▤' },
      { href: '/dashboard/audit', label: 'Audit Trail', icon: '◷' },
      { href: '/dashboard/notifications', label: 'Notificaciones', icon: '◉' },
      { href: '/dashboard/employees', label: 'Empleados', icon: '○' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedReady, setCollapsedReady] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('simply_sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);
    setCollapsedReady(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('simply_token');
    const emp = localStorage.getItem('simply_employee');
    if (!token) router.push('/login');
    else { setReady(true); if (emp) setEmployee(JSON.parse(emp)); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('simply_token');
    localStorage.removeItem('simply_employee');
    router.push('/login');
  };

  if (!ready) return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  );

  const initials = employee
    ? `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
    : 'AD';

  return (
    <div className="min-h-screen flex" style={{ background: '#080a0f', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #1f2937 transparent; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
        .nav-item-active { background: linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.08) 100%); border-left: 2px solid #3b82f6; }
        .nav-item-active span { color: #93c5fd; }
        .sidebar-bg { background: linear-gradient(180deg, #0d1117 0%, #080a0f 100%); border-right: 1px solid rgba(255,255,255,0.04); }
        .logo-glow { text-shadow: 0 0 20px rgba(59,130,246,0.5); }
        .section-title { letter-spacing: 0.08em; }
        .nav-hover:hover { background: rgba(255,255,255,0.04); }
        .nav-hover:hover span { color: #e2e8f0; }
        .main-bg { background: radial-gradient(ellipse at top left, rgba(37,99,235,0.03) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(139,92,246,0.02) 0%, transparent 60%), #080a0f; }
        .status-bar { background: linear-gradient(90deg, rgba(37,99,235,0.08) 0%, transparent 100%); border-bottom: 1px solid rgba(255,255,255,0.04); }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar-bg flex flex-col transition-all duration-300 ${collapsed ? 'w-14' : 'w-56'} flex-shrink-0`}>

        {/* Logo */}
        <div className={`flex items-center justify-between p-4 border-b border-white/[0.04] flex-shrink-0`}>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                <span className="text-white font-semibold text-sm tracking-tight logo-glow">Simply</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-0.5 ml-8">PaySur · Panel interno</p>
            </div>
          )}
          <button onClick={() => const next = !collapsed; setCollapsed(next); localStorage.setItem('simply_sidebar_collapsed', String(next))}
            className="text-gray-600 hover:text-gray-300 transition p-1 rounded-lg hover:bg-white/[0.04] ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Status bar */}
        {!collapsed && (
          <div className="status-bar px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-mono">{time.toLocaleTimeString('es-AR')}</span>
            <span className="text-gray-700 text-[10px]">·</span>
            <span className="text-[10px] text-gray-600">Sistema operativo</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <div className="flex items-center gap-1.5 px-2 mb-1.5">
                  <span className="text-[9px] text-gray-600 font-medium section-title uppercase tracking-widest">{section.title}</span>
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-150 nav-hover ${isActive ? 'nav-item-active' : ''}`}>
                    <span className={`text-sm flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>{item.icon}</span>
                    {!collapsed && (
                      <span className={`text-xs font-medium transition-colors truncate ${isActive ? 'text-blue-300' : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                    )}
                    {isActive && !collapsed && <div className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer usuario */}
        <div className="p-3 border-t border-white/[0.04] flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition cursor-pointer group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {employee ? `${employee.firstName} ${employee.lastName}` : 'Administrador'}
                </p>
                <p className="text-gray-600 text-[10px] truncate">{employee?.role || 'admin'}</p>
              </div>
              <button onClick={handleLogout} title="Cerrar sesión"
                className="text-gray-600 hover:text-red-400 transition text-xs">
                ⏻
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Cerrar sesión"
              className="w-full flex justify-center py-2 text-gray-600 hover:text-red-400 transition text-sm">
              ⏻
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <SecurityProvider>
      <div className="flex-1 flex flex-col overflow-hidden main-bg">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-xs">/</span>
            <span className="text-gray-400 text-xs font-medium">
              {navSections.flatMap(s => s.items).find(i => i.href === pathname)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="text-gray-600 hover:text-gray-300 transition text-sm">◉</Link>
            <Link href="/dashboard/support" className="text-gray-600 hover:text-gray-300 transition text-sm">◎</Link>
            <div className="w-px h-4 bg-gray-800" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-600 text-[10px] font-mono">PROD</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      </SecurityProvider>
    </div>
  );
}
