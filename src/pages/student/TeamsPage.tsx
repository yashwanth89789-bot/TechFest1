import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mail,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [teams, setTeams] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Join by code modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const data = await apiRequest('/teams/me');
      setTeams(data.teams || []);
      setPendingInvitations(data.pendingInvitations || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('success', 'Copied!', `Team code "${code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !inviteeEmail.trim()) return;

    setInviting(true);
    try {
      const res = await apiRequest(`/teams/${selectedTeam.id}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteeEmail.trim() }),
      });
      showToast('success', 'Invitation Sent', res.message);
      setInviteeEmail('');
      setInviteModalOpen(false);
      fetchTeams();
    } catch (err: any) {
      showToast('error', 'Invite Failed', err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    try {
      const res = await apiRequest('/teams/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      showToast('success', 'Joined Team!', res.message);
      setJoinCode('');
      setJoinModalOpen(false);
      fetchTeams();
    } catch (err: any) {
      showToast('error', 'Failed to Join', err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleRespondInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const res = await apiRequest(`/teams/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ accept }),
      });
      showToast(accept ? 'success' : 'info', accept ? 'Accepted' : 'Declined', res.message);
      fetchTeams();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Form competitive squads, invite teammates with secure join codes, and coordinate hackathon submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
          >
            Enter Join Code
          </button>
        </div>
      </div>

      {/* Pending Invitations Banner (if any) */}
      {pendingInvitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Pending Team Invitations ({pendingInvitations.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white p-4 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    {inv.team.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Event: {inv.team.event.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Invited by {inv.inviter.name} ({inv.inviter.email})
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRespondInvitation(inv.id, true)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                    title="Accept Invitation"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(inv.id, false)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                    title="Decline Invitation"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No teams formed yet</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            When you register for team events like HackSphere 2026, your squad and members will appear here.
          </p>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            Join Existing Team with Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const isLeader = t.leaderId === user?.id;
            const currentCount = t.members.length;
            const maxCount = t.event.maxTeamSize;
            const canInvite = isLeader && currentCount < maxCount;

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
                        {t.event.title}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t.name}</h3>
                    </div>

                    {/* Join Code Chip */}
                    <button
                      onClick={() => copyToClipboard(t.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-800 transition-colors"
                      title="Click to copy team join code"
                    >
                      <span>{t.code}</span>
                      {copiedCode === t.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Team Size Status */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Roster Capacity</span>
                    <span>
                      {currentCount} / {maxCount} members ({t.event.minTeamSize} min required)
                    </span>
                  </div>

                  {/* Member Avatars List */}
                  <div className="mt-3 space-y-2">
                    {t.members.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              m.user.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.user.name)}`
                            }
                            alt={m.user.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-800">{m.user.name}</span>
                            <span className="text-[11px] text-slate-600 ml-1.5 font-mono">
                              ({m.user.email})
                            </span>
                          </div>
                        </div>

                        {m.role === 'LEADER' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pending outgoing invitations */}
                  {t.invitations && t.invitations.length > 0 && (
                    <div className="mt-3 pt-2 text-[11px] text-slate-500">
                      <span className="font-semibold">Pending invites: </span>
                      {t.invitations.map((inv: any) => inv.invitee.email).join(', ')}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {isLeader ? 'You lead this squad' : 'Team Member'}
                  </span>

                  {canInvite && (
                    <button
                      onClick={() => {
                        setSelectedTeam(t);
                        setInviteModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite Teammate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <UserPlus className="w-4 h-4" />
                <span>Invite Teammate</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{selectedTeam.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the registered email of a student. They will receive an in-app team invitation.
              </p>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="teammate@college.edu"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join By Code Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                <span>Join Team</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Enter Join Code</h3>
              <p className="text-xs text-slate-500 mt-1">
                Obtain the unique team code (e.g. TEAM-BYTE-88) from your team leader to join their squad.
              </p>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-BYTE-88"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
