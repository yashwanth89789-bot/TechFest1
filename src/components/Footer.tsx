import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, MapPin, Phone, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white tracking-tight text-base">
                TechFest<span className="text-indigo-400">Hub</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-xs">
              The premier unified collegiate technical event registration and management platform. Empowering students, organizers, and campus innovators.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Event Categories</p>
            <ul className="space-y-2">
              <li>
                <Link to="/events?category=hackathons" className="hover:text-indigo-400 transition-colors">
                  Hackathons & Buildathons
                </Link>
              </li>
              <li>
                <Link to="/events?category=coding-contests" className="hover:text-indigo-400 transition-colors">
                  Competitive Coding Contests
                </Link>
              </li>
              <li>
                <Link to="/events?category=workshops" className="hover:text-indigo-400 transition-colors">
                  Hands-on Masterclasses
                </Link>
              </li>
              <li>
                <Link to="/events?category=robotics" className="hover:text-indigo-400 transition-colors">
                  Robotics & Autonomous Arena
                </Link>
              </li>
              <li>
                <Link to="/events?category=ai-ml" className="hover:text-indigo-400 transition-colors">
                  AI & Machine Learning Sprints
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Platform</p>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="hover:text-indigo-400 transition-colors">
                  Explore All Events
                </Link>
              </li>
              <li>
                <Link to="/tickets" className="hover:text-indigo-400 transition-colors">
                  Digital QR Tickets
                </Link>
              </li>
              <li>
                <Link to="/certificates" className="hover:text-indigo-400 transition-colors">
                  Verified Certificates
                </Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-indigo-400 transition-colors">
                  Team Formation & Codes
                </Link>
              </li>
              <li>
                <Link to="/organizer" className="hover:text-indigo-400 transition-colors">
                  Organizer Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Contact & Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Campus Contact</p>
            <div className="space-y-2 text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Dept. of Computing & Innovation, Campus Quad 4</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>support@techfesthub.college.edu</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>+1 (555) 019-2830 (Ext 402)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} TechFest Hub Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Student Code of Conduct</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
