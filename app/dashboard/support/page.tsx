'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const loadTickets = () => api.get('/support/tickets').then(r => { setTickets(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { loadTickets(); }, []);

  const selectTicket = async (ticket: any) => {
    setSelected(ticket);
    setMessages([]);
    const r = await api.get(`/support/tickets/${ticket.id}/messages`).catch(() => ({ data: [] }));
    setMessages(r.data);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await api.post(`/support/tickets/${selected.id}/messages`, { message: reply }).catch(() => {});
    setReply('');
    const r = await api.get(`/support/tickets/${selected.id}/messages`).catch(() => ({ data: [] }));
    setMessages(r.data);
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    await api.put(`/support/tickets/${selected.id}/status`, { status }).catch(() => {});
    setSelected({ ...selected, status });
    loadTickets();
  };

  const fmtDate = (d: any) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const priorityColor: Record<string, string> = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
  };
  const statusColor: Record<string, string> = {
    open: 'text-red-400', in_progress: 'text-blue-400', resolved: 'text-green-400', closed: 'text-gray-400',
  };

  const filtered = tickets
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.subject?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    high: tickets.filter(t => t.priority === 'high').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div>;

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h2 className="text-white text-xl font-bold">Soporte al Cliente</h2>
        <p className="text-gray-500 text-sm mt-0.5">Gestión de tickets y comunicaciones</p>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Abiertos', value: stats.open, color: 'text-red-400' },
          { label: 'En progreso', value: stats.inProgress, color: 'text-blue-400' },
          { label: 'Resueltos', value: stats.resolved, color: 'text-green-400' },
          { label: 'Alta prioridad', value: stats.high, color: 'text-orange-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Lista tickets */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2">
          <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
            {['open', 'in_progress', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition font-medium ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {f === 'open' ? 'Abiertos' : f === 'in_progress' ? 'En curso' : 'Todos'}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ticket..."
            className="bg-gray-900 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500" />
          <div className="space-y-1.5 overflow-y-auto flex-1">
            {filtered.map(t => (
              <button key={t.id} onClick={() => selectTicket(t)}
                className={`w-full text-left rounded-xl p-3 transition-all border ${selected?.id === t.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}`}>
                <p className="text-white text-xs font-medium truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${priorityColor[t.priority] || ''}`}>{t.priority}</span>
                  <span className={`text-xs ${statusColor[t.status] || 'text-gray-400'}`}>{t.status?.replace('_', ' ')}</span>
                </div>
                <p className="text-gray-600 text-xs mt-1">{fmtDate(t.createdAt)}</p>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-gray-700 text-xs text-center py-6">Sin tickets</p>}
          </div>
        </div>

        {/* Panel ticket */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center bg-gray-900/40 border border-gray-800 rounded-2xl">
            <p className="text-gray-600 text-sm">Seleccioná un ticket para responder</p>
          </div>
        ) : (
          <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Header ticket */}
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{selected.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[selected.priority] || ''}`}>{selected.priority}</span>
                    <span className="text-gray-500 text-xs">{selected.category}</span>
                    <span className={`text-xs ${statusColor[selected.status] || 'text-gray-400'}`}>{selected.status?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selected.status !== 'in_progress' && (
                    <button onClick={() => updateStatus('in_progress')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">En progreso</button>
                  )}
                  <button onClick={() => updateStatus('resolved')} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition">Resolver</button>
                  <button onClick={() => updateStatus('closed')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition">Cerrar</button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {messages.length === 0 && <p className="text-gray-700 text-xs text-center py-8">Sin mensajes aún</p>}
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.senderType === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-sm rounded-2xl px-4 py-3 ${m.senderType === 'user' ? 'bg-gray-800 text-white rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs opacity-50 mt-1">{fmtDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input respuesta */}
            <div className="p-4 border-t border-gray-800 flex gap-2 flex-shrink-0">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                placeholder="Escribí tu respuesta... (Enter para enviar)"
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-xl transition">
                {sending ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
