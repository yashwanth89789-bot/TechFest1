import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Sparkles,
  Award,
  Users,
  Calendar,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Code2,
  Terminal,
  Cpu,
  Laptop,
  Presentation,
  BrainCircuit,
  ArrowRight,
  HelpCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { EventCard, EventCardData } from '../components/EventCard.tsx';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredEvents, setFeaturedEvents] = useState<EventCardData[]>([]);
  const [stats, setStats] = useState<{
    totalStudents: number;
    activeEvents: number;
    confirmedRegistrations: number;
    issuedCertificates: number;
    collegesCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, statsData] = await Promise.all([
          apiRequest<{ events: EventCardData[] }>('/events?limit=3&sortBy=date_asc'),
          apiRequest('/stats/public'),
        ]);
        setFeaturedEvents(eventsData.events || []);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/events');
    }
  };

  const categories = [
    {
      name: 'Hackathons',
      slug: 'hackathons',
      icon: Code2,
      desc: '36-hour overnight product building & hardware sprints',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      name: 'Coding Contests',
      slug: 'coding-contests',
      icon: Terminal,
      desc: 'Speed algorithmic challenges & ICPC-style showdowns',
      color: 'from-violet-600 to-purple-600',
    },
    {
      name: 'Workshops',
      slug: 'workshops',
      icon: Laptop,
      desc: 'Hands-on masterclasses with industry engineers',
      color: 'from-sky-500 to-cyan-600',
    },
    {
      name: 'Seminars',
      slug: 'seminars',
      icon: Presentation,
      desc: 'Keynotes, tech panels & research papers',
      color: 'from-amber-500 to-orange-600',
    },
    {
      name: 'Robotics',
      slug: 'robotics',
      icon: Cpu,
      desc: 'Autonomous rovers, combat bots & drone arena',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      name: 'AI & Machine Learning',
      slug: 'ai-ml',
      icon: BrainCircuit,
      desc: 'Autonomous LLM agents & computer vision sprints',
      color: 'from-pink-600 to-rose-600',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Discover & Browse',
      desc: 'Explore hackathons, workshops, and contests. Filter by category, dates, and individual or team format.',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Register or Form a Team',
      desc: 'Sign up in one click. For team events, generate an instant join code and invite friends with zero hassle.',
      icon: Users,
    },
    {
      num: '03',
      title: 'Get Digital QR Ticket',
      desc: 'Receive an authenticated digital ticket with secure QR token for paperless venue check-in on competition day.',
      icon: Ticket,
    },
    {
      num: '04',
      title: 'Attend & Earn Verified Certificate',
      desc: 'Check in with organizers and unlock cryptographically verifiable collegiate certificates for your resume.',
      icon: Award,
    },
  ];

  const faqs = [
    {
      q: 'How does team registration work?',
      a: 'For team-based events like HackSphere 2026, the team leader creates a team name to receive a unique join code (e.g., TEAM-BYTE-88). Teammates can either enter this code on their dashboard or accept an email invitation sent by the leader.',
    },
    {
      q: 'What happens if an event reaches maximum capacity?',
      a: 'TechFest Hub features an automatic waitlist engine. When an event is full, eligible registrations are atomically placed on the waitlist in chronological order. If any confirmed participant cancels, the system automatically promotes the next student in line and issues their active QR ticket immediately.',
    },
    {
      q: 'How do organizers check in attendees on event day?',
      a: 'Organizers use our QR Check-in Terminal on any mobile phone, tablet, or laptop camera. Scanning an attendee’s digital ticket securely verifies their registration against the server, marks attendance in real time, and prevents duplicate check-ins.',
    },
    {
      q: 'Are certificates verifiable by employers and university faculty?',
      a: 'Yes! Every certificate issued through TechFest Hub receives a unique cryptographic identifier (e.g. CERT-TECHFEST-2026-XXXX). Anyone can enter this code at our public verification page (/verify-certificate) to inspect the authentic recipient, date, and event details.',
    },
    {
      q: 'Can students from other universities participate?',
      a: 'Yes. Unless an event is specifically marked as internal-only in its eligibility section, students from any accredited college or university may register and participate.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border-b border-slate-200">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f110_1px,transparent_1px),linear-gradient(to_bottom,#6366f110_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-indigo-200/80 shadow-sm text-indigo-900 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span>Collegiate Technical Symposium & Hackathon Gateway</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Discover.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              Participate.
            </span>{' '}
            Innovate.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Your single destination for college hackathons, competitive coding battles, robotics arenas, and engineering workshops. Register solo or form teams, get digital QR tickets, and showcase verified achievement credentials.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 sm:mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-200"
          >
            <div className="flex items-center gap-3 px-3 py-2 flex-1 w-full text-slate-700">
              <Search className="w-5 h-5 text-indigo-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by hackathon, topic, algorithmic contest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 shrink-0"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Categories Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <span className="text-slate-400">Popular:</span>
            <Link
              to="/events?category=hackathons"
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
            >
              Hackathons
            </Link>
            <Link
              to="/events?category=coding-contests"
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
            >
              Coding Contests
            </Link>
            <Link
              to="/events?category=ai-ml"
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
            >
              AI / LLMs
            </Link>
            <Link
              to="/events?category=robotics"
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
            >
              Robotics
            </Link>
          </div>
        </div>
      </section>

      {/* Live Database Statistics Section (Real DB counts!) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">
                {stats ? stats.activeEvents : '6+'}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Active Events Live
              </p>
            </div>

            <div className="p-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats ? stats.confirmedRegistrations : '12+'}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Confirmed Registrations
              </p>
            </div>

            <div className="p-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-violet-600 tracking-tight">
                {stats ? stats.totalStudents : '20+'}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Collegiate Engineers
              </p>
            </div>

            <div className="p-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                {stats ? stats.issuedCertificates : '1+'}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Verified Credentials Issued
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Flagship Competitions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Upcoming Events
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Hand-picked symposiums, national hackathons, and algorithmic challenges accepting registrations.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
          >
            <span>View All Events</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-medium text-slate-600">No events currently scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            <Terminal className="w-4 h-4" />
            <span>Curated Disciplines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore by Technical Category
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Find the exact discipline you excel in, from competitive coding to hardware and autonomous robotics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/events?category=${cat.slug}`}
                className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-3" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2">
              How TechFest Hub Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From event discovery to paperless check-in and verified credentials.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-500">{step.num}</span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything you need to know about registering, teams, and tickets.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <Minus className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-indigo-100">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Showcase Your Technical Skills?
          </h2>
          <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto mt-3 leading-relaxed">
            Join thousands of collegiate students competing in hackathons, coding contests, and robotics arenas across campus.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white text-indigo-700 hover:bg-slate-50 font-bold text-sm shadow-md transition-all"
            >
              Create Student Account
            </Link>
            <Link
              to="/events"
              className="px-6 py-3 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white font-bold text-sm transition-all"
            >
              Explore All Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
