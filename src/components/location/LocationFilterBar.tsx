import React from 'react';
import { ConstructionProject, LocationFilterState } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, 
  Filter, 
  RotateCcw, 
  ChevronRight, 
  Building2, 
  Compass,
  Check
} from 'lucide-react';

interface LocationFilterBarProps {
  projects: ConstructionProject[];
  filterState: LocationFilterState;
  onFilterChange: (newFilters: LocationFilterState) => void;
  showPropertyType?: boolean;
  className?: string;
}

export const LocationFilterBar: React.FC<LocationFilterBarProps> = ({
  projects,
  filterState,
  onFilterChange,
  showPropertyType = true,
  className = ''
}) => {
  const { currentUser, isAdmin, isPM, isCoordinator } = useAuth();

  // Scope available projects by role
  const scopedProjects = React.useMemo(() => {
    if (isAdmin) return projects;
    if (isPM && currentUser.assignedProjectIds) {
      return projects.filter(p => currentUser.assignedProjectIds?.includes(p.id));
    }
    if (isCoordinator && currentUser.assignedProjectIds) {
      return projects.filter(p => currentUser.assignedProjectIds?.includes(p.id));
    }
    return projects;
  }, [projects, isAdmin, isPM, isCoordinator, currentUser]);

  // Extract distinct States
  const availableStates = React.useMemo(() => {
    const states = new Set<string>();
    scopedProjects.forEach(p => {
      if (p.state) states.add(p.state);
    });
    return Array.from(states).sort();
  }, [scopedProjects]);

  // Extract distinct Cities (filtered by selected state if any)
  const availableCities = React.useMemo(() => {
    const cities = new Set<string>();
    scopedProjects
      .filter(p => filterState.state === 'all' || p.state === filterState.state)
      .forEach(p => {
        if (p.city) cities.add(p.city);
      });
    return Array.from(cities).sort();
  }, [scopedProjects, filterState.state]);

  // Extract distinct Localities (filtered by state & city)
  const availableLocalities = React.useMemo(() => {
    const localities = new Set<string>();
    scopedProjects
      .filter(p => filterState.state === 'all' || p.state === filterState.state)
      .filter(p => filterState.city === 'all' || p.city === filterState.city)
      .forEach(p => {
        if (p.locality) localities.add(p.locality);
      });
    return Array.from(localities).sort();
  }, [scopedProjects, filterState.state, filterState.city]);

  // Extract distinct Sites / Projects (filtered by state, city, locality)
  const availableSites = React.useMemo(() => {
    return scopedProjects
      .filter(p => filterState.state === 'all' || p.state === filterState.state)
      .filter(p => filterState.city === 'all' || p.city === filterState.city)
      .filter(p => filterState.locality === 'all' || p.locality === filterState.locality)
      .filter(p => filterState.propertyType === 'all' || p.type === filterState.propertyType);
  }, [scopedProjects, filterState.state, filterState.city, filterState.locality, filterState.propertyType]);

  const handleStateChange = (state: string) => {
    onFilterChange({
      ...filterState,
      state,
      city: 'all',
      locality: 'all',
      projectId: 'all'
    });
  };

  const handleCityChange = (city: string) => {
    onFilterChange({
      ...filterState,
      city,
      locality: 'all',
      projectId: 'all'
    });
  };

  const handleLocalityChange = (locality: string) => {
    onFilterChange({
      ...filterState,
      locality,
      projectId: 'all'
    });
  };

  const handleSiteChange = (projectId: string) => {
    onFilterChange({
      ...filterState,
      projectId
    });
  };

  const handlePropertyTypeChange = (propertyType: string) => {
    onFilterChange({
      ...filterState,
      propertyType
    });
  };

  const handleReset = () => {
    onFilterChange({
      state: 'all',
      city: 'all',
      locality: 'all',
      projectId: 'all',
      propertyType: 'all'
    });
  };

  const isFiltered = 
    filterState.state !== 'all' || 
    filterState.city !== 'all' || 
    filterState.locality !== 'all' || 
    filterState.projectId !== 'all' || 
    filterState.propertyType !== 'all';

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs ${className}`}>
      {/* Header with Title and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Location-Based Hierarchy Filter
            </span>
            <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
              State → City → Area/Locality → Construction Site
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 rounded-lg transition-colors cursor-pointer"
              title="Reset all location filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>All Locations</span>
            </button>
          )}

          {!isFiltered && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              <span>Viewing All Locations</span>
            </span>
          )}
        </div>
      </div>

      {/* Cascading Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* 1. State */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            1. State
          </label>
          <select
            value={filterState.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800"
          >
            <option value="all">All States ({availableStates.length})</option>
            {availableStates.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* 2. City */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            2. City
          </label>
          <select
            value={filterState.city}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={availableCities.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 disabled:opacity-50"
          >
            <option value="all">
              {filterState.state === 'all' ? `All Cities (${availableCities.length})` : `All Cities in ${filterState.state}`}
            </option>
            {availableCities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Area / Locality */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            3. Area / Locality
          </label>
          <select
            value={filterState.locality}
            onChange={(e) => handleLocalityChange(e.target.value)}
            disabled={availableLocalities.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 disabled:opacity-50"
          >
            <option value="all">
              {filterState.city === 'all' ? `All Localities (${availableLocalities.length})` : `All in ${filterState.city}`}
            </option>
            {availableLocalities.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Construction Site / Project */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            4. Construction Site
          </label>
          <select
            value={filterState.projectId}
            onChange={(e) => handleSiteChange(e.target.value)}
            disabled={availableSites.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 disabled:opacity-50"
          >
            <option value="all">All Sites ({availableSites.length})</option>
            {availableSites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.city})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Property Type */}
        {showPropertyType && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              5. Property Type
            </label>
            <select
              value={filterState.propertyType}
              onChange={(e) => handlePropertyTypeChange(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800"
            >
              <option value="all">All Property Types</option>
              <option value="Apartment Complex">Apartment Complex</option>
              <option value="Villa Community">Villa Community</option>
              <option value="Independent House">Independent House</option>
              <option value="Individual Villa">Individual Villa</option>
            </select>
          </div>
        )}
      </div>

      {/* Active Breadcrumb Summary */}
      {isFiltered && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 overflow-x-auto whitespace-nowrap">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-700">Active Scope:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
            {filterState.state === 'all' ? 'All States' : filterState.state}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
            {filterState.city === 'all' ? 'All Cities' : filterState.city}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
            {filterState.locality === 'all' ? 'All Areas' : filterState.locality}
          </span>
          {filterState.projectId !== 'all' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[11px]">
                {scopedProjects.find(p => p.id === filterState.projectId)?.name || filterState.projectId}
              </span>
            </>
          )}
          {filterState.propertyType !== 'all' && (
            <>
              <span className="text-slate-300">|</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium text-[11px]">
                {filterState.propertyType}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
