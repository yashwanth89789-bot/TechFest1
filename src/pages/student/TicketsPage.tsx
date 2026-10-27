import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, ShieldCheck, Printer } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { DigitalTicketCard } from '../../components/DigitalTicketCard.tsx';

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await apiRequest('/registrations/me');
        // Filter to registrations with confirmed tickets
        const confirmedTickets = (data || []).filter((r: any) => r.ticket);
        setRegistrations(confirmedTickets);
      } catch (err: any) {
        showToast('error', 'Error', err.message || 'Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Digital Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official QR entry passes for your confirmed college technical competitions and symposiums.
          </p>
        </div>

        {registrations.length > 0 && (
          <button
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Tickets</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No active digital tickets</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Digital tickets with secure QR check-in tokens are automatically generated once your event registration is confirmed.
          </p>
          <Link
            to="/events"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {registrations.map((reg) => (
            <DigitalTicketCard
              key={reg.id}
              registration={reg}
              userName={user?.name}
              userEmail={user?.email}
            />
          ))}
        </div>
      )}
    </div>
  );
};
