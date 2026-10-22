import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConstructionProject } from '../types';
import { getDefaultDashboardForRole, ROLE_META_DATA } from '../services/permissions';
import {
  HardHat,
  Building2,
  Home,
  Layers,
  CheckCircle2,
  Clock,
  Sliders,
  Award,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Search,
  Filter,
  LogIn,
  UserCheck,
  Compass,
  FileCheck,
  Menu,
  X,
  ExternalLink,
  Users
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, id?: string) => void;
  onLoginClick: () => void;
}

// Curated high-resolution construction & architectural photography
const PROJECT_FALLBACK_IMAGES: Record<string, string> = {
  'PRJ-01': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80', // Emerald Heights (High-rise towers)
  'PRJ-02': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80', // Green Valley Villas (Luxury villas)
  'PRJ-03': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', // Solitaire House (Architect bungalow)
  'PRJ-04': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', // Grand Horizon
  'PRJ-05': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', // Silicon Meadows
  'PRJ-06': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80', // Cyber Crest
  'PRJ-07': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80', // Deccan Palms
  'PRJ-08': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', // Bayview Terraces
  'PRJ-09': '/images/modern-duplex-house-elevation-design-vijayawada.jpeg'  // Amaravati Enclave (Vijayawada Modern Duplex)
};

// Generic placeholder based on property type
function getProjectImage(project: ConstructionProject): string {
  if (project.coverImage) return project.coverImage;
  if (PROJECT_FALLBACK_IMAGES[project.id]) return PROJECT_FALLBACK_IMAGES[project.id];
  if (project.type === 'Apartment Complex') {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
  }
  if (project.type === 'Villa Community' || project.type === 'Individual Villa') {
    return 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80';
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLoginClick }) => {
  const { projects } = useData();
  const { currentUser, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Contact form submission state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    project: 'Emerald Heights Residences',
    message: ''
  });

  // Extract unique states for filter
  const states = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.state))).filter(Boolean);
  }, [projects]);

  // Extract unique property types for filter
  const types = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.type))).filter(Boolean);
  }, [projects]);

  // Filter projects for public portfolio (safe public data only)
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchState = selectedState === 'all' || p.state === selectedState;
      const matchType = selectedType === 'all' || p.type === selectedType;
      const matchSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchType && matchSearch;
    });
  }, [projects, selectedState, selectedType, searchQuery]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', phone: '', project: 'Emerald Heights Residences', message: '' });
    }, 1000);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* -------------------- 1. PUBLIC NAVBAR -------------------- */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-amber-500/30 p-1 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/images/logo.png" alt="ArthiBuild Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Arthi<span className="text-amber-400">Build</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 rounded border border-slate-700">
                  CMS v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Construction Project Tracking & Customer Management
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-300">
            <button 
              onClick={() => scrollToSection('hero')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('projects')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Our Projects
            </button>
            <button 
              onClick={() => scrollToSection('categories')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Property Categories
            </button>
            <button 
              onClick={() => scrollToSection('services')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              About Us
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Contact
            </button>
          </nav>

          {/* Right Action: Prominent Login Button or Authenticated Dashboard Switch */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(getDefaultDashboardForRole(currentUser.role))}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>Go to My Dashboard</span>
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
            <button 
              onClick={() => scrollToSection('hero')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('projects')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              Our Projects
            </button>
            <button 
              onClick={() => scrollToSection('categories')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              Property Categories
            </button>
            <button 
              onClick={() => scrollToSection('services')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              About Us
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="block w-full text-left py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
            >
              Contact
            </button>

            <div className="pt-3 border-t border-slate-800">
              {isAuthenticated && currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(getDefaultDashboardForRole(currentUser.role));
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Open My Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Portal Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* -------------------- 2. HERO SECTION -------------------- */}
      <section 
        id="hero"
        className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800"
      >
        {/* Subtle Architectural Grid & Flare Overlays */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(251, 191, 36, 0.25) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Construction & Handover Intelligence</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Building Your Vision, <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Tracking Every Milestone
                </span>
              </h1>

              {/* Platform Description */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                ArthiBuild is the premier construction tracking and customer management system engineered for residential developers, project leaders, site engineers, and verified homebuyers. Experience full transparency across South India with live 15-stage critical path execution, contractual package governance, and dedicated role portals.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('projects')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Explore Construction Projects</span>
                </button>

                <button
                  onClick={onLoginClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Client & Staff Login</span>
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-xl font-black text-amber-400 font-mono">9 Sites</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">TN & Karnataka</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-xl font-black text-amber-400 font-mono">40+ Units</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tracked Properties</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-xl font-black text-emerald-400 font-mono">15 Stages</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Critical Path Engine</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-xl font-black text-sky-400 font-mono">4 Portals</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Role Protected</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/80 shadow-2xl p-2 group">
                <img
                  src="/images/modern-duplex-house-elevation-design-vijayawada.jpeg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('conceptecture.com')) {
                      target.src = 'https://conceptecture.com/assets/modern-duplex-house-elevation-design-vijayawada.-Pg3-1O8e.jpeg';
                    }
                  }}
                  alt="Modern Duplex House Elevation Design - ArthiBuild"
                  className="w-full h-80 sm:h-96 object-cover rounded-xl group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent rounded-xl" />
                
                {/* Floating Glassmorphic Pill */}
                <div className="absolute bottom-5 left-5 right-5 p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Live Site Transparency
                    </span>
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Real-Time Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Homebuyers view verified progress photos, stage completions, and delivery forecasts specifically for their contracted property unit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 3. PORTFOLIO / OUR PROJECTS SECTION -------------------- */}
      <section id="projects" className="py-20 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Current Development Portfolio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Featured Construction Projects & Sites
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Explore ongoing residential developments managed through ArthiBuild. Every site adheres to location-based hierarchy: State → City → Locality → Construction Site.
            </p>
          </div>

          {/* Search & Cascading Filter Controls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-lg flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, city, or locality..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Filter className="w-3.5 h-3.5" />
                <span>State:</span>
              </div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden"
              >
                <option value="all">All States ({states.length})</option>
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <span>Type:</span>
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden"
              >
                <option value="all">All Typologies</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Portfolio Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => {
              const imageUrl = getProjectImage(project);

              return (
                <div
                  key={project.id}
                  className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  {/* Project Image Banner */}
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={imageUrl}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/modern-duplex-house-elevation-design-vijayawada.jpeg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Typology Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-amber-300 rounded-md border border-amber-500/30 backdrop-blur-md">
                        {project.type}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md backdrop-blur-md border ${
                        project.status === 'Completed' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' :
                        project.status === 'Finishing' ? 'bg-purple-950/90 text-purple-300 border-purple-500/30' :
                        project.status === 'Handover Phase' ? 'bg-teal-950/90 text-teal-300 border-teal-500/30' :
                        'bg-sky-950/90 text-sky-300 border-sky-500/30'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Location Pin overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{project.locality}, {project.city}</span>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                          Code: {project.code}
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-mono">
                          {project.state}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {project.name}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Progress Bar & Public Metrics */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">Construction Progress</span>
                          <span className="font-mono text-amber-400">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Scope</span>
                          <span className="text-slate-200 font-bold">{project.totalUnits} Units</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Target Handover</span>
                          <span className="text-slate-200 font-bold">{project.plannedCompletionDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Public Card Footer */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Milestone Verified
                      </span>
                      <button
                        onClick={onLoginClick}
                        className="text-amber-400 hover:text-amber-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Client Login</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Projects Matched Filter Criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting the state or property type dropdowns.</p>
            </div>
          )}
        </div>
      </section>

      {/* -------------------- 4. PROPERTY CATEGORIES SECTION -------------------- */}
      <section id="categories" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Architectural Typologies</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Four Supported Property Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ArthiBuild's estimation engine and location hierarchy adapt seamlessly whether managing high-rise apartment towers or bespoke independent houses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1: Apartment Complexes */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Apartment Complexes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-tower gated communities with Stilt + 8 floor building hierarchies, designated wings, dual passenger elevators, and underground rainwater reservoirs.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tower & Wing Breakdown</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Floor & Unit Mapping</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Shared Infrastructure Tracking</li>
              </ul>
            </div>

            {/* Category 2: Residential Apartments */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Residential Apartments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Individual 2BHK, 3BHK, and Penthouse units tracked independently to their contracted finish package (Structure-Only, Semi-Finished, or Fully Finished).
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Private Homebuyer Portal</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Contract Package Scoping</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Interior Customization Approvals</li>
              </ul>
            </div>

            {/* Category 3: Villa Communities */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Villa Communities</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exclusive enclaves of duplex and triplex villas with private compound perimeters, landscaped terrace decks, and independent rooftop solar arrays.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Independent Plot Layouts</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Boundary & Landscaping Milestones</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Optional Building Level Bypass</li>
              </ul>
            </div>

            {/* Category 4: Independent Houses */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Independent Houses</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Custom architect-designed bungalows and private residences built on independent plots, featuring personal passenger elevators and bespoke electrical grids.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Custom Structural Grid Plinths</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Direct Site Coordinator Logs</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tailored Snagging Checklists</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 5. OUR SERVICES SECTION -------------------- */}
      <section id="services" className="py-20 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Full Lifecycle Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Enterprise Construction Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ArthiBuild integrates physical site operations with client visibility across 5 mission-critical service pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white">Construction Progress Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Granular tracking of all 15 sequential construction stages—from Site Preparation and Foundation to Plastering, Concealed MEP, Flooring, and Final Painting.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white">Project Management & Scheduling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic critical-path delivery forecasting that automatically accounts for inter-stage dependencies, contractor throughput, and material delays.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white">Customer Live Updates & Transparency</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Homebuyers receive verified timestamped site photos, stage sign-offs, and revised handover dates without accessing internal administrative discussions.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
                04
              </div>
              <h3 className="text-base font-bold text-white">Customization Requests & Governance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digital change-request workflow: Homebuyers request Italian marble, extra electrical points, or fixtures. PM evaluates cost and timeline impact before client signs.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 font-mono font-bold text-sm">
                05
              </div>
              <h3 className="text-base font-bold text-white">Possession Clearance & Handover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero-defect snagging inspections tailored to contract scope (Package A structure audits vs. Package C turnkey audits) followed by digital possession certificates.
              </p>
            </div>

            {/* Service 6 / Highlight */}
            <div className="bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-950 p-6 rounded-2xl border border-amber-500/30 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider block mb-2">Security Standard</span>
                <h3 className="text-base font-bold text-white">Role-Based Security Architecture</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Four completely isolated portals: Admin Executive Center, Project Manager Hub, Site Coordinator Punch-list, and Homebuyer Suite.
                </p>
              </div>
              <button
                onClick={onLoginClick}
                className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Role Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 6. ABOUT ARTHIBUILD SECTION -------------------- */}
      <section id="about" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>About ArthiBuild Platform</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Engineering Complete Clarity in Construction Delivery
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Founded by <strong>Arthi Balasubramanian</strong>, ArthiBuild was created to solve the fundamental lack of real-time transparency between construction job sites, developer management, and property buyers.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                By uniting location-based physical hierarchies with contract-package governance (Package A Structure-Only, Package B Semi-Finished, and Package C Fully Finished), ArthiBuild ensures that every stakeholder sees exactly the information, schedules, and approvals permitted to their role.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block">Strict Scope Isolation</strong>
                    <span className="text-slate-400 text-[11px]">Customers only see their assigned unit and never internal budgets.</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block">Package-Specific Audits</strong>
                    <span className="text-slate-400 text-[11px]">Turnkey units are never held back by unrelated civil stages.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About Right Visual Card */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                    AB
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Arthi Balasubramanian</h3>
                    <p className="text-xs text-amber-400">Managing Director & Founder, ArthiBuild</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <em>
                      "Construction management shouldn't rely on fragmented WhatsApp messages and disputed spreadsheets. ArthiBuild brings mathematical precision to completion dates, photo-verified milestone approvals, and true peace of mind for every homeowner."
                    </em>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Headquarters</span>
                    <span className="text-slate-200 font-bold">Chennai, Tamil Nadu</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Operations</span>
                    <span className="text-slate-200 font-bold">Tamil Nadu & Karnataka</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 7. CONTACT SECTION -------------------- */}
      <section id="contact" className="py-20 bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5" />
              <span>Get In Touch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Connect With ArthiBuild Project Desk
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Have questions regarding ongoing projects, property allotment, or custom developer onboarding? Reach our engineering desk directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details Column (Configured details only) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                  Configured Contact Directory
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Founder / Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono">Executive & Project Inquiries</span>
                      <a href="mailto:arthi@arthibuild.com" className="text-white hover:text-amber-400 font-bold transition-colors">
                        arthi@arthibuild.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono">Primary Project Line</span>
                      <a href="tel:+919840123450" className="text-white hover:text-amber-400 font-bold font-mono transition-colors">
                        +91 98401 23450
                      </a>
                    </div>
                  </div>

                  {/* Regional Project Hubs */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono">Operating Construction Hubs</span>
                      <p className="text-slate-300 font-medium">
                        Chennai (OMR & Perungudi) · Coimbatore (Saravanampatti) · Bengaluru (Electronic City & Whitefield)
                      </p>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono">Engineering Desk Hours</span>
                      <p className="text-slate-300 font-medium">
                        Monday – Saturday: 9:00 AM – 6:30 PM IST
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Shortcut Box */}
              <div className="p-5 bg-gradient-to-r from-amber-500/10 to-slate-900 rounded-xl border border-amber-500/20 text-xs space-y-2">
                <span className="text-amber-400 font-bold block">Already an Allotted Homebuyer or Staff Member?</span>
                <p className="text-slate-300 text-[11px]">
                  Access your dedicated role dashboard directly using the portal credentials provided at contract signing.
                </p>
                <button
                  onClick={onLoginClick}
                  className="mt-2 inline-flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  <span>Go to Login Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="text-base font-bold text-white mb-1">
                  Send Project Inquiry
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Fill in your details below and our regional project manager will connect with you.
                </p>

                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-emerald-300">Inquiry Received Successfully</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Thank you for contacting ArthiBuild. Our project engineering cell has received your message and will respond via email/phone shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="mt-3 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Senthil Kumar"
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="e.g. senthil@gmail.com"
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="e.g. +91 98404 56783"
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Project of Interest
                        </label>
                        <select
                          value={contactForm.project}
                          onChange={(e) => setContactForm({ ...contactForm, project: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.city})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Inquiry / Message *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please share your inquiry regarding unit availability, construction package options, or delivery schedule..."
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20 cursor-pointer"
                    >
                      Submit Message to ArthiBuild Desk
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 8. FOOTER -------------------- */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center overflow-hidden">
                  <img src="/images/logo.png" alt="ArthiBuild Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-lg font-black text-white">
                  Arthi<span className="text-amber-400">Build</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Enterprise construction tracking and customer management system. Engineered for multi-location residential projects with role-isolated dashboards.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Navigation
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => scrollToSection('hero')} className="hover:text-amber-400 cursor-pointer">Home</button></li>
                <li><button onClick={() => scrollToSection('projects')} className="hover:text-amber-400 cursor-pointer">Our Projects</button></li>
                <li><button onClick={() => scrollToSection('categories')} className="hover:text-amber-400 cursor-pointer">Property Categories</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-amber-400 cursor-pointer">Services</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-amber-400 cursor-pointer">About Us</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-amber-400 cursor-pointer">Contact</button></li>
              </ul>
            </div>

            {/* Col 3: Role Portals */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Individual Role Portals
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={onLoginClick} className="hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                    <span>Admin Command Center</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </li>
                <li>
                  <button onClick={onLoginClick} className="hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                    <span>Project Manager Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </li>
                <li>
                  <button onClick={onLoginClick} className="hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                    <span>Site Coordinator Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </li>
                <li>
                  <button onClick={onLoginClick} className="hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                    <span>Homebuyer Client Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform Security */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Governance & Privacy
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Operating with local-first browser persistence and strict role-based data partitioning. Customer data, private photos, and internal budgets are never leaked publicly.
              </p>
              <div className="pt-1 text-[11px] font-mono text-amber-400">
                Founder: Arthi Balasubramanian
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 ArthiBuild Construction Management Systems. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Location Hierarchy: State → City → Locality → Site</span>
              <span>·</span>
              <button onClick={onLoginClick} className="text-amber-400 hover:underline cursor-pointer">
                Staff / Customer Login
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
