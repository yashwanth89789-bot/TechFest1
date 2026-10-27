import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Users,
  Ticket,
  CheckCircle2,
  Edit,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizerEvents() {
      try {
        const data = await apiRequest('/events?limit=50&status=');
        const myEvents =
          user?.role === 'ADMIN'
            ? data.events
            : data.events.filter((e: any) => e.organizerId === user?.id);
        setEvents(myEvents);
      } catch (err: any) {
        showToast('error', 'Error', err.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrganizerEvents();
  }, [user]);

  const totalCapacity = events.reduce((acc, e) => acc + (e.capacity || 0), 0);
  const totalRegistrations = events.reduce((acc, e) => acc + (e.confirmedCount || 0), 0);
  const pendingApprovals = events.filter((e) => e.status === 'PENDING_APPROVAL').length;
  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Campus Event Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizer Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your symposiums, track live attendee check-ins, and issue verified technical credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organizer/check-in"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-indigo-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Ticket className="w-4 h-4 text-indigo-600" />
            <span>QR Check-in Terminal</span>
          </Link>

          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Managed Events</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{events.length}</p>
          <span className="text-[11px] text-slate-600 mt-1 block">
            {publishedEvents} published, {pendingApprovals} pending review
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Confirmed Attendees</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{totalRegistrations}</p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Active registrations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Capacity</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCapacity}</p>
          <span className="text-[11px] text-slate-600 mt-1 block">Platform allocated spots</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overall Fill Rate</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0}%
          </p>
          <span className="text-[11px] text-slate-600 mt-1 block">Across all competitions</span>
        </div>
      </div>

      {/* Events Table / Card Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Organized Events</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review event registrations, manage participant lists, export CSV reports, and update deadlines.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No events created yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create your first college hackathon or technical workshop to begin accepting registrations.
            </p>
            <Link
              to="/organizer/events/new"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Create New Event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ev.category?.name || 'Technical'}
                    </span>
                    <StatusBadge status={ev.status} />
                    <span className="text-xs text-slate-600 font-medium">
                      {ev.format} Format
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    <Link to={`/events/${ev.id}`} className="hover:text-indigo-600">
                      {ev.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>
                      {new Date(ev.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      Capacity: <strong>{ev.confirmedCount}</strong> / {ev.capacity} spots filled
                    </span>
                    <span>•</span>
                    <span className="truncate">{ev.venue || 'Virtual Campus'}</span>
                  </p>
                </div>

                {/* Organizer Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/organizer/events/${ev.id}/participants`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Participants</span>
                  </Link>

                  <Link
                    to={`/organizer/events/${ev.id}/edit`}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Edit event"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/events/${ev.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="View public event page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
