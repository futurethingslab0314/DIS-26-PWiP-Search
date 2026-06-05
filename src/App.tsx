import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Calendar, 
  Tag, 
  User, 
  SlidersHorizontal, 
  Grid, 
  List, 
  X, 
  ArrowUpDown, 
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

import { POSTER_DATASET } from './data/posters';
import { Poster, PosterApiResponse, PresentationDay } from './types';
import DisLogo from './components/DisLogo';

const DAY_OPTIONS: PresentationDay[] = ['Monday (15th)', 'Tuesday (16th)', 'Wednesday (17th)'];
const POSTER_API_URL = import.meta.env.VITE_POSTER_DATA_URL || '/api/posters';

function formatThemeLabel(theme: string) {
  return theme.replace(/^\d+\.\s*/, '');
}

function getThemeTableStyles(theme: string) {
  if (theme.startsWith('1.')) {
    return {
      rowClassName: 'bg-[#FFF7F7] hover:bg-[#FCEBEC]',
      themeCellClassName: 'bg-[#F8DCDD] text-[#7D1820]',
    };
  }

  if (theme.startsWith('2.')) {
    return {
      rowClassName: 'bg-[#F7FBF5] hover:bg-[#EAF5E3]',
      themeCellClassName: 'bg-[#DDEED2] text-[#2F5D1D]',
    };
  }

  return {
    rowClassName: 'bg-[#F6F8FC] hover:bg-[#E8EEF9]',
    themeCellClassName: 'bg-[#DCE6F8] text-[#244A86]',
  };
}

export default function App() {
  // --- States ---
  const [posters, setPosters] = useState<Poster[]>(POSTER_DATASET);
  const [dataSource, setDataSource] = useState<'google-sheet' | 'fallback'>('fallback');
  const [dataError, setDataError] = useState<string>('');
  const [isLoadingPosters, setIsLoadingPosters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [selectedDay, setSelectedDay] = useState<PresentationDay | 'All'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<'theme' | 'paperId' | 'title' | 'contactAuthor' | 'presentationDay'>('paperId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosters() {
      try {
        setIsLoadingPosters(true);
        const response = await fetch(POSTER_API_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Poster API returned ${response.status}`);
        }

        const payload = (await response.json()) as PosterApiResponse;
        if (!payload.posters?.length) {
          throw new Error('Poster API returned no poster rows.');
        }

        setPosters(payload.posters);
        setDataSource(payload.source);
        setDataError(payload.error ?? '');
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load Google Sheet data.';
        setPosters(POSTER_DATASET);
        setDataSource('fallback');
        setDataError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPosters(false);
        }
      }
    }

    loadPosters();

    return () => controller.abort();
  }, []);

  // --- Theme Tracks Lookup ---
  const themeTracks = useMemo(() => {
    const list = Array.from(new Set(posters.map((poster) => poster.theme)));
    return ['All', ...list.sort()];
  }, [posters]);

  // --- Handlers ---
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTheme('All');
    setSelectedDay('All');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleQuickStatClick = (type: 'all' | 'monday' | 'tuesday' | 'wednesday') => {
    // Interactive shortcuts inside numerical widgets
    handleClearFilters();
    switch (type) {
      case 'monday':
        setSelectedDay('Monday (15th)');
        break;
      case 'tuesday':
        setSelectedDay('Tuesday (16th)');
        break;
      case 'wednesday':
        setSelectedDay('Wednesday (17th)');
        break;
      default:
        break;
    }
  };

  // --- Filter and Sort Core Logic ---
  const filteredPosters = useMemo(() => {
    return posters.filter(poster => {
      // 1. Full-text matches query (combining ID, title, author, email, abstract)
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        poster.paperId.toLowerCase().includes(query) ||
        poster.title.toLowerCase().includes(query) ||
        poster.contactAuthor.toLowerCase().includes(query) ||
        (poster.contactEmail && poster.contactEmail.toLowerCase().includes(query)) ||
        (poster.abstract && poster.abstract.toLowerCase().includes(query));

      // 2. Track theme filter
      const matchesTheme = selectedTheme === 'All' || poster.theme === selectedTheme;

      // 3. Presentation day filter
      const matchesDay = selectedDay === 'All' || poster.presentationDay === selectedDay;

      return matchesSearch && matchesTheme && matchesDay;
    }).sort((a, b) => {
      let valueA = a[sortField] || '';
      let valueB = b[sortField] || '';

      // Normalize presentation day for semantic sorting rather than lexical
      if (sortField === 'presentationDay') {
        const dayWeight = (day: string) => {
          if (day.includes('Monday')) return 1;
          if (day.includes('Tuesday')) return 2;
          if (day.includes('Wednesday')) return 3;
          return 99;
        };
        valueA = dayWeight(valueA).toString();
        valueB = dayWeight(valueB).toString();
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [posters, searchQuery, selectedTheme, selectedDay, sortField, sortOrder]);

  // --- Statistics Computing ---
  const stats = useMemo(() => {
    const total = posters.length;
    const mondayCount = posters.filter((poster) => poster.presentationDay?.includes('Monday')).length;
    const tuesdayCount = posters.filter((poster) => poster.presentationDay?.includes('Tuesday')).length;
    const wednesdayCount = posters.filter((poster) => poster.presentationDay?.includes('Wednesday')).length;

    return { total, mondayCount, tuesdayCount, wednesdayCount };
  }, [posters]);

  // --- Rich Highlight Match Helper ---
  const renderHighlighted = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((p, idx) => 
          regex.test(p) ? (
            <mark key={idx} className="bg-yellow-100 text-stone-900 px-0.5 rounded-xs font-semibold">
              {p}
            </mark>
          ) : (
            <span key={idx}>{p}</span>
          )
        )}
      </>
    );
  };

  // --- CSS classes mapping based on presentation day ---
  const getDayLabelBadgeStyles = (day: string) => {
    if (day.includes('Monday')) {
      return 'bg-red-50 text-red-800 border-red-100 bg-[#FDE8E8] text-[#9B1C1C] border-[#FBD5D5]';
    }
    if (day.includes('Tuesday')) {
      return 'bg-emerald-50 text-emerald-800 border bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]';
    }
    if (day.includes('Wednesday')) {
      return 'bg-sky-50 text-sky-800 border bg-[#EBF5FF] text-[#1E429F] border-[#C3DDFD]';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#ffffff] font-sans antialiased text-[#1a1a1a] flex flex-col justify-between">
      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-6 py-10 sm:px-10 space-y-8 flex-1">
        
        {/* Academic Header and Brand Identity */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-black pb-6 gap-6" id="app-academic-header">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <DisLogo />
            </div>
            <div>
              <div className="space-y-2 mt-2">
                <p className="text-zinc-500 font-sans text-xs tracking-wider uppercase font-semibold">
                  Posters & Work in Progress Companion
                </p>
                <div id="attendance-disclaimer-panel" className="text-xs bg-zinc-50 border border-zinc-200 p-5 max-w-4xl leading-relaxed text-zinc-800 font-sans shadow-2xs space-y-3 rounded-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[11px] uppercase font-mono font-bold text-black tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#901A1E] rounded-full inline-block"></span>
                        Lunch Break Station Attendance
                      </h4>
                      <p className="text-stone-600 font-sans text-xs pl-3 leading-relaxed">
                        The specific day indicates when the author preferentially intends to be present at their poster station for presentation and discussion during the conference <strong>Lunch Break (12:30 – 14:00)</strong>.
                      </p>
                    </div>

                    <div className="md:border-l md:border-zinc-200 md:pl-4">
                      <h4 className="text-[11px] uppercase font-mono font-bold text-black tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#901A1E] rounded-full inline-block"></span>
                        3-Day Full Exhibition & Connection
                      </h4>
                      <p className="text-stone-600 font-sans text-xs pl-3 leading-relaxed">
                        All physical posters remain <strong>on display during all 3 days of the conference</strong>. Attendees are welcome to visit their posters at any time and connect with authors via email.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-3 flex items-start gap-2 text-zinc-500 text-[11px] pl-3 italic font-sans animate-pulse">
                    <span className="font-mono font-bold text-[#901A1E] uppercase not-italic">EXHIBITION RECEPTION DINNER:</span>
                    <span>
                      In addition, <strong>all registered authors</strong> will also be physically present at their posters on <strong>Monday (June 15)</strong> during the official afternoon <strong>Exhibition Reception Dinner</strong> to discuss with fellow attendees.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 font-bold">VIEW:</span>
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200" id="list-grid-viewmode-toggle">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-black font-bold shadow-xs border border-zinc-200'
                    : 'text-zinc-500 hover:text-black'
                }`}
                title="Spreadsheet list layout (matches reference)"
              >
                <List className="w-3.5 h-3.5" />
                <span>Spreadsheet</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-black font-bold shadow-xs border border-zinc-200'
                    : 'text-zinc-500 hover:text-black'
                }`}
                title="Modern card grid layout"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Card Grid</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Numerical Statistics Overview (Interactive Shortcuts) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4" id="statistics-banner">
          
          <button
            onClick={() => handleQuickStatClick('all')}
            className={`text-left p-5 transition-all text-stone-800 border cursor-pointer ${
              selectedTheme === 'All' && selectedDay === 'All'
                ? 'border-black bg-zinc-50 ring-1 ring-black/10' 
                : 'border-[#e5e5e5] bg-white hover:border-black'
            }`}
          >
            <div className="meta-label">Total Posters</div>
            <div className="text-3xl font-display font-bold text-stone-950 mt-1">{stats.total}</div>
            <div className="text-[9px] font-mono text-zinc-400 mt-1.5 uppercase tracking-wide">All Tracks</div>
          </button>

          <button
            onClick={() => handleQuickStatClick('monday')}
            className={`text-left p-5 transition-all text-stone-800 border cursor-pointer ${
              selectedDay === 'Monday (15th)'
                ? 'border-dis bg-red-50/10 ring-1 ring-dis/10' 
                : 'border-[#e5e5e5] bg-white hover:border-[#901A1E]'
            }`}
          >
            <div className="meta-label flex items-center gap-1 text-[#901A1E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#901A1E]" />
              Mon 15th
            </div>
            <div className="text-3xl font-display font-bold text-stone-950 mt-1">{stats.mondayCount}</div>
            <div className="text-[9px] font-mono text-zinc-400 mt-1.5 uppercase tracking-wide">June 15</div>
          </button>

          <button
            onClick={() => handleQuickStatClick('tuesday')}
            className={`text-left p-5 transition-all text-stone-800 border cursor-pointer ${
              selectedDay === 'Tuesday (16th)'
                ? 'border-dis bg-red-50/10 ring-1 ring-dis/10' 
                : 'border-[#e5e5e5] bg-white hover:border-[#901A1E]'
            }`}
          >
            <div className="meta-label flex items-center gap-1 text-[#03543F]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Tue 16th
            </div>
            <div className="text-3xl font-display font-bold text-stone-950 mt-1">{stats.tuesdayCount}</div>
            <div className="text-[9px] font-mono text-zinc-400 mt-1.5 uppercase tracking-wide">June 16</div>
          </button>

          <button
            onClick={() => handleQuickStatClick('wednesday')}
            className={`text-left p-5 transition-all text-stone-800 border cursor-pointer ${
              selectedDay === 'Wednesday (17th)'
                ? 'border-dis bg-red-50/10 ring-1 ring-dis/10' 
                : 'border-[#e5e5e5] bg-white hover:border-[#901A1E]'
            }`}
          >
            <div className="meta-label flex items-center gap-1 text-[#1E429F]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              Wed 17th
            </div>
            <div className="text-3xl font-display font-bold text-stone-950 mt-1">{stats.wednesdayCount}</div>
            <div className="text-[9px] font-mono text-zinc-400 mt-1.5 uppercase tracking-wide">June 17</div>
          </button>

        </section>

        {/* Minimalist Date Tabs & Interactive Filters Component (Matches Design HTML) */}
        <section className="py-4 border-b border-black space-y-6" id="minimalist-date-filters">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Horizontal Dates Underlined Menu */}
            <div className="flex gap-8 border-b-0 flex-wrap">
              <button 
                onClick={() => { setSelectedDay('All'); }}
                className={`pb-1 text-sm transition-colors font-mono cursor-pointer uppercase ${
                  selectedDay === 'All'
                    ? 'filter-btn-active font-semibold' 
                    : 'text-zinc-400 hover:text-black font-semibold'
                }`}
              >
                ALL DATES
              </button>
              {DAY_OPTIONS.map((day) => (
                <button 
                  key={day}
                  onClick={() => { setSelectedDay(day); }}
                  className={`pb-1 text-sm transition-colors font-mono cursor-pointer uppercase ${
                    selectedDay === day
                      ? 'filter-btn-active font-semibold' 
                      : 'text-zinc-400 hover:text-black font-semibold'
                  }`}
                >
                  {day.replace(/\(.+\)/, '').trim().replace('Monday', 'JUNE 15').replace('Tuesday', 'JUNE 16').replace('Wednesday', 'JUNE 17')}
                </button>
              ))}
            </div>

            {/* Simple Rounded Theme Select Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="meta-label">Themes:</span>
              <div className="flex flex-wrap gap-1.5">
                {themeTracks.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSelectedTheme(theme)}
                    className={`px-3 py-1 text-[11px] font-medium border rounded-full transition-all cursor-pointer ${
                      selectedTheme === theme
                        ? 'bg-black text-white border-black font-medium'
                        : 'border-zinc-205 text-zinc-650 hover:border-[#901A1E] bg-white'
                    }`}
                  >
                    {theme === 'All' ? 'All' : formatThemeLabel(theme)}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Full-text Academic Search Field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center justify-content pointer-events-none text-zinc-400" aria-hidden="true">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search Paper ID, title words, author, or abstract text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-3 bg-zinc-50 border border-zinc-200 text-sm focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black focus:bg-white text-zinc-900 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-black"
                aria-label="Clear query search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active filter label list */}
          {(searchQuery || selectedTheme !== 'All' || selectedDay !== 'All') && (
            <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">ACTIVE SPECIFICATIONS:</span>
                
                {searchQuery && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-zinc-100 text-[10px] font-mono text-zinc-800 uppercase tracking-tight">
                    <span>"{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {selectedTheme !== 'All' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-zinc-100 text-[10px] font-mono text-zinc-800 uppercase tracking-tight">
                    <span>{formatThemeLabel(selectedTheme)}</span>
                    <button onClick={() => setSelectedTheme('All')} className="hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {selectedDay !== 'All' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-zinc-100 text-[10px] font-mono text-zinc-800 uppercase tracking-tight">
                    <span>{selectedDay.split(' ')[0]}</span>
                    <button onClick={() => setSelectedDay('All')} className="hover:text-black"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              <button
                onClick={handleClearFilters}
                className="text-[10px] font-mono font-bold text-[#901A1E] hover:underline transition-all flex items-center gap-1 uppercase tracking-wider"
                id="clear-filters-action"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Search Filters
              </button>
            </div>
          )}
        </section>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-wider" id="results-meta-indicators">
          <span className="uppercase">
            {filteredPosters.length} Posters Filtered // {posters.length} Total Registered
          </span>
          <span className="uppercase text-right">
            {isLoadingPosters
              ? 'Loading poster data...'
              : dataSource === 'google-sheet'
                ? 'Live from Google Sheet'
                : 'Using fallback dataset'}
            {dataError ? ` // ${dataError}` : ''}
          </span>
        </div>

        {/* Main Content Area */}
        <main>
          {filteredPosters.length === 0 ? (
            /* Empy State Finder */
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs" id="empty-results-box">
              <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mx-auto text-stone-400 border border-stone-150">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-stone-900">No matching posters found</h3>
                <p className="text-sm text-stone-500 font-sans">
                  Try clearing your search query or setting the Theme/Day dropdowns to "All Themes Tracks" to broaden your search.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center bg-dis text-white hover:bg-dis-dark px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-xs"
                id="reset-empty-filters-btn"
              >
                Clear All Filter Conditions
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* 1. SPREADSHEET DETAIL VIEW (Strict visual replica of the reference screenshot) */
            <div className="bg-white rounded-none border border-black shadow-xs overflow-hidden" id="spreadsheet-container">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm" id="spreadsheet-table">
                  {/* Table Header matching the header format */}
                  <thead className="bg-white text-black font-mono text-xs uppercase tracking-wider border-b-2 border-black" id="table-head">
                    <tr>
                      <th 
                        onClick={() => handleSort('theme')}
                        className="py-4 px-4 font-bold border-r border-zinc-200 cursor-pointer hover:bg-zinc-50 select-none min-w-[220px]"
                      >
                        <div className="flex items-center justify-between">
                          <span>Theme</span>
                          <ArrowUpDown className={`w-3.5 h-3.5 ml-1 ${sortField === 'theme' ? 'text-black font-bold' : 'text-zinc-400'}`} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('paperId')}
                        className="py-4 px-4 font-bold border-r border-zinc-200 cursor-pointer hover:bg-zinc-50 select-none whitespace-nowrap"
                      >
                        <div className="flex items-center justify-between">
                          <span>Paper ID</span>
                          <ArrowUpDown className={`w-3.5 h-3.5 ml-1 ${sortField === 'paperId' ? 'text-black font-bold' : 'text-zinc-400'}`} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('title')}
                        className="py-4 px-4 font-bold border-r border-zinc-200 cursor-pointer hover:bg-zinc-50 select-none min-w-[320px]"
                      >
                        <div className="flex items-center justify-between">
                          <span>Title</span>
                          <ArrowUpDown className={`w-3.5 h-3.5 ml-1 ${sortField === 'title' ? 'text-black font-bold' : 'text-zinc-400'}`} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('contactAuthor')}
                        className="py-4 px-4 font-bold border-r border-zinc-200 cursor-pointer hover:bg-zinc-50 select-none min-w-[170px]"
                      >
                        <div className="flex items-center justify-between">
                          <span>Contact Author</span>
                          <ArrowUpDown className={`w-3.5 h-3.5 ml-1 ${sortField === 'contactAuthor' ? 'text-black font-bold' : 'text-zinc-400'}`} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('presentationDay')}
                        className="py-4 px-4 font-bold cursor-pointer hover:bg-zinc-50 select-none min-w-[210px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col text-left">
                            <span>Lunch Attendance Slot</span>
                            <span className="text-[9px] font-mono font-normal normal-case text-zinc-500 mt-0.5 animate-pulse">12:30 – 14:00 Phys. Presence</span>
                          </div>
                          <ArrowUpDown className={`w-3.5 h-3.5 ml-1 ${sortField === 'presentationDay' ? 'text-black font-bold' : 'text-zinc-400'}`} />
                        </div>
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-zinc-200 bg-white" id="table-body">
                    {filteredPosters.map((poster, index) => {
                      const themeStyles = getThemeTableStyles(poster.theme);

                      return (
                        <tr 
                          key={poster.paperId}
                          className={`${themeStyles.rowClassName} transition-colors`}
                        >
                          {/* Theme Column */}
                          <td className={`py-3 px-4 text-xs font-semibold border-r border-zinc-150 max-w-[260px] truncate uppercase tracking-tight ${themeStyles.themeCellClassName}`}>
                            {poster.theme.split('. ')[1] || poster.theme}
                          </td>

                          {/* Paper ID */}
                          <td className="py-3 px-4 font-mono text-xs font-bold text-stone-900 border-r border-zinc-150 whitespace-nowrap">
                            {renderHighlighted(poster.paperId, searchQuery)}
                          </td>

                          {/* Title Column */}
                          <td className="py-3 px-4 text-sm font-semibold text-stone-900 border-r border-zinc-150 leading-snug">
                            {renderHighlighted(poster.title, searchQuery)}
                          </td>

                          {/* Author Column */}
                          <td className="py-3 px-4 text-xs font-medium text-stone-800 border-r border-zinc-150">
                            <div className="space-y-0.5">
                              <span className="block font-semibold text-stone-900">
                                {renderHighlighted(poster.contactAuthor, searchQuery)}
                              </span>
                              {poster.contactEmail && (
                                <span className="block font-mono text-[10px] text-zinc-400 lowercase italic">
                                  {poster.contactEmail}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Presentation day matching colors in user screenshot */}
                          <td className="py-3 px-4 text-xs">
                            {poster.presentationDay ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className={`inline-block px-3 py-1 rounded-none border ${getDayLabelBadgeStyles(poster.presentationDay)} text-[10px] font-mono font-bold uppercase tracking-tight w-full text-center transition-all`}>
                                  {poster.presentationDay.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tight text-center">Lunch 12:30–14:00</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 font-mono italic text-[10px] block w-full text-center">Unassigned</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 2. MODERN CARD GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="cards-grid">
              {filteredPosters.map((poster) => {
                return (
                  <article
                    key={poster.paperId}
                    className="poster-card relative p-6 flex flex-col justify-between rounded-none"
                  >
                    {/* Top Section */}
                    <div className="space-y-4">
                      {/* Theme Indicator & ID */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono text-dis font-bold tracking-widest uppercase max-w-[200px] truncate">
                          {poster.theme.split('. ')[1] || poster.theme}
                        </span>
                        
                        <span className="text-[10px] font-mono font-bold text-stone-500 bg-zinc-100 px-2 py-0.5 rounded-none border border-zinc-200">
                          {poster.paperId}
                        </span>
                      </div>

                      {/* Poster Title */}
                      <h3 className="font-display font-bold text-base text-stone-900 leading-snug clamp-3">
                        {renderHighlighted(poster.title, searchQuery)}
                      </h3>
                    </div>

                    {/* Bottom Metadata row */}
                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                      
                      {/* Author Details */}
                      <div className="min-w-0 flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-stone-450 flex-shrink-0" />
                        <span className="text-xs font-semibold text-stone-800 truncate">
                          {renderHighlighted(poster.contactAuthor, searchQuery)}
                        </span>
                      </div>

                      {/* Presentation Day Pill & Action Badge */}
                      <div className="flex flex-col items-end space-y-0.5 flex-shrink-0">
                        {poster.presentationDay ? (
                          <>
                            <span className={`inline-block px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded-none border text-center ${getDayLabelBadgeStyles(poster.presentationDay)}`}>
                              {poster.presentationDay.split(' ')[0]} {/* Shorter text for space constraints */}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">Lunch 12:30–14:00</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-mono italic">Unassigned</span>
                        )}
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

      </div>

      {/* Scholarly Minimal Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 text-stone-400 py-8 px-4 text-xs font-mono select-none" id="app-footer">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div>
              &copy; 2026 ACM DIS PWiP Poster Search.
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-dis-accent font-bold">DIS 2026</span>
            <span className="text-stone-600">|</span>
            <span className="text-[10px] text-stone-500">Singapore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
