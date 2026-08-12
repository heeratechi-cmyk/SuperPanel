import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserTickets, addMessageToTicket } from '../services/db';
import { SupportTicket } from '../types';
import { ArrowLeft, Send, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';

interface TicketDetailsProps {
  ticketId: string;
  onNavigate: (route: string) => void;
}

export default function TicketDetails({ ticketId, onNavigate }: TicketDetailsProps) {
  const { userProfile, addToast } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadTicket();
    }
  }, [userProfile, ticketId]);

  const loadTicket = async () => {
    if (!userProfile) return;
    setLoading(true);
    const list = await fetchUserTickets(userProfile.uid);
    const match = list.find((t) => t.ticketId === ticketId);
    setTicket(match || null);
    setLoading(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyText.trim() || !userProfile) return;

    setSending(true);
    try {
      await addMessageToTicket(
        ticket.ticketId,
        userProfile.uid,
        userProfile.name,
        userProfile.role === 'admin' ? 'admin' : 'user',
        replyText.trim()
      );
      setReplyText('');
      setSending(false);
      addToast('Reply sent', 'success');
      loadTicket();
    } catch (err) {
      console.error(err);
      setSending(false);
      addToast('Failed to send reply', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-purple-400 flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-medium">Loading support ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-4">
        <h3 className="text-lg font-bold text-white">Ticket Not Found</h3>
        <button
          onClick={() => onNavigate('/support')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
        >
          Back to Support
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => onNavigate('/support')}
        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Support</span>
      </button>

      {/* Ticket Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
              Ticket #{ticket.ticketId}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">{ticket.subject}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            ticket.status === 'Resolved' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
          }`}>
            {ticket.status}
          </span>
        </div>

        {/* Message Thread */}
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {ticket.messages.map((m) => {
            const isAdmin = m.senderRole === 'admin';
            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isAdmin
                    ? 'bg-purple-950/40 border-purple-500/40 ml-4'
                    : 'bg-slate-900/90 border-purple-900/30 mr-4'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> : <UserIcon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{m.senderName}</span>
                    {isAdmin && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.2 rounded">Support Agent</span>}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-purple-900/30 space-y-3">
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your response here..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send Reply</span>
          </button>
        </form>
      </div>
    </div>
  );
}
