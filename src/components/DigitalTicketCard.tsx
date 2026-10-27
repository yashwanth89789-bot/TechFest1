import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Calendar, MapPin, Printer, ShieldCheck, User, Users, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge.tsx';

interface DigitalTicketProps {
  registration: {
    id: string;
    registrationNumber: string;
    status: string;
    notes?: string | null;
    createdAt: string;
    event: {
      id: string;
      title: string;
      format: string;
      venue?: string | null;
      onlineLink?: string | null;
      startDate: string;
      endDate: string;
    };
    team?: {
      id: string;
      name: string;
      code: string;
    } | null;
    ticket?: {
      ticketToken: string;
      qrCodeData: string;
      issuedAt: string;
    } | null;
    attendance?: {
      checkedInAt: string;
      checkInMethod: string;
    } | null;
  };
  userName?: string;
  userEmail?: string;
}

export const DigitalTicketCard: React.FC<DigitalTicketProps> = ({
  registration,
  userName,
  userEmail,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (registration.ticket?.qrCodeData) {
      QRCode.toDataURL(registration.ticket.qrCodeData, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [registration.ticket]);

  const handlePrint = () => {
    window.print();
  };

  const isAttended = Boolean(registration.attendance);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md"
    >
      {/* Left / Main Details */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
        <div>
          {/* Header & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider uppercase px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                Official E-Ticket
              </span>
              <StatusBadge status={registration.status} />
              {isAttended && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Checked In
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-slate-600">
              Ref: <strong className="text-slate-800">{registration.registrationNumber}</strong>
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {registration.event.title}
          </h3>

          {/* Event Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {new Date(registration.event.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {new Date(registration.event.startDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(registration.event.endDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:col-span-2">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">
                {registration.event.venue || registration.event.onlineLink || 'Virtual Campus Event'}
              </span>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Attendee Name
              </p>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <User className="w-4 h-4 text-slate-600" />
                <span>{userName || 'Registered Student'}</span>
              </div>
              {userEmail && <p className="text-xs text-slate-600 font-mono mt-0.5">{userEmail}</p>}
            </div>

            {registration.team && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Team
                </p>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{registration.team.name}</span>
                </div>
                <p className="text-xs text-indigo-600 font-mono mt-0.5">Code: {registration.team.code}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between no-print">
          <p className="text-xs text-slate-600">
            Present this QR code on mobile or printed copy at event check-in.
          </p>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Ticket
          </button>
        </div>
      </div>

      {/* Right / QR Code Stub */}
      <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col items-center justify-center min-w-[240px] text-center">
        {qrDataUrl ? (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block">
            <img
              src={qrDataUrl}
              alt="Digital QR Ticket"
              className="w-40 h-40 object-contain mx-auto"
            />
          </div>
        ) : (
          <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-600">
            Generating QR...
          </div>
        )}

        <div className="mt-3">
          <p className="text-xs font-mono font-medium text-slate-800 tracking-wider">
            {registration.ticket?.ticketToken ? (
              registration.ticket.ticketToken.slice(0, 18) + '...'
            ) : (
              'TOKEN_ACTIVE'
            )}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">Verified Digital Check-In Code</p>
        </div>
      </div>
    </div>
  );
};
