'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AccountLevelsPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLevels = () => api.get('/account-levels').then(r => { setLevels(r.data); setLoading(false); });
  useEffect(() => { fetchLevels(); }, []);

  const save = async () => {
    setSaving(true);
    await api.put(`/account-levels/${editing.id}`, editing);
    setEditing(null);
    setSaving(false);
    fetchLevels();
  };

  const fmt = (v: any) => Number(v).toLocaleString('es-AR');
  const pct = (v: any) => `${(Number(v) * 100).toFixed(2)}%`;

  const levelColors: Record<string, string> = {
    standard: 'border-gray-600',
    plata: 'border-gray-400',
    oro: 'border-yellow-500',
    platino: 'border-blue-400',
    black_diamond: 'border-purple-500',
  };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Niveles de Cuenta</h2>

      {editing ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl">
          <h3 className="text-white font-semibold mb-4">Editando: {editing.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'scaTransferThreshold', label: 'Umbral SCA ($)' },
              { key: 'dailyTransferLimit', label: 'Límite diario ($)' },
              { key: 'monthlyTransferLimit', label: 'Límite mensual ($)' },
              { key: 'dailyWithdrawalLimit', label: 'Límite retiro diario ($)' },
              { key: 'investmentYieldPct', label: 'Rendimiento inversión (0.05 = 5%)' },
              { key: 'loanInterestPct', label: 'Tasa préstamo (0.08 = 8%)' },
              { key: 'cashbackPct', label: 'Cashback (0.01 = 1%)' },
              { key: 'financedPct', label: 'Financiado disponible (0.5 = 50%)' },
              { key: 'pointsMultiplier', label: 'Multiplicador puntos' },
              { key: 'discountPct', label: 'Descuento (0.1 = 10%)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-gray-400 text-xs block mb-1">{label}</label>
                <input
                  type="number"
                  step="any"
                  value={editing[key]}
                  onChange={e => setEditing({ ...editing, [key]: e.target.value })}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
            {[
              { key: 'prioritySupport', label: 'Soporte prioritario' },
              { key: 'dedicatedAdvisor', label: 'Asesor dedicado' },
              { key: 'virtualCard', label: 'Tarjeta virtual' },
              { key: 'physicalCard', label: 'Tarjeta física' },
              { key: 'blackCard', label: 'Black card' },
              { key: 'scaWithdrawalEnabled', label: 'SCA en retiros' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editing[key]}
                  onChange={e => setEditing({ ...editing, [key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-gray-400 text-sm">{label}</label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={() => setEditing(null)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {levels.map(level => (
            <div key={level.id} className={`bg-gray-900 border-l-4 ${levelColors[level.code] || 'border-gray-600'} border border-gray-800 rounded-xl p-5`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{level.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">código: {level.code}</p>
                </div>
                <button onClick={() => setEditing({ ...level })} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Umbral SCA</p>
                  <p className="text-white font-medium">${fmt(level.scaTransferThreshold)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Límite diario</p>
                  <p className="text-white font-medium">${fmt(level.dailyTransferLimit)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Rendimiento</p>
                  <p className="text-white font-medium">{pct(level.investmentYieldPct)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Tasa préstamo</p>
                  <p className="text-white font-medium">{pct(level.loanInterestPct)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Cashback</p>
                  <p className="text-white font-medium">{pct(level.cashbackPct)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Financiado</p>
                  <p className="text-white font-medium">{pct(level.financedPct)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Puntos x</p>
                  <p className="text-white font-medium">{level.pointsMultiplier}x</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Descuento</p>
                  <p className="text-white font-medium">{pct(level.discountPct)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {level.prioritySupport && <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">Soporte prioritario</span>}
                {level.dedicatedAdvisor && <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-1 rounded-full">Asesor dedicado</span>}
                {level.virtualCard && <span className="text-xs bg-gray-400/10 text-gray-400 px-2 py-1 rounded-full">Tarjeta virtual</span>}
                {level.physicalCard && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded-full">Tarjeta física</span>}
                {level.blackCard && <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full">Black card</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
