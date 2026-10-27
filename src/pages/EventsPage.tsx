import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Compass,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { EventCard, EventCardData } from '../components/EventCard.tsx';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<EventCardData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters from URL or default
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedFormat = searchParams.get('format') || '';
  const selectedMode = searchParams.get('mode') || '';
  const sortBy = searchParams.get('sortBy') || 'date_asc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local search input state
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Fetch categories once
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await apiRequest('/events/categories/all');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch events on filter change
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (searchQuery) query.set('search', searchQuery);
        if (selectedCategory) query.set('category', selectedCategory);
        if (selectedFormat) query.set('format', selectedFormat);
        if (selectedMode) query.set('mode', selectedMode);
        query.set('sortBy', sortBy);
        query.set('page', page.toString());
        query.set('limit', '12');

        const data = await apiRequest(`/events?${query.toString()}`);
        setEvents(data.events || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [searchQuery, selectedCategory, selectedFormat, selectedMode, sortBy, page]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // Reset to page 1 on filter change if not changing page
    if (!('page' in updates)) {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || null });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedFormat || selectedMode || sortBy !== 'date_asc'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Discover Competitions & Workshops</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore Technical Events
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Filter through hackathons, competitive programming sprints, robotics challenges, and research seminars.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Top Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by title, description, or venue..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <button
            onClick={() => updateFilters({ category: null })}
            className={`px-3 py-1.5 rounded-full border transition-all shrink-0 ${
              !selectedCategory
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateFilters({ category: cat.slug })}
              className={`px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filter Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => updateFilters({ format: e.target.value || null })}
                className="py-1 px-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none font-medium"
              >
                <option value="">All Formats</option>
                <option value="OFFLINE">In-Person</option>
                <option value="ONLINE">Virtual</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Participation:</span>
              <select
                value={selectedMode}
                onChange={(e) => updateFilters({ mode: e.target.value || null })}
                className="py-1 px-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none font-medium"
              >
                <option value="">All Types</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="TEAM">Team Only</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="py-1 px-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none font-medium"
              >
                <option value="date_asc">Event Date (Soonest first)</option>
                <option value="date_desc">Event Date (Latest first)</option>
                <option value="newest">Recently Added</option>
                <option value="capacity">Capacity (Highest first)</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No events matched your criteria</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Try adjusting your search keywords, clearing categories, or exploring other technical disciplines.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
                <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total}{' '}
                total events)
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => updateFilters({ page: (pagination.page - 1).toString() })}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateFilters({ page: (pagination.page + 1).toString() })}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
