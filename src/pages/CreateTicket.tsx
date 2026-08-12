import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSupportTicket } from '../services/db';
import { TicketPriority } from '../types';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

interface CreateTicketProps {
  onNavigate: (route: string) => void;
}

export default function CreateTicket({ onNavigate }: CreateTicketProps) {
  const { userProfile, addToast } = useAuth();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      addToast('Please login to create a ticket', 'error');
      return;
    }

    if (!subject.trim()) {
      addToast('Subject is required', 'error');
      return;
    }

    if (!message.trim()) {
      addToast('Message is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const ticketId = await createSupportTicket(
        userProfile.uid,
        userProfile.name,
        userProfile.email,
        subject.trim(),
        priority,
        message.trim()
      );

      setSubmitting(false);
      addToast(`Support ticket #${ticketId} created!`, 'success');
      onNavigate(`/support/ticket/${ticketId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      addToast('Failed to create ticket', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <button
        onClick={() => onNavigate('/support')}
        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Support</span>
      </button>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-purple-900/60 shadow-2xl space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">Create Support Ticket</h1>
          <p className="text-xs text-gray-400 mt-1">
            Our 24/7 client assistance team will respond promptly to your request
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-gray-300 mb-1.5">
              Subject / Inquiry Title <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Deposit status query or Order #12345 issue"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1.5">
              Priority Level
            </label>
            <div className="flex items-center gap-3">
              {(['Low', 'Medium', 'High'] as TicketPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
                    priority === p
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                      : 'bg-slate-900 text-gray-400 border border-purple-900/30'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1.5">
              Message Details <span className="text-purple-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your query in detail..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-purple-900/40 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
