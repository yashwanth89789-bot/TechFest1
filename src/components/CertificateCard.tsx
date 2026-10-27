import React from 'react';
import { Award, CheckCircle2, Download, ExternalLink, Printer } from 'lucide-react';

interface CertificateProps {
  certificate: {
    id: string;
    certificateNumber: string;
    title: string;
    recipientName: string;
    issuedAt: string;
    verificationUrl?: string | null;
    event: {
      title: string;
      category?: { name: string };
      startDate: string;
      endDate: string;
      organizer?: { name: string };
    };
  };
}

export const CertificateCard: React.FC<CertificateProps> = ({ certificate }) => {
  const handlePrint = () => {
    window.print();
  };

  const verifyUrl = `/verify-certificate?id=${certificate.certificateNumber}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Decorative Collegiate Certificate Frame */}
      <div className="p-8 sm:p-10 relative bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-b border-slate-100">
        {/* Certificate Outer Border */}
        <div className="border-4 border-double border-indigo-900/20 p-6 sm:p-8 rounded-xl text-center relative overflow-hidden">
          {/* Subtle Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-80 h-80 text-indigo-900" />
          </div>

          <div className="relative z-10">
            {/* Header / College Crest */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 mb-3 shadow-inner">
              <Award className="w-7 h-7" />
            </div>

            <p className="text-xs font-mono font-bold tracking-[0.25em] text-indigo-950 uppercase">
              TechFest Hub Collegiate Technical Symposium
            </p>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 font-serif">
              Certificate of Achievement
            </h2>

            <p className="text-xs text-slate-600 mt-2 italic">This is proudly presented to</p>

            {/* Recipient Name */}
            <p className="text-2xl sm:text-3xl font-bold text-indigo-900 mt-2 font-serif border-b-2 border-indigo-100 inline-block px-8 pb-1">
              {certificate.recipientName}
            </p>

            <p className="text-xs text-slate-600 mt-4 max-w-lg mx-auto leading-relaxed">
              for active participation and verified attendance at{' '}
              <strong className="text-slate-900 font-semibold">{certificate.event.title}</strong>,
              demonstrating technical excellence, problem-solving, and collegiate innovation.
            </p>

            {/* Certificate Footer Metadata */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                  Date of Issue
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                  Certificate ID
                </p>
                <p className="text-xs font-mono font-semibold text-indigo-900">
                  {certificate.certificateNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Bar */}
      <div className="p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Cryptographically Verified Credential</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Public Verification
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save
          </button>
        </div>
      </div>
    </div>
  );
};
