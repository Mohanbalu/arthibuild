import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Property, PackageType, PropertyStatus, LocationFilterState } from '../types';
import { LocationFilterBar } from '../components/location/LocationFilterBar';
import { getScopedProperties, getScopedProjects } from '../services/permissions';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProgressBar } from '../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge } from '../components/common/Badge';
import { STANDARD_ACTIVITIES, PACKAGE_DEFINITIONS } from '../constants/constructionData';
import { 
  Home, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building2,
  FileCheck,
  Check,
  X,
  MapPin,
  Compass,
  AlertCircle
} from 'lucide-react';

interface PropertiesProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const Properties: React.FC<PropertiesProps> = ({ onNavigate, onSelectProperty }) => {
  const { properties, projects, addProperty, updateProperty, deleteProperty } = useData();
  const { canManageProjects, availableUsers, currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Location Hierarchy Filtering State
  const [locationFilters, setLocationFilters] = useState<LocationFilterState>({
    state: 'all',
    city: 'all',
    locality: 'all',
    projectId: 'all',
    propertyType: 'all'
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Form State
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || '');
  const [formUnitNumber, setFormUnitNumber] = useState('');
  const [formBuildingName, setFormBuildingName] = useState('Tower A (Sapphire Wing)');
  const [formFloorNumber, setFormFloorNumber] = useState<number | undefined>(1);
  const [formAreaSqFt, setFormAreaSqFt] = useState<number>(1500);
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formPackage, setFormPackage] = useState<PackageType>('Package C: Fully Finished');
  const [formCommittedDate, setFormCommittedDate] = useState('2026-12-30');
  const [customInclusions, setCustomInclusions] = useState<string[]>([
    'ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09', 'ACT-14', 'ACT-15', 'ACT-16'
  ]);

  const resetForm = () => {
    setFormProjectId(projects[0]?.id || '');
    setFormUnitNumber('');
    setFormBuildingName('Tower A (Sapphire Wing)');
    setFormFloorNumber(1);
    setFormAreaSqFt(1500);
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormCustomerEmail('');
    setFormPackage('Package C: Fully Finished');
    setFormCommittedDate('2026-12-30');
    setCustomInclusions(['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09', 'ACT-14', 'ACT-15', 'ACT-16']);
    setDuplicateError(null);
    setEditingProperty(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProperty(property);
    setFormProjectId(property.projectId);
    setFormUnitNumber(property.unitNumber);
    setFormBuildingName(property.buildingName || '');
    setFormFloorNumber(property.floorNumber);
    setFormAreaSqFt(property.areaSqFt);
    setFormCustomerName(property.customerName);
    setFormCustomerPhone(property.customerPhone);
    setFormCustomerEmail(property.customerEmail);
    setFormPackage(property.packageType);
    setFormCommittedDate(property.originalCommittedDate);
    setCustomInclusions(property.includedActivities);
    setDuplicateError(null);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);

    const cleanUnit = formUnitNumber.trim();
    if (!cleanUnit || !formCustomerName.trim()) return;

    // Duplicate check: Prevent duplicate unit records in the same site
    const isDuplicate = properties.some(p => 
      p.projectId === formProjectId && 
      p.unitNumber.trim().toLowerCase() === cleanUnit.toLowerCase() && 
      p.id !== editingProperty?.id
    );

    const selectedProj = projects.find(p => p.id === formProjectId) || projects[0];

    if (isDuplicate) {
      setDuplicateError(`A unit with identifier "${cleanUnit}" already exists at ${selectedProj.name}. Please enter a unique unit identifier.`);
      return;
    }

    // Determine included & excluded activities
    let included: string[] = [];
    let excluded: string[] = [];

    if (formPackage === 'Package D: Custom Package') {
      included = customInclusions;
      excluded = STANDARD_ACTIVITIES.map(a => a.id).filter(id => !included.includes(id));
    } else {
      included = [...PACKAGE_DEFINITIONS[formPackage].activityIds];
      excluded = STANDARD_ACTIVITIES.map(a => a.id).filter(id => !included.includes(id));
    }

    const isApartment = selectedProj.type === 'Apartment Complex';
    const propType = isApartment ? 'Apartment' : (selectedProj.type === 'Villa Community' || selectedProj.type === 'Individual Villa' ? 'Villa' : 'Independent House');

    if (editingProperty) {
      updateProperty(editingProperty.id, {
        unitNumber: cleanUnit,
        projectId: formProjectId,
        projectName: selectedProj.name,
        siteName: selectedProj.name,
        state: selectedProj.state || 'Tamil Nadu',
        city: selectedProj.city || 'Chennai',
        locality: selectedProj.locality || 'General',
        buildingName: isApartment ? formBuildingName : (formBuildingName.trim() || undefined),
        floorNumber: isApartment ? formFloorNumber : (formFloorNumber !== undefined ? formFloorNumber : undefined),
        propertyType: propType,
        areaSqFt: formAreaSqFt,
        customerName: formCustomerName,
        customerPhone: formCustomerPhone,
        customerEmail: formCustomerEmail,
        packageType: formPackage,
        packageDescription: PACKAGE_DEFINITIONS[formPackage].description,
        includedActivities: included,
        excludedActivities: excluded,
        originalCommittedDate: formCommittedDate
      });
    } else {
      addProperty({
        unitNumber: cleanUnit,
        projectId: formProjectId,
        projectName: selectedProj.name,
        siteName: selectedProj.name,
        state: selectedProj.state || 'Tamil Nadu',
        city: selectedProj.city || 'Chennai',
        locality: selectedProj.locality || 'General',
        buildingId: isApartment && formBuildingName ? `BLD-${formProjectId}-1` : undefined,
        buildingName: isApartment ? formBuildingName : (formBuildingName.trim() || undefined),
        floorNumber: isApartment ? formFloorNumber : (formFloorNumber !== undefined ? formFloorNumber : undefined),
        propertyType: propType,
        areaSqFt: formAreaSqFt,
        customerId: `CUST-${Date.now().toString(36)}`,
        customerName: formCustomerName,
        customerPhone: formCustomerPhone,
        customerEmail: formCustomerEmail,
        packageType: formPackage,
        packageDescription: PACKAGE_DEFINITIONS[formPackage].description,
        includedActivities: included,
        excludedActivities: excluded,
        originalCommittedDate: formCommittedDate,
        currentEstimatedDate: formCommittedDate,
        status: 'Planning',
        assignedCoordinatorId: selectedProj.assignedCoordinatorIds?.[0] || 'usr-coord-1',
        assignedCoordinatorName: 'Kavitha Sundaram'
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Toggle custom activity inclusion
  const toggleActivityInclusion = (activityId: string) => {
    setCustomInclusions(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  // Filtered Properties with Cascading Location Hierarchy
  const filteredProperties = useMemo(() => {
    const scopedProps = getScopedProperties(currentUser, properties, projects);
    return scopedProps.filter(prop => {
      // Location Hierarchy filters
      if (locationFilters.state !== 'all' && prop.state !== locationFilters.state) {
        return false;
      }
      if (locationFilters.city !== 'all' && prop.city !== locationFilters.city) {
        return false;
      }
      if (locationFilters.locality !== 'all' && prop.locality !== locationFilters.locality) {
        return false;
      }
      if (locationFilters.projectId !== 'all' && prop.projectId !== locationFilters.projectId) {
        return false;
      }
      if (locationFilters.propertyType !== 'all') {
        const proj = projects.find(prj => prj.id === prop.projectId);
        if (proj && proj.type !== locationFilters.propertyType) return false;
      }

      // Quick bar filters
      const matchesSearch = prop.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            prop.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            prop.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (prop.buildingName && prop.buildingName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (prop.city && prop.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (prop.locality && prop.locality.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            prop.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProjectId === 'all' || prop.projectId === selectedProjectId;
      const matchesPackage = selectedPackage === 'all' || prop.packageType.includes(selectedPackage);
      const matchesStatus = selectedStatus === 'all' || prop.status === selectedStatus;

      return matchesSearch && matchesProject && matchesPackage && matchesStatus;
    });
  }, [properties, locationFilters, searchQuery, selectedProjectId, selectedPackage, selectedStatus, projects, currentUser]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Units & Properties Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual property records, customer contracts, finishing packages, and dynamic completion progress
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canManageProjects && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property Unit</span>
            </button>
          )}

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cascading Location Hierarchy Filter Bar */}
      <LocationFilterBar
        projects={projects}
        filterState={locationFilters}
        onFilterChange={setLocationFilters}
        showPropertyType={true}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by unit number, customer name, or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Packages</option>
            <option value="Package A">Package A: Structure Only</option>
            <option value="Package B">Package B: Semi-Finished</option>
            <option value="Package C">Package C: Fully Finished</option>
            <option value="Package D">Package D: Custom Package</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="Foundation">Foundation</option>
            <option value="Structure">Structure</option>
            <option value="Finishing">Finishing</option>
            <option value="Quality Inspection">Quality Inspection</option>
            <option value="Ready for Handover">Ready for Handover</option>
            <option value="Handed Over">Handed Over</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(prop => (
            <div
              key={prop.id}
              onClick={() => {
                onSelectProperty(prop.id);
                onNavigate('property-detail', prop.id);
              }}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {prop.id}
                  </span>
                  <PropertyStatusBadge status={prop.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-amber-700 transition-colors truncate">
                  {prop.unitNumber}
                </h3>

                <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{prop.projectName}</span>
                  {prop.buildingName && <span className="text-slate-400">· {prop.buildingName}</span>}
                  {prop.floorNumber !== undefined && <span className="text-slate-400">· Fl {prop.floorNumber}</span>}
                </p>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                    {prop.city || 'Chennai'}
                  </span>
                  <span>·</span>
                  <span className="truncate">{prop.locality || 'General'}</span>
                  {prop.state && (
                    <>
                      <span>·</span>
                      <span className="text-slate-400">{prop.state}</span>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <PackageBadge packageType={prop.packageType} />
                </div>

                <div className="mt-4 text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[170px]">{prop.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Built-up Area:</span>
                    <span className="font-mono text-slate-800">{prop.areaSqFt} sq.ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Contract Scope:</span>
                    <span className="font-mono text-slate-700">{prop.includedActivities.length} activities</span>
                  </div>
                </div>
              </div>

              {/* Progress and Forecast Section */}
              <div className="px-5 py-3 border-t border-slate-100">
                <ProgressBar progress={prop.overallProgress} verifiedProgress={prop.verifiedProgress} size="sm" />

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target Delivery:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {prop.currentEstimatedDate}
                  </span>
                </div>

                {prop.delayDays > 0 ? (
                  <div className="mt-1 text-[11px] text-rose-600 font-medium">
                    +{prop.delayDays}d variance from committed date
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                    On track with original agreement
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
                <span className="text-[11px] text-slate-400 font-mono">
                  Site Lead: {prop.assignedCoordinatorName.split(' ')[0]}
                </span>

                <div className="flex items-center gap-2">
                  {canManageProjects && (
                    <>
                      <button
                        onClick={(e) => handleOpenEdit(prop, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                        title="Edit Unit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(prop.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Unit / ID</th>
                  <th className="px-5 py-3.5 font-semibold">Project & Wing</th>
                  <th className="px-5 py-3.5 font-semibold">Location (State/City/Area)</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Package</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Progress</th>
                  <th className="px-5 py-3.5 font-semibold">Delivery Target</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map(prop => (
                  <tr
                    key={prop.id}
                    onClick={() => {
                      onSelectProperty(prop.id);
                      onNavigate('property-detail', prop.id);
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[11px] text-slate-400">{prop.id}</div>
                      <div className="font-bold text-slate-900 mt-0.5">{prop.unitNumber}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div className="font-medium text-slate-900">{prop.projectName}</div>
                      {prop.buildingName && <div className="text-[11px] text-slate-500">{prop.buildingName}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-semibold">{prop.city || 'Chennai'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{prop.locality} · {prop.state}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{prop.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{prop.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <PackageBadge packageType={prop.packageType} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PropertyStatusBadge status={prop.status} />
                    </td>
                    <td className="px-5 py-3.5 w-36">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-900 font-bold">{prop.overallProgress}%</span>
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${prop.verifiedProgress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <div className="text-slate-800 font-semibold">{prop.currentEstimatedDate}</div>
                      {prop.delayDays > 0 ? (
                        <div className="text-[10px] text-rose-600 font-bold">+{prop.delayDays}d delay</div>
                      ) : (
                        <div className="text-[10px] text-emerald-700">On Track</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {canManageProjects && (
                          <>
                            <button
                              onClick={(e) => handleOpenEdit(prop, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(prop.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Property Unit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProperty ? 'Edit Property Unit' : 'Add New Property & Customer Contract'}
        subtitle="Specify construction finishing package, itemized scope, and contractual handover schedule"
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {duplicateError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{duplicateError}</span>
            </div>
          )}

          {/* Project & Site Location Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Construction Site *
              </label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city} · {p.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Identifier / Number *
              </label>
              <input
                type="text"
                required
                value={formUnitNumber}
                onChange={(e) => setFormUnitNumber(e.target.value)}
                placeholder="e.g. Tower A - Unit 401 (3BHK) or Villa #08"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Selected Site Geographical Inheritance Box */}
          {(() => {
            const currentSite = projects.find(p => p.id === formProjectId) || projects[0];
            return (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Inherited Geographical Location:</span>
                  </span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    {currentSite?.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-mono font-medium">
                  State: {currentSite?.state} → City: {currentSite?.city} → Locality: {currentSite?.locality}
                </div>
                <div className="text-[11px] text-slate-500">
                  Address: {currentSite?.address}
                </div>
              </div>
            );
          })()}

          {/* Hierarchy Levels: Building and Floor (Optional for Villas & Independent Houses) */}
          {(() => {
            const currentSite = projects.find(p => p.id === formProjectId) || projects[0];
            const isApartment = currentSite?.type === 'Apartment Complex';

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building Wing {isApartment ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formBuildingName}
                    onChange={(e) => setFormBuildingName(e.target.value)}
                    placeholder={isApartment ? "e.g. Tower A" : "Optional for Villa / House"}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  {!isApartment && (
                    <span className="text-[10px] text-slate-400">Optional for {currentSite?.type}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor Number {isApartment ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formFloorNumber ?? ''}
                    onChange={(e) => setFormFloorNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={isApartment ? "e.g. 1" : "Optional"}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Built-up Area (Sq.Ft) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formAreaSqFt}
                    onChange={(e) => setFormAreaSqFt(parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            );
          })()}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-800">Customer Contract Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="e.g. R. Senthil Kumar"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={formCustomerEmail}
                  onChange={(e) => setFormCustomerEmail(e.target.value)}
                  placeholder="senthil@gmail.com"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Construction Package Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Contracted Construction Package *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(PACKAGE_DEFINITIONS) as PackageType[]).map((pkgKey) => {
                const pkg = PACKAGE_DEFINITIONS[pkgKey];
                const isSelected = formPackage === pkgKey;
                return (
                  <div
                    key={pkgKey}
                    onClick={() => setFormPackage(pkgKey)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{pkg.shortName}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {pkg.scopeSummary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* If Custom Package Selected, Show Interactive Inclusions Checklist */}
          {formPackage === 'Package D: Custom Package' && (
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-purple-700" />
                <span>Custom Package: Select Included Activities</span>
              </div>
              <p className="text-[11px] text-purple-800">
                Check each activity included in this customer's customized agreement:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {STANDARD_ACTIVITIES.map(act => {
                  const isChecked = customInclusions.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      className="flex items-start gap-2 p-1.5 bg-white rounded border border-purple-100 text-xs text-slate-800 cursor-pointer hover:bg-purple-50/30"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleActivityInclusion(act.id)}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-[11px] truncate">{act.name}</div>
                        <div className="text-[10px] text-slate-400">Stage: {act.stageName} ({act.defaultDurationDays}d)</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Original Committed Delivery Date *
            </label>
            <input
              type="date"
              required
              value={formCommittedDate}
              onChange={(e) => setFormCommittedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              {editingProperty ? 'Save Changes' : 'Register Unit & Generate Tasks'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteProperty(deleteConfirmId);
        }}
        title="Delete Property Unit"
        message="Are you sure you want to delete this property? All associated tasks, customization requests, and site photos will be permanently removed."
        confirmText="Delete Unit"
        variant="danger"
      />
    </div>
  );
};
