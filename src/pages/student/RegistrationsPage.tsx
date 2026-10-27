import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  Clock,
  MapPin,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Users,
  Award,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';

export const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();

  const fetchRegistrations = async () => {
    try {
      const data = await apiRequest('/registrations/me');
      setRegistrations(data || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to fetch registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async () => {
    if (!selectedReg) return;
    setCancelling(true);
    try {
      const res = await apiRequest(`/registrations/item/${selectedReg.id}/cancel`, {
        method: 'POST',
      });
      showToast('info', 'Registration Cancelled', res.message);
      setCancelModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.message);
    } finally {
      setCancelling(false);
    }
  };

  const filtered = registrations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track confirmed entries, waitlist positions, and active digital credentials.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
          {['ALL', 'CONFIRMED', 'WAITLISTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No registrations found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === 'ALL'
              ? 'You have not registered for any events yet. Check out the latest college competitions!'
              : `No registrations currently marked as ${statusFilter.toLowerCase()}.`}
          </p>
          <Link
            to="/events"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {reg.event.category?.name || 'Technical'}
                  </span>
                  <StatusBadge status={reg.status} />
                  {reg.status === 'WAITLISTED' && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Waitlist Position #{reg.waitlistPosition}
                    </span>
                  )}
                  {reg.attendance && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Checked-In
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  <Link to={`/events/${reg.event.id}`} className="hover:text-indigo-600 transition-colors">
                    {reg.event.title}
                  </Link>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      {new Date(reg.event.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{reg.event.venue || 'Virtual Campus'}</span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-600">
                    Ref: <strong>{reg.registrationNumber}</strong>
                  </div>
                </div>

                {reg.team && (
                  <div className="text-xs text-indigo-700 font-medium flex items-center gap-1.5 pt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Registered as Team: {reg.team.name} (Code: {reg.team.code})</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {reg.status === 'CONFIRMED' && reg.ticket && (
                  <Link
                    to="/tickets"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Ticket className="w-3.5 h-3.5" /> View Ticket
                  </Link>
                )}

                <Link
                  to={`/events/${reg.event.id}`}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Event Info
                </Link>

                {reg.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setSelectedReg(reg);
                      setCancelModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                  >
                    Cancel Registration
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancelModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Cancel Registration?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to cancel your registration for{' '}
                <strong>{selectedReg.event.title}</strong>?
              </p>
              {selectedReg.status === 'CONFIRMED' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                  Notice: Cancelling your confirmed spot will automatically promote the next eligible student in line from the waitlist.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Keep Registration
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
