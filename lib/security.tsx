'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const WARNING_BEFORE = 2 * 60 * 1000; // advertir 2 min antes
const CRITICAL_PIN = '1234'; // en producción esto debería venir del backend

interface SecurityContextType {
  requirePin: (action: string) => Promise<boolean>;
  sessionRemaining: number;
  resetActivity: () => void;
}

const SecurityContext = createContext<SecurityContextType>({
  requirePin: async () => false,
  sessionRemaining: INACTIVITY_TIMEOUT,
  resetActivity: () => {},
});

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sessionRemaining, setSessionRemaining] = useState(INACTIVITY_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);
  const [pinModal, setPinModal] = useState<{ action: string; resolve: (v: boolean) => void } | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const lastActivity = useRef(Date.now());
  const timerRef = useRef<any>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('simply_token');
    localStorage.removeItem('simply_employee');
    router.push('/login');
  }, [router]);

  const resetActivity = useCallback(() => {
    lastActivity.current = Date.now();
    setShowWarning(false);
    setSessionRemaining(INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handler = () => resetActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [resetActivity]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed);
      setSessionRemaining(remaining);
      if (remaining <= WARNING_BEFORE && remaining > 0) setShowWarning(true);
      if (remaining === 0) logout();
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [logout]);

  const requirePin = useCallback((action: string): Promise<boolean> => {
    return new Promise(resolve => {
      setPin('');
      setPinError('');
      setPinModal({ action, resolve });
    });
  }, []);

  const submitPin = () => {
    if (pin === CRITICAL_PIN) {
      pinModal?.resolve(true);
      setPinModal(null);
      setPin('');
      setPinError('');
    } else {
      setPinError('PIN incorrecto');
      setPin('');
    }
  };

  const cancelPin = () => {
    pinModal?.resolve(false);
    setPinModal(null);
    setPin('');
    setPinError('');
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <SecurityContext.Provider value={{ requirePin, sessionRemaining, resetActivity }}>
      {children}

      {/* Warning inactividad */}
      {showWarning && sessionRemaining > 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-orange-500/40 rounded-2xl p-4 shadow-2xl max-w-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 text-sm">⚠</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Sesión por expirar</p>
              <p className="text-gray-400 text-xs mt-0.5">Tu sesión cerrará en <span className="text-orange-400 font-mono font-bold">{fmt(sessionRemaining)}</span></p>
              <button onClick={resetActivity}
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition w-full">
                Continuar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 text-xl">⊛</span>
              </div>
              <h3 className="text-white font-semibold">Verificación requerida</h3>
              <p className="text-gray-500 text-xs mt-1">{pinModal.action}</p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? 'bg-blue-400 scale-110' : 'bg-gray-700'}`} />
              ))}
            </div>

            {pinError && <p className="text-red-400 text-xs text-center mb-3">{pinError}</p>}

            {/* Teclado numérico */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                <button key={i} onClick={() => {
                  if (k === '⌫') { setPin(p => p.slice(0,-1)); setPinError(''); }
                  else if (k !== '' && pin.length < 4) { const np = pin + k; setPin(np); if (np.length === 4) setTimeout(() => { if (np === CRITICAL_PIN) { pinModal.resolve(true); setPinModal(null); setPin(''); setPinError(''); } else { setPinError('PIN incorrecto'); setPin(''); }}, 100); }
                }}
                  disabled={k === ''}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all ${k === '' ? 'cursor-default' : 'bg-gray-800 hover:bg-gray-700 text-white active:scale-95'}`}>
                  {k}
                </button>
              ))}
            </div>

            <button onClick={cancelPin} className="w-full text-gray-500 hover:text-gray-300 text-xs py-2 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);
export const useRequirePin = () => useContext(SecurityContext).requirePin;
