import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { CertificateCard } from '../../components/CertificateCard.tsx';

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const data = await apiRequest('/certificates/me');
        setCertificates(data || []);
      } catch (err: any) {
        showToast('error', 'Error', err.message || 'Failed to fetch certificates.');
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Verified Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official collegiate technical achievement credentials issued for verified event attendance.
          </p>
        </div>

        <Link
          to="/verify-certificate"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Public Credential Verifier</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1].map((i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No certificates issued yet</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Certificates are issued by authorized event organizers and administrators following verified attendance at competitions and symposiums.
          </p>
          <Link
            to="/events"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Explore Active Events
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
};
