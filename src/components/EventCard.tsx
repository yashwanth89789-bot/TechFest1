import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, User, ArrowRight, Video, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge.tsx';

export interface EventCardData {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  bannerUrl?: string | null;
  format: 'OFFLINE' | 'ONLINE' | 'HYBRID' | string;
  venue?: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  capacity: number;
  confirmedCount: number;
  availableSpots: number;
  isFull: boolean;
  isDeadlinePassed: boolean;
  registrationType: 'INDIVIDUAL' | 'TEAM' | string;
  minTeamSize?: number;
  maxTeamSize?: number;
  category: {
    name: string;
    slug: string;
    color?: string | null;
  };
  organizer?: {
    name: string;
    avatarUrl?: string | null;
  } | null;
  status: string;
}

interface EventCardProps {
  event: EventCardData;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const percentFilled = Math.min(
    100,
    Math.round(((event.confirmedCount || 0) / (event.capacity || 1)) * 100)
  );

  const formatLabels: Record<string, { label: string; icon: any; color: string }> = {
    OFFLINE: { label: 'In-Person', icon: MapPin, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ONLINE: { label: 'Virtual', icon: Video, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    HYBRID: { label: 'Hybrid', icon: Sparkles, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const fmt = formatLabels[event.format] || formatLabels.OFFLINE;
  const FmtIcon = fmt.icon;

  const isAlmostFull = percentFilled >= 80 && !event.isFull;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      {/* Banner & Category Pill */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={
            event.bannerUrl ||
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-900 shadow-sm border border-slate-200/60">
            {event.category.name}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${fmt.color}`}>
            <FmtIcon className="w-3 h-3" />
            {fmt.label}
          </span>
        </div>

        {event.status !== 'PUBLISHED' && (
          <div className="absolute top-3 right-3">
            <StatusBadge status={event.status} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 mb-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {new Date(event.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              {new Date(event.startDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
            <Link to={`/events/${event.id}`}>{event.title}</Link>
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
            {event.shortDescription || event.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              {event.registrationType === 'TEAM' ? (
                <>
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Team ({event.minTeamSize}-{event.maxTeamSize})</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Individual</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{event.venue || 'Virtual Campus'}</span>
            </div>
          </div>
        </div>

        {/* Capacity Bar & Action */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">
              {event.confirmedCount} / {event.capacity} registered
            </span>
            {event.isFull ? (
              <span className="font-semibold text-amber-600">Waitlist Active</span>
            ) : isAlmostFull ? (
              <span className="font-semibold text-rose-600">Few Spots Left!</span>
            ) : (
              <span className="font-semibold text-emerald-600">{event.availableSpots} spots open</span>
            )}
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                event.isFull
                  ? 'bg-amber-500'
                  : isAlmostFull
                  ? 'bg-rose-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            {event.organizer && (
              <div className="flex items-center gap-2">
                <img
                  src={
                    event.organizer.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.organizer.name)}`
                  }
                  alt={event.organizer.name}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
                <span className="text-xs text-slate-600 truncate max-w-[110px]">
                  {event.organizer.name}
                </span>
              </div>
            )}

            <Link
              to={`/events/${event.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-auto group-hover:translate-x-0.5"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
