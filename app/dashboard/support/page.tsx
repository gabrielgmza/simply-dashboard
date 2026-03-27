'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = () => api.get('/support/tickets').then(r => { setTickets(r.data); setLoading(false); });
  useEffect(() => { fetchTickets(); }, []);

  const selectTicket = async (ticket: any) => {
    setSelected(ticket);
    const r = await api.get(`/support/tickets/${ticket.id}/messages`);
    setMessages(r.data);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    await api.post(`/support/tickets/${selected.id}/messages`, { message: reply });
    setReply('');
    const r = await api.get(`/support/tickets/${selected.id}/messages`);
    setMessages(r.data);
  };

  const updateStatus = async (status: string) => {
    await api.put(`/support/tickets/${selected.id}/status`, { status });
    fetchTickets();
    setSelected({ ...selected, status });
  };

  const priorityColor: Record<string, string> = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' };

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="flex gap-4 h-full">
      <div className="w-80 flex-shrink-0 space-y-2">
        <h2 className="text-white text-lg font-semibold mb-3">Soporte</h2>
        {tickets.map((t) => (
          <button key={t.id} onClick={() => selectTicket(t)}
            className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition ${selected?.id === t.id ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'}`}>
            <p className="text-white text-sm font-medium truncate">{t.subject}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${priorityColor[t.priority]}`}>{t.priority}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{t.status}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{selected.subject}</p>
              <p className="text-gray-500 text-xs mt-0.5">{selected.category} · {selected.priority}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus('resolved')} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">Resolver</button>
              <button onClick={() => updateStatus('closed')} className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg">Cerrar</button>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderType === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${m.senderType === 'user' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}`}>
                  <p>{m.message}</p>
                  <p className="text-xs opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Escribí tu respuesta..."
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500" />
            <button onClick={sendReply} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
