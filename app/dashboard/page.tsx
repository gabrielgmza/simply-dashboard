'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stats {
  users: number;
  kyc_pending: number;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({ users: 0, kyc_pending: 0 });

  useEffect(() => {
    api.get('/kyc/pending').then((res) => {
      setStats((s) => ({ ...s, kyc_pending: res.data.length }));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-6">Panel principal</h2>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">KYC pendientes</p>
          <p className="text-white text-3xl font-bold mt-1">{stats.kyc_pending}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Estado</p>
          <p className="text-green-400 text-sm font-medium mt-1">● Operativo</p>
        </div>
      </div>
    </div>
  );
}
