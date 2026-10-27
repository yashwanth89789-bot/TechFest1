import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';

export const PublicCertificateVerifyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const certIdParam = searchParams.get('id') || '';

  const [inputCode, setInputCode] = useState(certIdParam);
  const [loading, setLoading] = useState(Boolean(certIdParam));
  const [result, setResult] = useState<{
    isValid: boolean;
    certificate?: any;
    error?: string;
  } | null>(null);

  const verifyCertificate = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/certificates/verify/${encodeURIComponent(code.trim())}`);
      setResult(data);
    } catch (err: any) {
      setResult({
        isValid: false,
        error: err.message || 'Certificate number not recognized or revoked.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certIdParam) {
      verifyCertificate(certIdParam);
    }
  }, [certIdParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setSearchParams({ id: inputCode.trim() });
      verifyCertificate(inputCode.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Public Certificate Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Verify collegiate technical symposium credentials and hackathon participation authenticity.
        </p>
      </div>

      {/* Input Search Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="e.g. CERT-TECHFEST-2026-9041"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center mt-3">
          Tip: Test with sample seeded certificate: <strong className="text-indigo-600 font-mono">CERT-TECHFEST-2026-9041</strong>
        </p>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          {result.isValid && result.certificate ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500/30 shadow-xl overflow-hidden">
              {/* Verified Header */}
              <div className="bg-emerald-600 p-6 text-white text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Authentic Credential Verified</h2>
                <p className="text-xs text-emerald-100 font-mono mt-0.5">
                  ID: {result.certificate.certificateNumber}
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 block mb-1">
                    Awarded Recipient
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {result.certificate.recipientName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {result.certificate.recipient?.college || 'Imperial College of Engineering'} •{' '}
                    {result.certificate.recipient?.department || 'Computing'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 block mb-1">
                    Event & Discipline
                  </span>
                  <h4 className="text-base font-bold text-indigo-950">
                    {result.certificate.event?.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Category: {result.certificate.event?.category} • Organized by{' '}
                    {result.certificate.event?.organizer}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                      Issue Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(result.certificate.issuedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                      Status
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Valid & Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Certificate Not Found</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {result.error || 'The entered certificate number does not exist in our institutional database.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
