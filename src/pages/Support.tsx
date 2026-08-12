import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserTickets } from '../services/db';
import { SupportTicket } from '../types';
import { 
  HelpCircle, 
  MessageSquarePlus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  MessageCircle,
  PlusCircle,
  Loader2
} from 'lucide-react';

interface SupportProps {
  onNavigate: (route: string) => void;
}

export default function Support({ onNavigate }: SupportProps) {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadTickets();
    }
  }, [userProfile]);

  const loadTickets = async () => {
    if (!userProfile) return;
    setLoading(true);
    const list = await fetchUserTickets(userProfile.uid);
    setTickets(list);
    setLoading(false);
  };

  const faqs = [
    {
      q: 'How long does deposit verification take?',
      a: 'JazzCash and SadaPay deposit requests are verified by our support team within 24 hours. Once verified, funds are automatically credited to your wallet.',
    },
    {
      q: 'Are virtual numbers reusable?',
      a: 'Virtual numbers provide temporary or dedicated SMS verification lines depending on the service tier selected during order placement.',
    },
    {
      q: 'What should I do if an order is delayed?',
      a: 'If your order status remains processing past 30 minutes, open a support ticket with your Order ID and our team will immediately resolve it.',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Help & Support</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Submit inquiry tickets or browse common questions
          </p>
        </div>

        <button
          onClick={() => onNavigate('/support/create')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/50 flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* My Support Tickets */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <span>My Support Tickets</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-purple-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30 space-y-2">
            <p className="text-xs text-gray-400">You have no open support tickets.</p>
            <button
              onClick={() => onNavigate('/support/create')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              Need help? Create a ticket →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.ticketId}
                onClick={() => onNavigate(`/support/ticket/${t.ticketId}`)}
                className="p-5 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between gap-4 hover:border-purple-500/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      #{t.ticketId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.priority === 'High' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-gray-300'
                    }`}>
                      {t.priority} Priority
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{t.subject}</div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Updated: {new Date(t.updatedAt).toLocaleString()} · Messages: {t.messages.length}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    t.status === 'Resolved'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}>
                    {t.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAQ Accordion Section */}
      <section className="space-y-4 pt-4 border-t border-purple-900/30">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-purple-900/30 space-y-1.5"
            >
              <h3 className="text-sm font-bold text-white">{faq.q}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
