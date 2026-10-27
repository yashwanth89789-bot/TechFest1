import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Award,
  CheckCircle2,
  Ticket,
  ChevronLeft,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamMode, setTeamMode] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [regNotes, setRegNotes] = useState('');

  const fetchEventData = async () => {
    try {
      const data = await apiRequest(`/events/${id}`);
      setEvent(data.event);
      setUserRegistration(data.userRegistration);
      setUserTeam(data.userTeam);

      // If team event and user logged in, fetch user's teams
      if (user && data.event.registrationType === 'TEAM') {
        const teamsData = await apiRequest('/teams/me');
        setMyTeams(teamsData.teams.filter((t: any) => t.eventId === data.event.id));
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, user]);

  const handleRegisterIndividual = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest(`/events/${event.id}/register`, {
        method: 'POST',
        body: JSON.stringify({ notes: regNotes }),
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast('success', data.message);
      setModalOpen(false);
      fetchEventData();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      let targetTeamId = selectedTeamId;

      if (teamMode === 'CREATE') {
        if (!newTeamName.trim()) {
          showToast('error', 'Team name required');
          setSubmitting(false);
          return;
        }
        const teamRes = await apiRequest('/teams', {
          method: 'POST',
          body: JSON.stringify({ name: newTeamName.trim(), eventId: event.id }),
        });
        targetTeamId = teamRes.team.id;
      } else if (teamMode === 'JOIN') {
        if (!joinCode.trim()) {
          showToast('error', 'Join code required');
          setSubmitting(false);
          return;
        }
        const joinRes = await apiRequest('/teams/join', {
          method: 'POST',
          body: JSON.stringify({ code: joinCode.trim() }),
        });
        targetTeamId = joinRes.team.id;
      }

      // Now register for event with this team
      const regRes = await apiRequest(`/events/${event.id}/register`, {
        method: 'POST',
        body: JSON.stringify({ teamId: targetTeamId, notes: regNotes }),
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      showToast('success', regRes.message);
      setModalOpen(false);
      fetchEventData();
    } catch (err: any) {
      showToast('error', 'Team Registration Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-80 w-full bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-60 w-full bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested event could not be found or has been removed.</p>
        <Link
          to="/events"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === 'CANCELLED';
  const percentFilled = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-xl">
        <div className="aspect-[21/9] max-h-96 w-full relative">
          <img
            src={
              event.bannerUrl ||
              'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80'
            }
            alt={event.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
              {event.category.name}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
              {event.format} Format
            </span>
            <StatusBadge status={event.status} />
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {event.title}
          </h1>

          {event.shortDescription && (
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              {event.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Registration Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Event Description, Rules, Prizes, Schedule */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              <span>Event Overview</span>
            </h2>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line prose max-w-none">
              {event.description}
            </div>

            {/* Rules */}
            {event.rules && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Competition Rules & Guidelines</span>
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                  {event.rules}
                </div>
              </div>
            )}

            {/* Prizes */}
            {event.prizes && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Prizes & Accolades</span>
                </h3>
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 font-medium">
                  {event.prizes}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {event.eligibility && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-2">Eligibility Criteria</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{event.eligibility}</p>
              </div>
            )}
          </div>

          {/* Organizer Card */}
          {event.organizer && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <img
                src={
                  event.organizer.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.organizer.name)}`
                }
                alt={event.organizer.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Organizing Committee
                </p>
                <h4 className="text-base font-bold text-slate-900">{event.organizer.name}</h4>
                <p className="text-xs text-slate-500 font-mono">{event.organizer.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Registration Card & Timelines */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            {/* Registration State Banner */}
            {userRegistration ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You are Registered!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Status: <strong>{userRegistration.status}</strong>
                  {userRegistration.waitlistPosition && ` (Waitlist #${userRegistration.waitlistPosition})`}
                </p>
                <Link
                  to="/tickets"
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition-colors w-full justify-center shadow-xs"
                >
                  <Ticket className="w-3.5 h-3.5" /> View Digital Ticket
                </Link>
              </div>
            ) : isCancelled ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <strong>Event Cancelled</strong>: Registrations are permanently closed.
              </div>
            ) : isDeadlinePassed ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <strong>Registration Closed</strong>: The deadline for this event has passed.
              </div>
            ) : (
              <div>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      setModalOpen(true);
                    }
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                    event.isFull
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{event.isFull ? 'Join Waitlist' : 'Register Now'}</span>
                </button>
                {event.isFull && (
                  <p className="text-[11px] text-amber-700 text-center mt-2">
                    Event is full. Joining will place you on the automatic promotion waitlist.
                  </p>
                )}
              </div>
            )}

            {/* Capacity Progress */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-600">Capacity</span>
                <span className="text-slate-900">
                  {event.confirmedCount} / {event.capacity} seats filled
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    event.isFull ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-right">
                {event.availableSpots} remaining spots
              </p>
            </div>

            {/* Event Timing Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Event Start</p>
                  <p>
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(event.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Registration Deadline</p>
                  <p className="text-rose-600 font-semibold">
                    {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Location / Platform</p>
                  <p className="leading-relaxed">
                    {event.venue || event.onlineLink || 'Virtual Campus Event'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {event.registrationType === 'TEAM' ? (
                  <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                ) : (
                  <User className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-slate-900">Registration Mode</p>
                  <p>
                    {event.registrationType === 'TEAM'
                      ? `Team Event (${event.minTeamSize}-${event.maxTeamSize} members)`
                      : 'Individual Participant'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Confirm Registration</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Review your participation details to complete registration.
              </p>
            </div>

            {/* Individual Form */}
            {event.registrationType === 'INDIVIDUAL' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">Attendee Information:</p>
                  <p className="text-slate-600">{user?.name} ({user?.email})</p>
                  <p className="text-slate-500">
                    College: {user?.profile?.college || 'Imperial College of Engineering'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Notes or Dietary / Accessibility Needs (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={regNotes}
                    onChange={(e) => setRegNotes(e.target.value)}
                    placeholder="e.g. Vegetarian, hardware preference..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterIndividual}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : event.isFull ? 'Join Waitlist' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            ) : (
              /* Team Event Mode Form */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setTeamMode('SELECT')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      teamMode === 'SELECT'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Select Team
                  </button>
                  <button
                    onClick={() => setTeamMode('CREATE')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      teamMode === 'CREATE'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Create New
                  </button>
                  <button
                    onClick={() => setTeamMode('JOIN')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      teamMode === 'JOIN'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Join with Code
                  </button>
                </div>

                {teamMode === 'SELECT' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Choose Team</label>
                    {myTeams.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                        You haven't formed any team for this event yet.{' '}
                        <button
                          onClick={() => setTeamMode('CREATE')}
                          className="text-indigo-600 font-bold underline ml-1"
                        >
                          Create one now
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                      >
                        <option value="">-- Choose your team --</option>
                        {myTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Code: {t.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {teamMode === 'CREATE' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">New Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ByteForce AI, NeuralKnights..."
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      Team size: {event.minTeamSize} to {event.maxTeamSize} members. You will be leader.
                    </p>
                  </div>
                )}

                {teamMode === 'JOIN' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Team Join Code</label>
                    <input
                      type="text"
                      placeholder="e.g. TEAM-BYTE-88"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterTeam}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Registering Team...' : 'Submit Team Registration'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
