import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  Ticket,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';

export const EventParticipantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Certificate issuance modal state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [issuingCerts, setIssuingCerts] = useState(false);
  const [customCertTitle, setCustomCertTitle] = useState('');

  const fetchParticipants = async () => {
    try {
      const data = await apiRequest(`/events/${id}/registrations?status=${statusFilter}`);
      setEvent(data.event);
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to load participants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [id, statusFilter]);

  const handleUpdateStatus = async (regId: string, newStatus: string) => {
    try {
      const res = await apiRequest(`/registrations/item/${regId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('success', 'Status Updated', res.message);
      fetchParticipants();
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    }
  };

  const handleExportCsv = () => {
    window.location.href = `/api/events/${id}/registrations?export=csv`;
  };

  const handleIssueCertificates = async () => {
    setIssuingCerts(true);
    try {
      const res = await apiRequest(`/events/${id}/certificates`, {
        method: 'POST',
        body: JSON.stringify({ customTitle: customCertTitle || undefined }),
      });
      showToast('success', 'Certificates Issued! 🎓', res.message);
      setCertModalOpen(false);
      fetchParticipants();
    } catch (err: any) {
      showToast('error', 'Issuance Failed', err.message);
    } finally {
      setIssuingCerts(false);
    }
  };

  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      (r.team?.name && r.team.name.toLowerCase().includes(q))
    );
  });

  const checkedInCount = registrations.filter((r) => r.attendance).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/organizer')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Organizer Hub</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
            Participant Roster & Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {event?.title || 'Manage Participants'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {registrations.length} registered participants • {checkedInCount} verified check-ins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <Link
            to={`/organizer/check-in?eventId=${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Open Check-in Terminal</span>
          </Link>

          <button
            onClick={() => setCertModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Issue Certificates ({checkedInCount})</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, email, or registration ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-semibold">
          {['ALL', 'CONFIRMED', 'WAITLISTED', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors capitalize shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No participants match your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">College & Dept</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{reg.user.name}</div>
                      <div className="text-[11px] text-slate-600 font-mono">{reg.user.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {reg.registrationNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">
                        {reg.user.profile?.college || 'Imperial College'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {reg.user.profile?.department || 'Engineering'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {reg.team ? reg.team.name : '— (Solo)'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={reg.status} />
                      {reg.waitlistPosition && (
                        <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                          Waitlist #{reg.waitlistPosition}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {reg.attendance ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {new Date(reg.attendance.checkedInAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600">Not checked in</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {reg.status === 'WAITLISTED' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, 'CONFIRMED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                        >
                          Promote
                        </button>
                      )}
                      {reg.status === 'PENDING' && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'CONFIRMED')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[11px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Issuance Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Issue Verified Certificates</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Award official collegiate certificates to all participants with verified attendance (
                <strong>{checkedInCount} verified check-ins</strong>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Certificate Title (Optional)
              </label>
              <input
                type="text"
                value={customCertTitle}
                onChange={(e) => setCustomCertTitle(e.target.value)}
                placeholder={`Certificate of Technical Achievement — ${event?.title || ''}`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCertModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCertificates}
                disabled={issuingCerts || checkedInCount === 0}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {issuingCerts ? 'Issuing...' : `Issue ${checkedInCount} Certificate(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
