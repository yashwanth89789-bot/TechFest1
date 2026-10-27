import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  ChevronLeft,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  QrCode,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useToast } from '../../context/ToastContext.tsx';

export const CheckInPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(searchParams.get('eventId') || '');
  const [stats, setStats] = useState<{
    totalConfirmed: number;
    totalAttended: number;
    attendanceRate: number;
    remaining: number;
  } | null>(null);

  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Feedback State
  const [scanResult, setScanResult] = useState<{
    status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID' | 'WRONG_EVENT' | 'ERROR';
    message: string;
    participant?: any;
    attendance?: any;
  } | null>(null);

  // Fetch organizer events
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await apiRequest('/events?limit=50&status=');
        setEvents(data.events || []);
        if (data.events?.length > 0 && !selectedEventId) {
          setSelectedEventId(data.events[0].id);
        }
      } catch (err: any) {
        showToast('error', 'Error', err.message);
      }
    }
    loadEvents();
  }, []);

  // Fetch attendance report for selected event
  const fetchAttendanceStats = async () => {
    if (!selectedEventId) return;
    try {
      const data = await apiRequest(`/events/${selectedEventId}/attendance`);
      setStats(data.stats);
      setRecentScans(data.attendances || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  useEffect(() => {
    fetchAttendanceStats();
    setScanResult(null);
  }, [selectedEventId]);

  const handleCheckInSubmit = async (tokenOrCode: string) => {
    if (!tokenOrCode.trim() || !selectedEventId) return;
    setLoading(true);

    const isToken = tokenOrCode.startsWith('TKT-');
    const payload = isToken
      ? { ticketToken: tokenOrCode.trim(), method: 'QR_SCAN' }
      : { registrationNumber: tokenOrCode.trim(), method: 'MANUAL' };

    try {
      const res = await apiRequest(`/events/${selectedEventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setScanResult({
        status: 'SUCCESS',
        message: res.message,
        participant: res.participant,
        attendance: res.attendance,
      });

      showToast('success', 'Verified Check-in!', res.message);
      fetchAttendanceStats();
      setManualInput('');
    } catch (err: any) {
      const errorMsg = err.message || 'Check-in failed';

      if (errorMsg.includes('already checked in')) {
        setScanResult({
          status: 'ALREADY_CHECKED_IN',
          message: errorMsg,
        });
      } else if (errorMsg.includes('different event')) {
        setScanResult({
          status: 'WRONG_EVENT',
          message: errorMsg,
        });
      } else {
        setScanResult({
          status: 'INVALID',
          message: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckInSubmit(manualInput);
  };

  // Sample quick scan testing tokens from seed data!
  const quickDemoTokens = [
    { label: 'Alex Rivera (Confirmed CodeRush)', token: 'TKT-CR26-ALEX-9981-SEC' },
    { label: 'Alex (HackSphere ByteForce)', token: 'TKT-HS26-BYTEFORCE-ALEX' },
    { label: 'Maya Patel (Confirmed AI Workshop)', token: 'TKT-AI26-MAYA-4412' },
    { label: 'Manual Ref: REG-2026-CR-001', token: 'REG-2026-CR-001' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/organizer')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Organizer Dashboard</span>
      </button>

      {/* Header and Event Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
            Real-Time Gate Access Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizer QR Check-in Terminal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scan attendee digital tickets or enter registration references for server-side attendance verification.
          </p>
        </div>

        {/* Event Selector */}
        <div className="w-full sm:w-auto">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Active Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSearchParams({ eventId: e.target.value });
            }}
            className="w-full sm:w-72 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-none focus:border-indigo-500"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.confirmedCount} registered)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Confirmed</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalConfirmed}</p>
            <span className="text-[11px] text-slate-600 mt-1 block">Expected attendees</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Checked In</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.totalAttended}</p>
            <span className="text-[11px] text-emerald-700 mt-1 block">Verified on premise</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Attendance Rate</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.attendanceRate}%</p>
            <span className="text-[11px] text-slate-600 mt-1 block">Conversion percentage</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Pending Check-in</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.remaining}</p>
            <span className="text-[11px] text-amber-700 mt-1 block">Yet to arrive</span>
          </div>
        </div>
      )}

      {/* Scanner & Manual Input Center Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input Console & Quick Demo Scanner */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Digital QR & Reference Scanner</span>
            </div>

            {/* Simulated Live Camera Scanner Visual */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden shadow-inner">
              {/* Animated Scan Crosshair */}
              <div className="w-48 h-48 border-2 border-indigo-400 rounded-2xl relative flex items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-bounce" />
                <Camera className="w-10 h-10 text-indigo-400/60" />
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Position digital QR ticket in front of device camera or paste token below.
              </p>
            </div>

            {/* Manual Form Fallback */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Manual Fallback: Ticket Token or Registration ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TKT-CR26-ALEX-9981-SEC or REG-2026-CR-001"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !manualInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>

            {/* Quick Demo Scan Buttons (Test scanner in 1 click!) */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Test Scan Credentials:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickDemoTokens.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setManualInput(item.token);
                      handleCheckInSubmit(item.token);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Scan Result Card & Recent Scans */}
        <div className="space-y-6">
          {/* Live Scan Result Card */}
          {scanResult ? (
            <div
              className={`p-6 rounded-3xl border shadow-md transition-all animate-in zoom-in-95 duration-200 ${
                scanResult.status === 'SUCCESS'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : scanResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    scanResult.status === 'SUCCESS'
                      ? 'bg-emerald-600 text-white'
                      : scanResult.status === 'ALREADY_CHECKED_IN'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {scanResult.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : scanResult.status === 'ALREADY_CHECKED_IN' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold">
                    {scanResult.status === 'SUCCESS'
                      ? 'Check-In Approved!'
                      : scanResult.status === 'ALREADY_CHECKED_IN'
                      ? 'Duplicate Check-In Detected!'
                      : 'Check-In Rejected'}
                  </h3>

                  <p className="text-xs leading-relaxed opacity-90">{scanResult.message}</p>

                  {scanResult.participant && (
                    <div className="p-4 rounded-2xl bg-white/90 border border-current/20 text-xs space-y-1 mt-2 text-slate-800">
                      <p className="font-bold text-sm text-slate-900">{scanResult.participant.name}</p>
                      <p className="text-slate-600 font-mono text-[11px]">{scanResult.participant.email}</p>
                      <p className="text-slate-600">
                        {scanResult.participant.college || 'Imperial College'} •{' '}
                        {scanResult.participant.department || 'Computing'}
                      </p>
                      {scanResult.participant.teamName && (
                        <p className="text-indigo-600 font-semibold pt-1">
                          Team: {scanResult.participant.teamName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-xs flex flex-col items-center justify-center min-h-[220px]">
              <Ticket className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Awaiting Ticket Scan</p>
              <p className="mt-1 max-w-xs leading-relaxed">
                Scanned attendee information, verification status, and timestamps will appear here.
              </p>
            </div>
          )}

          {/* Recent Scans Activity */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Recent Check-In Activity</span>
              </h3>
              <button
                onClick={fetchAttendanceStats}
                className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {recentScans.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No check-ins recorded yet.</p>
              ) : (
                recentScans.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.registration.user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.registration.registrationNumber}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      {new Date(item.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
