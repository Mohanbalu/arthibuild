import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Property, BuildingWing } from '../types';
import { getScopedProjects } from '../services/permissions';
import { calculateBuildingProgress } from '../services/estimationEngine';
import { ProgressBar } from '../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge } from '../components/common/Badge';
import { 
  Building2, 
  Layers, 
  Home, 
  ChevronRight, 
  Plus, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface BuildingExplorerProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const BuildingExplorer: React.FC<BuildingExplorerProps> = ({ 
  onNavigate, 
  onSelectProperty 
}) => {
  const { projects, properties, tasks } = useData();
  const { canManageProjects, currentUser } = useAuth();

  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(scopedProjects[0]?.id || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');

  const currentProject = scopedProjects.find(p => p.id === selectedProjectId) || scopedProjects[0];

  const projectProperties = properties.filter(p => p.projectId === selectedProjectId);

  // Determine if this project uses building/floor hierarchy
  const isMultiUnitApartment = currentProject?.type === 'Apartment Complex';
  const buildings = currentProject?.buildings || [];

  // Filter properties by building and floor
  const filteredProperties = projectProperties.filter(prop => {
    if (selectedBuildingId !== 'all' && prop.buildingId !== selectedBuildingId) return false;
    if (selectedFloor !== 'all' && prop.floorNumber !== selectedFloor) return false;
    return true;
  });

  // Extract available floors from project properties
  const availableFloors = Array.from(
    new Set(projectProperties.map(p => p.floorNumber).filter((f): f is number => f !== undefined))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Building & Floor Hierarchy Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive structural navigation: Project → Wing/Building → Floor → Unit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageProjects && (
            <button
              onClick={() => onNavigate('properties')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Selected Site:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedBuildingId('all');
              setSelectedFloor('all');
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-amber-500 min-w-[260px]"
          >
            {scopedProjects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-mono">{projectProperties.length} Registered Units</span>
          <span>·</span>
          <span>Typology: <strong className="text-slate-800">{currentProject?.type}</strong></span>
        </div>
      </div>

      {/* Hierarchy Explorer Section */}
      {isMultiUnitApartment ? (
        <div className="space-y-6">
          {/* Wings / Buildings Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => { setSelectedBuildingId('all'); setSelectedFloor('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedBuildingId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Wings ({buildings.length})
            </button>

            {buildings.map(b => {
              const bProps = projectProperties.filter(p => p.buildingId === b.id);
              const bProg = calculateBuildingProgress(b.id, tasks, bProps);
              return (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBuildingId(b.id); setSelectedFloor('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    selectedBuildingId === b.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{b.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    selectedBuildingId === b.id ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {bProg.progress}% · {bProps.length}u
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Building Progress Overview Banner */}
          {selectedBuildingId !== 'all' && (() => {
            const activeWing = buildings.find(b => b.id === selectedBuildingId);
            const wingProps = projectProperties.filter(p => p.buildingId === selectedBuildingId);
            const wingProgress = calculateBuildingProgress(selectedBuildingId, tasks, wingProps);
            return (
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold tracking-tight text-white">{activeWing?.name} — Wing Overview</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300">
                      Building-Level Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Calculated dynamically from {wingProgress.totalTasks > 0 ? `${wingProgress.totalTasks} structural & fit-out tasks` : `${wingProps.length} registered apartment units`}.
                  </p>
                </div>

                <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-amber-400">{wingProgress.progress}%</div>
                    <div className="text-[10px] font-mono text-slate-400">{wingProgress.remainingPercentage}% Remaining</div>
                  </div>
                  <div className="w-32 hidden md:block">
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${wingProgress.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Floor Strip Selector */}
          {availableFloors.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap mr-1">
                Filter Floor:
              </span>
              <button
                onClick={() => setSelectedFloor('all')}
                className={`px-2.5 py-1 text-xs rounded-md font-mono ${
                  selectedFloor === 'all'
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Floors
              </button>
              {availableFloors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono ${
                    selectedFloor === floor
                      ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Level {floor}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Direct Unit Plot Layout for Villas & Independent Houses */
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="font-semibold">Direct Unit / Plot Layout:</span> No multi-floor apartment wings required for {currentProject?.type}. Each residence is tracked independently.
            </div>
          </div>
          <span className="font-mono font-bold text-emerald-800">{projectProperties.length} Private Plots</span>
        </div>
      )}

      {/* Units Visual Matrix / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProperties.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No properties found for this building/floor filter.
          </div>
        ) : (
          filteredProperties.map(prop => (
            <div
              key={prop.id}
              onClick={() => {
                onSelectProperty(prop.id);
                onNavigate('property-detail', prop.id);
              }}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">
                      {prop.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-amber-700 transition-colors">
                      {prop.unitNumber}
                    </h3>
                  </div>
                  <PropertyStatusBadge status={prop.status} />
                </div>

                <div className="mt-2.5">
                  <PackageBadge packageType={prop.packageType} />
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[170px]">{prop.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Built-up Area:</span>
                    <span className="font-mono text-slate-800">{prop.areaSqFt} sq.ft</span>
                  </div>
                  {prop.buildingName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-medium text-slate-700">{prop.buildingName} (Floor {prop.floorNumber})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-600 font-medium">Unit Progress:</span>
                  <span className="font-bold text-slate-900">{prop.overallProgress}% <span className="font-normal text-slate-400">({100 - prop.overallProgress}% left)</span></span>
                </div>
                <ProgressBar progress={prop.overallProgress} verifiedProgress={prop.verifiedProgress} size="sm" />

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Delivery Est:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {prop.currentEstimatedDate}
                  </span>
                </div>

                {prop.delayDays > 0 && (
                  <div className="mt-1 text-[11px] text-rose-600 font-medium">
                    +{prop.delayDays}d variance from committed date
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
