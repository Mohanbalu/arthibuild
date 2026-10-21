import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ConstructionProject, Property, LocationFilterState } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { LocationFilterBar } from './LocationFilterBar';
import { PropertyStatusBadge, PackageBadge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import {
  MapPin,
  Building2,
  Home,
  Layers,
  User,
  Calendar,
  Compass,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  KanbanSquare,
  Clock,
  Sparkles,
  Maximize2,
  ListTree,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Folder,
  FolderOpen
} from 'lucide-react';

interface SiteMapViewProps {
  onNavigate: (view: string, id?: string) => void;
  initialProjectId?: string;
}

export const SiteMapView: React.FC<SiteMapViewProps> = ({ onNavigate, initialProjectId }) => {
  const { projects, properties, tasks } = useData();
  const { currentUser, isAdmin, isPM, isCoordinator } = useAuth();

  const [activeTab, setActiveTab] = useState<'map' | 'hierarchy'>('map');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');

  // Cascading location filters
  const [filters, setFilters] = useState<LocationFilterState>({
    state: 'all',
    city: 'all',
    locality: 'all',
    projectId: 'all',
    propertyType: 'all'
  });

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Scoped by user role
    if (!isAdmin) {
      if (currentUser.assignedProjectIds && currentUser.assignedProjectIds.length > 0) {
        result = result.filter(p => currentUser.assignedProjectIds?.includes(p.id));
      }
    }

    if (filters.state !== 'all') {
      result = result.filter(p => p.state === filters.state);
    }
    if (filters.city !== 'all') {
      result = result.filter(p => p.city === filters.city);
    }
    if (filters.locality !== 'all') {
      result = result.filter(p => p.locality === filters.locality);
    }
    if (filters.projectId !== 'all') {
      result = result.filter(p => p.id === filters.projectId);
    }
    if (filters.propertyType !== 'all') {
      result = result.filter(p => p.type === filters.propertyType);
    }

    return result;
  }, [projects, isAdmin, currentUser, filters]);

  // Active selected project
  const activeProject = useMemo(() => {
    const found = projects.find(p => p.id === selectedProjectId);
    if (found) return found;
    return filteredProjects[0] || projects[0];
  }, [projects, selectedProjectId, filteredProjects]);

  // Properties belonging to selected project
  const projectProperties = useMemo(() => {
    if (!activeProject) return [];
    return properties.filter(p => p.projectId === activeProject.id);
  }, [properties, activeProject]);

  // Leaflet map container ref & map instance ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize and update Leaflet map
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    // Fix default marker icon assets for Leaflet in bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [15.2, 79.8], // Regional center covering TN, Karnataka, Telangana, and Andhra Pradesh
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds: L.LatLngExpression[] = [];

    // Add marker for each project with coordinates
    filteredProjects.forEach(proj => {
      if (proj.latitude && proj.longitude) {
        const isSelected = proj.id === activeProject?.id;
        const latLng: [number, number] = [proj.latitude, proj.longitude];
        bounds.push(latLng);

        // Custom HTML marker pin with status indicator
        const pinColor = 
          proj.status === 'Completed' ? '#10b981' :
          proj.status === 'Finishing' ? '#8b5cf6' :
          proj.status === 'Delayed' ? '#f43f5e' : '#f59e0b';

        const customIcon = L.divIcon({
          className: 'custom-site-pin',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              background-color: ${isSelected ? '#0f172a' : 'white'};
              color: ${isSelected ? 'white' : '#0f172a'};
              border: 3px solid ${pinColor};
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              font-family: ui-monospace, monospace;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: transform 0.2s ease;
            ">
              ${proj.code.split('-')[0] || 'SITE'}
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker(latLng, { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedProjectId(proj.id);
          map.setView(latLng, 13, { animate: true });
        });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong>${proj.name}</strong><br/>
            <span style="color: #64748b;">${proj.locality}, ${proj.city}</span><br/>
            <span style="color: #0284c7; font-weight: 600;">${proj.progress}% Completed</span>
          </div>
        `, { direction: 'top', offset: [0, -18] });

        markersRef.current[proj.id] = marker;
      }
    });

    if (bounds.length > 0) {
      if (activeProject && activeProject.latitude && activeProject.longitude) {
        map.setView([activeProject.latitude, activeProject.longitude], 12);
      } else {
        map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 12 });
      }
    }

    return () => {
      // In strict mode cleanup
    };
  }, [activeTab, filteredProjects, activeProject]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center on active project when changed
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const proj = projects.find(p => p.id === projectId);
    if (proj && proj.latitude && proj.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([proj.latitude, proj.longitude], 13, { animate: true });
    }
  };

  // State for collapsible tree in hierarchy mode
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({
    'Tamil Nadu': true,
    'Karnataka': true
  });
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({
    'Chennai': true,
    'Coimbatore': true,
    'Bengaluru': true
  });
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({
    'PRJ-01': true,
    'PRJ-02': true,
    'PRJ-03': true
  });

  const toggleStateExpand = (state: string) => {
    setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }));
  };
  const toggleCityExpand = (city: string) => {
    setExpandedCities(prev => ({ ...prev, [city]: !prev[city] }));
  };
  const toggleSiteExpand = (siteId: string) => {
    setExpandedSites(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  // Build the hierarchical tree grouped by State -> City -> Locality -> Site
  const hierarchyTree = useMemo(() => {
    const statesMap: { [state: string]: { [city: string]: { [locality: string]: ConstructionProject[] } } } = {};

    filteredProjects.forEach(proj => {
      const state = proj.state || 'Other State';
      const city = proj.city || 'Other City';
      const locality = proj.locality || 'General';

      if (!statesMap[state]) statesMap[state] = {};
      if (!statesMap[state][city]) statesMap[state][city] = {};
      if (!statesMap[state][city][locality]) statesMap[state][city][locality] = [];

      statesMap[state][city][locality].push(proj);
    });

    return statesMap;
  }, [filteredProjects]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Location-Based Project GIS & Hierarchy
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geographical organization: State → City → Area/Locality → Construction Site → Building → Floor → Unit
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Interactive Map</span>
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTree className="w-4 h-4 text-sky-500" />
            <span>Location Hierarchy Tree</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <LocationFilterBar
        projects={projects}
        filterState={filters}
        onFilterChange={setFilters}
        showPropertyType={true}
      />

      {/* MAIN CONTENT AREA */}
      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left/Main Column: Leaflet Map */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>Geographical Construction Sites Map</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({filteredProjects.length} sites in view)
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">
                Click pin to view details & units
              </span>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[540px] z-0 bg-slate-100"
              style={{ minHeight: '540px' }}
            />

            {/* Site Quick Selector Pills below map */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-semibold text-slate-500 shrink-0 text-[11px]">
                Quick Jump:
              </span>
              {filteredProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                    activeProject?.id === proj.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${activeProject?.id === proj.id ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{proj.name}</span>
                  <span className="text-[10px] text-slate-400">({proj.city})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Site Detail Card & Associated Units */}
          <div className="lg:col-span-4 space-y-4">
            {activeProject ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                {/* Site Header */}
                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700">
                      {activeProject.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      activeProject.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      activeProject.status === 'Finishing' ? 'bg-purple-100 text-purple-800' :
                      activeProject.status === 'Delayed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeProject.status}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 mt-1.5">
                    {activeProject.name}
                  </h2>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{activeProject.type}</span>
                  </div>
                </div>

                {/* Location Hierarchy Breadcrumb Box */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                    Geographical Location
                  </div>

                  <div className="space-y-1 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">State:</span>
                      <span className="font-semibold text-slate-900">{activeProject.state}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">City:</span>
                      <span className="font-semibold text-slate-900">{activeProject.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Area / Locality:</span>
                      <span className="font-semibold text-slate-900">{activeProject.locality}</span>
                    </div>
                    {activeProject.pincode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Postal Pincode:</span>
                        <span className="font-mono text-slate-900">{activeProject.pincode}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{activeProject.address}</span>
                  </div>

                  {activeProject.latitude && activeProject.longitude && (
                    <div className="text-[10px] text-slate-500 font-mono bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                      <span>Coordinates:</span>
                      <span className="text-slate-700 font-semibold">
                        {activeProject.latitude.toFixed(4)}° N, {activeProject.longitude.toFixed(4)}° E
                      </span>
                    </div>
                  )}
                </div>

                {/* Overall Site Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Overall Site Progress</span>
                    <span className="font-mono text-amber-600">{activeProject.progress}%</span>
                  </div>
                  <ProgressBar progress={activeProject.progress} />
                </div>

                {/* Team Info */}
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Project Manager:</span>
                    <span className="font-medium text-slate-800">{activeProject.projectManagerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Delivery:</span>
                    <span className="font-mono text-slate-800">{activeProject.plannedCompletionDate}</span>
                  </div>
                </div>

                {/* Buildings / Wings or Villas Structure */}
                {activeProject.buildings && activeProject.buildings.length > 0 && (
                  <div className="p-2.5 bg-sky-50/60 rounded-lg border border-sky-100 text-xs">
                    <div className="font-semibold text-sky-900 flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      <span>Apartment Towers & Wings ({activeProject.buildings.length})</span>
                    </div>
                    <div className="space-y-1">
                      {activeProject.buildings.map(bld => (
                        <div key={bld.id} className="flex items-center justify-between text-[11px] text-sky-800">
                          <span>{bld.name}</span>
                          <span className="font-mono text-sky-600">{bld.floorsCount} Floors · {bld.totalUnits} Units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Properties & Units in this site */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-amber-500" />
                      <span>Units & Properties ({projectProperties.length})</span>
                    </span>
                    <button
                      onClick={() => onNavigate('properties')}
                      className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-0.5"
                    >
                      <span>Manage All</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {projectProperties.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
                      No units currently registered in this site.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {projectProperties.map(prop => (
                        <div
                          key={prop.id}
                          onClick={() => onNavigate('property-detail', prop.id)}
                          className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 truncate">
                              {prop.unitNumber}
                            </span>
                            <PropertyStatusBadge status={prop.status} />
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                            <span>{prop.customerName}</span>
                            <span className="font-mono text-slate-700">{prop.overallProgress}%</span>
                          </div>

                          {prop.delayDays > 0 && (
                            <div className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Delayed by {prop.delayDays} days</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <KanbanSquare className="w-3.5 h-3.5 text-slate-600" />
                    <span>Site Tasks</span>
                  </button>
                  <button
                    onClick={() => onNavigate('buildings')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Explorer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">Select a site to view its geographical information and properties.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HIERARCHY TREE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListTree className="w-4 h-4 text-sky-600" />
                <span>Geographical Location Hierarchy Tree</span>
              </h2>
              <p className="text-xs text-slate-500">
                Organized from administrative state level down to individual apartment and villa units
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-800">{filteredProjects.length}</span> Sites ·{' '}
              <span className="font-bold text-slate-800">{properties.length}</span> Total Properties
            </div>
          </div>

          {/* Tree Nodes */}
          <div className="space-y-3 font-sans">
            {Object.keys(hierarchyTree).map(stateName => {
              const stateCities = hierarchyTree[stateName];
              const isStateExpanded = !!expandedStates[stateName];

              return (
                <div key={stateName} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* LEVEL 1: STATE */}
                  <div
                    onClick={() => toggleStateExpand(stateName)}
                    className="p-3 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {isStateExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      )}
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm tracking-wide">
                        State: {stateName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 rounded-md text-slate-300">
                      {Object.keys(stateCities).length} Cities
                    </span>
                  </div>

                  {/* LEVEL 2: CITIES */}
                  {isStateExpanded && (
                    <div className="p-3 space-y-3 bg-slate-50/50">
                      {Object.keys(stateCities).map(cityName => {
                        const cityLocalities = stateCities[cityName];
                        const isCityExpanded = !!expandedCities[cityName];

                        return (
                          <div key={cityName} className="ml-2 sm:ml-4 border border-slate-200 rounded-lg bg-white overflow-hidden">
                            {/* City Header */}
                            <div
                              onClick={() => toggleCityExpand(cityName)}
                              className="p-2.5 bg-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-200/70 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isCityExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                )}
                                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                <span className="font-semibold text-xs text-slate-800">
                                  City: {cityName}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {Object.keys(cityLocalities).length} Localities
                              </span>
                            </div>

                            {/* LEVEL 3: LOCALITIES */}
                            {isCityExpanded && (
                              <div className="p-3 space-y-3 bg-white">
                                {Object.keys(cityLocalities).map(localityName => {
                                  const sitesInLocality = cityLocalities[localityName];

                                  return (
                                    <div key={localityName} className="ml-2 sm:ml-4 space-y-2">
                                      <div className="text-[11px] font-mono uppercase font-bold text-amber-700 flex items-center gap-1.5">
                                        <Compass className="w-3.5 h-3.5" />
                                        <span>Area / Locality: {localityName}</span>
                                      </div>

                                      {/* LEVEL 4: SITES */}
                                      <div className="space-y-2.5 ml-2 sm:ml-4">
                                        {sitesInLocality.map(site => {
                                          const isSiteExpanded = !!expandedSites[site.id];
                                          const siteProps = properties.filter(p => p.projectId === site.id);

                                          return (
                                            <div key={site.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                                              {/* Site Bar */}
                                              <div
                                                onClick={() => toggleSiteExpand(site.id)}
                                                className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  {isSiteExpanded ? (
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                  ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                  )}
                                                  <span className="font-bold text-xs text-slate-900 truncate">
                                                    Site: {site.name}
                                                  </span>
                                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-mono">
                                                    {site.type}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className="text-[11px] font-mono text-slate-500">
                                                    Progress: {site.progress}%
                                                  </span>
                                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-900">
                                                    {site.status}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* LEVEL 5 & 6: BUILDINGS / FLOORS / UNITS OR VILLAS */}
                                              {isSiteExpanded && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3">
                                                  {/* If Apartment Complex with Buildings */}
                                                  {site.buildings && site.buildings.length > 0 ? (
                                                    <div className="space-y-2">
                                                      {site.buildings.map(bld => {
                                                        const buildingProps = siteProps.filter(p => p.buildingId === bld.id);

                                                        return (
                                                          <div key={bld.id} className="ml-3 p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                              <div className="flex items-center gap-1.5 text-sky-800">
                                                                <Layers className="w-3.5 h-3.5 text-sky-600" />
                                                                <span>Building: {bld.name} ({bld.floorsCount} Floors)</span>
                                                              </div>
                                                              <span className="text-[11px] text-slate-500 font-mono">
                                                                {buildingProps.length} tracked units
                                                              </span>
                                                            </div>

                                                            {/* Individual units inside building */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                              {buildingProps.map(prop => (
                                                                <div
                                                                  key={prop.id}
                                                                  onClick={() => onNavigate('property-detail', prop.id)}
                                                                  className="p-2 rounded border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer text-xs"
                                                                >
                                                                  <div className="flex items-center justify-between font-medium">
                                                                    <span className="text-slate-900">{prop.unitNumber}</span>
                                                                    <span className="text-[10px] text-slate-500">Floor {prop.floorNumber ?? 'N/A'}</span>
                                                                  </div>
                                                                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                                                                    <span>{prop.customerName}</span>
                                                                    <span className="font-mono text-amber-700">{prop.overallProgress}%</span>
                                                                  </div>
                                                                </div>
                                                             ))}
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  ) : (
                                                    /* Villa / Independent House units */
                                                    <div className="space-y-1.5 ml-3">
                                                      <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                                        <Home className="w-3 h-3 text-amber-600" />
                                                        <span>Villas & Independent Houses in Site ({siteProps.length})</span>
                                                      </div>
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {siteProps.map(prop => (
                                                          <div
                                                            key={prop.id}
                                                            onClick={() => onNavigate('property-detail', prop.id)}
                                                            className="p-2 rounded border border-slate-200 hover:border-amber-400 bg-white transition-all cursor-pointer text-xs"
                                                          >
                                                            <div className="flex items-center justify-between font-semibold text-slate-900">
                                                              <span>{prop.unitNumber}</span>
                                                              <PropertyStatusBadge status={prop.status} />
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                                                              <span>{prop.customerName}</span>
                                                              <span className="font-mono">{prop.areaSqFt} sq.ft</span>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
