import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConstructionProject, ProjectType, ProjectStatus, LocationFilterState } from '../types';
import { LocationFilterBar } from '../components/location/LocationFilterBar';
import { getScopedProjects } from '../services/permissions';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProgressBar } from '../components/common/ProgressBar';
import { calculateProjectProgress, ProgressCalculationResult } from '../services/estimationEngine';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  MapPin, 
  Calendar, 
  User, 
  Edit3, 
  Trash2, 
  ChevronRight,
  Layers, 
  ArrowRight,
  Compass,
  Navigation,
  AlertCircle,
  Calculator,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Check,
  Percent,
  X
} from 'lucide-react';

interface CityLocationInfo {
  localities: string[];
  lat: number;
  lng: number;
}

export const REGIONAL_LOCATION_PRESETS: Record<string, Record<string, CityLocationInfo>> = {
  'Andhra Pradesh': {
    'Visakhapatnam': {
      localities: ['Rushikonda', 'Beach Road Corridor', 'MVP Colony', 'Madhurawada', 'Gajuwaka', 'Siripuram', 'Yendada', 'Seethammadhara', 'Pendurthi'],
      lat: 17.7816,
      lng: 83.3778
    },
    'Vijayawada': {
      localities: ['Tadigadapa - Kanuru', 'MG Road / Bandar Road', 'Benz Circle', 'Bhavanipuram', 'Gannavaram (Airport Corridor)', 'Poranki', 'Gollapudi', 'Enikepadu'],
      lat: 16.4851,
      lng: 80.6865
    },
    'Guntur / Amaravati': {
      localities: ['Amaravati Core Capital', 'Pattabhipuram', 'Brodipet', 'Lakshmipuram', 'Gujjanagundla', 'Mangalagiri', 'Nallapadu'],
      lat: 16.5417,
      lng: 80.5158
    },
    'Tirupati': {
      localities: ['Renigunta Road', 'MR Palli', 'Alipiri', 'AIR Bypass Road', 'Chandragiri', 'Korlagunta', 'Bhavani Nagar'],
      lat: 13.6288,
      lng: 79.4192
    },
    'Rajahmundry': {
      localities: ['Danavaipeta', 'Morampudi', 'Diwancheruvu', 'Dowleswaram', 'Kotipalli'],
      lat: 17.0005,
      lng: 81.8040
    },
    'Kakinada': {
      localities: ['Smart City Port Area', 'Sarpavaram', 'Bhanugudi Junction', 'Madhavapatnam'],
      lat: 16.9891,
      lng: 82.2475
    },
    'Nellore': {
      localities: ['Magunta Layout', 'Dargamitta', 'Vedayapalem', 'Pogathota'],
      lat: 14.4426,
      lng: 79.9865
    },
    'Kurnool': {
      localities: ['Nandyal Road', 'B-Camp', 'Venkatramana Colony', 'Joharapuram'],
      lat: 15.8281,
      lng: 78.0373
    }
  },
  'Telangana': {
    'Hyderabad': {
      localities: ['HITEC City - Madhapur', 'Gachibowli', 'Financial District', 'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Kukatpally', 'Miyapur', 'Tellapur', 'Kokapet', 'Manikonda'],
      lat: 17.4474,
      lng: 78.3762
    },
    'Warangal': {
      localities: ['Hanamkonda', 'Kazipet', 'Subedari', 'Nakkalagutta', 'Hunter Road'],
      lat: 17.9784,
      lng: 79.5941
    },
    'Secunderabad': {
      localities: ['Sainikpuri', 'Trimulgherry', 'Marredpally', 'AS Rao Nagar', 'Begumpet'],
      lat: 17.4399,
      lng: 78.4983
    },
    'Karimnagar': {
      localities: ['Mukarampura', 'Kashmirgadda', 'Collectorate Road', 'Manakondur Road'],
      lat: 18.4386,
      lng: 79.1288
    },
    'Nizamabad': {
      localities: ['Khaleelwadi', 'Bodhan Road', 'Armoor Bypass', 'Vinayak Nagar'],
      lat: 18.6725,
      lng: 78.0941
    },
    'Khammam': {
      localities: ['Wyra Road', 'Mamillagudem', 'Rotary Nagar', 'Ballepally'],
      lat: 17.2473,
      lng: 80.1514
    }
  },
  'Tamil Nadu': {
    'Chennai': {
      localities: ['OMR - Sholinganallur', 'Perungudi', 'Anna Nagar West', 'Velachery', 'Guindy', 'Porur', 'Tambaram'],
      lat: 12.8995,
      lng: 80.2279
    },
    'Coimbatore': {
      localities: ['Saravanampatti', 'RS Puram', 'Peelamedu', 'Gandhipuram', 'Avinashi Road'],
      lat: 11.0825,
      lng: 76.9958
    },
    'Madurai': {
      localities: ['KK Nagar', 'Anna Nagar', 'SS Colony', 'TVS Nagar'],
      lat: 9.9252,
      lng: 78.1198
    }
  },
  'Karnataka': {
    'Bengaluru': {
      localities: ['Whitefield', 'Electronic City', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Hebbal'],
      lat: 12.9698,
      lng: 77.7500
    },
    'Mysuru': {
      localities: ['Gokulam', 'Vijayanagar', 'Kuvempunagar', 'Jayalakshmipuram'],
      lat: 12.2958,
      lng: 76.6394
    }
  },
  'Kerala': {
    'Kochi': {
      localities: ['Kakkanad (InfoPark)', 'Marine Drive', 'Edappally', 'Panampilly Nagar'],
      lat: 9.9312,
      lng: 76.2673
    },
    'Thiruvananthapuram': {
      localities: ['Kazhakoottam (Technopark)', 'Kowdiar', 'Vellayambalam', 'Pattom'],
      lat: 8.5241,
      lng: 76.9366
    }
  },
  'Maharashtra': {
    'Mumbai': {
      localities: ['Bandra West', 'Andheri East', 'Powai', 'Worli'],
      lat: 19.0760,
      lng: 72.8777
    },
    'Pune': {
      localities: ['Hinjewadi Tech Zone', 'Baner', 'Kalyani Nagar', 'Kothrud'],
      lat: 18.5204,
      lng: 73.8567
    }
  }
};

interface ProjectsProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProject: (projectId: string) => void;
  initialInspectingProjectId?: string;
}

export const Projects: React.FC<ProjectsProps> = ({ onNavigate, onSelectProject, initialInspectingProjectId }) => {
  const { 
    projects, 
    properties, 
    tasks, 
    addProject, 
    updateProject, 
    deleteProject, 
    addTask, 
    updateTask, 
    applyProjectTemplate 
  } = useData();
  const { canManageProjects, availableUsers, role, currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ConstructionProject | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Construction Stages Template Option for New Project
  const [formApplyTemplate, setFormApplyTemplate] = useState(true);
  const [formTemplateType, setFormTemplateType] = useState<ProjectType>('Apartment Complex');

  // Project Progress Inspection / Details View
  const [inspectingProject, setInspectingProject] = useState<ConstructionProject | null>(() => {
    if (initialInspectingProjectId) {
      return projects.find(p => p.id === initialInspectingProjectId) || null;
    }
    return null;
  });

  // Quick Add Tasks / Apply Template Modal
  const [quickAddModalProject, setQuickAddModalProject] = useState<ConstructionProject | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskStageId, setQuickTaskStageId] = useState(2);
  const [quickTaskWeight, setQuickTaskWeight] = useState(8);
  const [quickTaskStatus, setQuickTaskStatus] = useState<TaskStatus>('In Progress');
  const [quickTaskCompletion, setQuickTaskCompletion] = useState(50);
  const [selectedInspectStageId, setSelectedInspectStageId] = useState<number | 'all'>('all');

  // Location Filtering State
  const [locationFilters, setLocationFilters] = useState<LocationFilterState>({
    state: 'all',
    city: 'all',
    locality: 'all',
    projectId: 'all',
    propertyType: 'all'
  });

  // Form State for Site Registration - Initialized with Andhra Pradesh & Telangana as primary options
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<ProjectType>('Apartment Complex');
  const [formState, setFormState] = useState('Andhra Pradesh');
  const [formCity, setFormCity] = useState('Visakhapatnam');
  const [formLocality, setFormLocality] = useState('Rushikonda');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');
  const [isCustomLocality, setIsCustomLocality] = useState(false);
  const [customLocalityValue, setCustomLocalityValue] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPincode, setFormPincode] = useState('530045');
  const [formLatitude, setFormLatitude] = useState('17.7816');
  const [formLongitude, setFormLongitude] = useState('83.3778');
  const [formDescription, setFormDescription] = useState('');
  const [formPMId, setFormPMId] = useState('usr-pm-1');
  const [formCoordinatorIds, setFormCoordinatorIds] = useState<string[]>(['usr-coord-1']);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCompletionDate, setFormCompletionDate] = useState('2027-03-31');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('In Progress');
  const [wingsCount, setWingsCount] = useState(2);

  // Handler when State select changes
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSt = e.target.value;
    setFormState(selectedSt);
    setValidationError(null);
    setIsCustomCity(false);
    setIsCustomLocality(false);

    const availableCities = REGIONAL_LOCATION_PRESETS[selectedSt] ? Object.keys(REGIONAL_LOCATION_PRESETS[selectedSt]) : [];
    if (availableCities.length > 0) {
      const defaultCity = availableCities[0];
      setFormCity(defaultCity);
      const cityData = REGIONAL_LOCATION_PRESETS[selectedSt][defaultCity];
      const defaultLocality = cityData.localities[0] || '';
      setFormLocality(defaultLocality);
      setFormLatitude(String(cityData.lat));
      setFormLongitude(String(cityData.lng));
    } else {
      setFormCity('');
      setFormLocality('');
    }
  };

  // Handler when City select changes
  const handleCitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValidationError(null);
    if (val === '__custom__') {
      setIsCustomCity(true);
      setCustomCityValue('');
      setFormCity('');
      setIsCustomLocality(true);
      setCustomLocalityValue('');
      setFormLocality('');
    } else {
      setIsCustomCity(false);
      setFormCity(val);
      const cityData = REGIONAL_LOCATION_PRESETS[formState]?.[val];
      if (cityData) {
        setIsCustomLocality(false);
        setFormLocality(cityData.localities[0] || '');
        setFormLatitude(String(cityData.lat));
        setFormLongitude(String(cityData.lng));
      }
    }
  };

  // Handler when Locality select changes
  const handleLocalitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValidationError(null);
    if (val === '__custom__') {
      setIsCustomLocality(true);
      setCustomLocalityValue('');
      setFormLocality('');
    } else {
      setIsCustomLocality(false);
      setFormLocality(val);
    }
  };

  // Available cities for currently selected state
  const availableCitiesForForm = useMemo(() => {
    if (REGIONAL_LOCATION_PRESETS[formState]) {
      return Object.keys(REGIONAL_LOCATION_PRESETS[formState]);
    }
    return [];
  }, [formState]);

  // Available localities for currently selected city
  const availableLocalitiesForForm = useMemo(() => {
    if (REGIONAL_LOCATION_PRESETS[formState] && REGIONAL_LOCATION_PRESETS[formState][formCity]) {
      return REGIONAL_LOCATION_PRESETS[formState][formCity].localities;
    }
    return [];
  }, [formState, formCity]);

  const resetForm = () => {
    setValidationError(null);
    setFormName('');
    setFormCode('');
    setFormType('Apartment Complex');
    // Primary initialized state: Andhra Pradesh
    setFormState('Andhra Pradesh');
    setFormCity('Visakhapatnam');
    setFormLocality('Rushikonda');
    setIsCustomCity(false);
    setCustomCityValue('');
    setIsCustomLocality(false);
    setCustomLocalityValue('');
    setFormAddress('');
    setFormPincode('530045');
    setFormLatitude('17.7816');
    setFormLongitude('83.3778');
    setFormDescription('');
    setFormPMId('usr-pm-1');
    setFormCoordinatorIds(['usr-coord-1']);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormCompletionDate('2027-03-31');
    setFormStatus('In Progress');
    setWingsCount(2);
    setEditingProject(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (project: ConstructionProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setValidationError(null);
    setFormName(project.name);
    setFormCode(project.code);
    setFormType(project.type);

    const pState = project.state || 'Andhra Pradesh';
    const pCity = project.city || (REGIONAL_LOCATION_PRESETS[pState] ? Object.keys(REGIONAL_LOCATION_PRESETS[pState])[0] : '');
    const pLocality = project.locality || '';

    setFormState(pState);
    setFormCity(pCity);
    setFormLocality(pLocality);

    const stateCities = REGIONAL_LOCATION_PRESETS[pState] ? Object.keys(REGIONAL_LOCATION_PRESETS[pState]) : [];
    const isCityInPreset = stateCities.includes(pCity);
    setIsCustomCity(!isCityInPreset && pCity !== '');
    setCustomCityValue(!isCityInPreset ? pCity : '');

    const cityData = REGIONAL_LOCATION_PRESETS[pState]?.[pCity];
    const cityLocalities = cityData?.localities || [];
    const isLocalityInPreset = cityLocalities.includes(pLocality);
    setIsCustomLocality(!isLocalityInPreset && pLocality !== '');
    setCustomLocalityValue(!isLocalityInPreset ? pLocality : '');

    setFormAddress(project.address || '');
    setFormPincode(project.pincode || '');
    setFormLatitude(project.latitude ? String(project.latitude) : '');
    setFormLongitude(project.longitude ? String(project.longitude) : '');
    setFormDescription(project.description);
    setFormPMId(project.projectManagerId);
    setFormCoordinatorIds(project.assignedCoordinatorIds || ['usr-coord-1']);
    setFormStartDate(project.startDate);
    setFormCompletionDate(project.plannedCompletionDate);
    setFormStatus(project.status);
    setWingsCount(project.buildings?.length || 1);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Mandatory validation enforcement
    if (!formName.trim()) {
      setValidationError('Project / Site Name is mandatory.');
      return;
    }
    if (!formState.trim()) {
      setValidationError('State is mandatory. Please select a state from the dropdown.');
      return;
    }
    if (!formCity.trim()) {
      setValidationError('City is mandatory. Please select or enter a city.');
      return;
    }
    if (!formLocality.trim()) {
      setValidationError('Area / Locality is mandatory. Please select or enter an area/locality.');
      return;
    }

    const pm = availableUsers.find(u => u.id === formPMId) || availableUsers[1];
    const computedLocation = `${formLocality.trim()}, ${formCity.trim()}, ${formState.trim()}`;
    const latNum = formLatitude.trim() ? parseFloat(formLatitude) : undefined;
    const lngNum = formLongitude.trim() ? parseFloat(formLongitude) : undefined;

    if (editingProject) {
      updateProject(editingProject.id, {
        name: formName,
        code: formCode || editingProject.code,
        type: formType,
        state: formState.trim(),
        city: formCity.trim(),
        locality: formLocality.trim(),
        location: computedLocation,
        address: formAddress,
        pincode: formPincode,
        latitude: isNaN(latNum as any) ? undefined : latNum,
        longitude: isNaN(lngNum as any) ? undefined : lngNum,
        description: formDescription,
        projectManagerId: pm.id,
        projectManagerName: pm.name,
        assignedCoordinatorIds: formCoordinatorIds,
        startDate: formStartDate,
        plannedCompletionDate: formCompletionDate,
        status: formStatus
      });
    } else {
      // Create buildings / wings if Apartment Complex
      const buildings = formType === 'Apartment Complex' 
        ? Array.from({ length: wingsCount }, (_, i) => ({
            id: `BLD-${formCode || 'PRJ'}-W${i + 1}`,
            projectId: '',
            name: `Tower ${String.fromCharCode(65 + i)}`,
            floorsCount: 6,
            totalUnits: 12
          }))
        : [];

      addProject({
        name: formName,
        code: formCode || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        type: formType,
        state: formState.trim(),
        city: formCity.trim(),
        locality: formLocality.trim(),
        location: computedLocation,
        address: formAddress,
        pincode: formPincode,
        latitude: isNaN(latNum as any) ? undefined : latNum,
        longitude: isNaN(lngNum as any) ? undefined : lngNum,
        description: formDescription,
        projectManagerId: pm.id,
        projectManagerName: pm.name,
        assignedCoordinatorIds: formCoordinatorIds,
        startDate: formStartDate,
        plannedCompletionDate: formCompletionDate,
        status: formStatus,
        totalUnits: 0,
        buildings
      }, {
        applyTemplate: formApplyTemplate,
        templateType: formTemplateType
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Filtered projects by Search, Role, and Location Hierarchy
  const filteredProjects = useMemo(() => {
    let result = getScopedProjects(currentUser, projects);

    if (locationFilters.state !== 'all') {
      result = result.filter(p => p.state === locationFilters.state);
    }
    if (locationFilters.city !== 'all') {
      result = result.filter(p => p.city === locationFilters.city);
    }
    if (locationFilters.locality !== 'all') {
      result = result.filter(p => p.locality === locationFilters.locality);
    }
    if (locationFilters.projectId !== 'all') {
      result = result.filter(p => p.id === locationFilters.projectId);
    }
    if (locationFilters.propertyType !== 'all') {
      result = result.filter(p => p.type === locationFilters.propertyType);
    }

    return result.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            p.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || p.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, locationFilters, searchQuery, selectedType, selectedStatus, currentUser]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Construction Projects & Sites
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographically managed apartment complexes, villa communities, and custom independent homes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('map-view')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Map & Hierarchy</span>
          </button>

          {canManageProjects && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Site</span>
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
            placeholder="Search by project name, code, or location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Project Types</option>
            <option value="Apartment Complex">Apartment Complex</option>
            <option value="Villa Community">Villa Community</option>
            <option value="Individual Villa">Individual Villa</option>
            <option value="Independent House">Independent House</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Finishing">Finishing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const progressResult = calculateProjectProgress(projectTasks);

            return (
              <div
                key={project.id}
                onClick={() => {
                  onSelectProject(project.id);
                  onNavigate('project-detail', project.id);
                }}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group"
              >
                {/* Top Strip */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {project.code}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      project.status === 'In Progress' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      project.status === 'Finishing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-amber-700 transition-colors">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{project.location}</span>
                  </p>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Progress Section */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100">
                  {progressResult.hasTasks ? (
                    <div className="space-y-1.5">
                      <ProgressBar
                        progress={progressResult.progress}
                        verifiedProgress={progressResult.verifiedProgress}
                        showLabel
                        size="sm"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                        <span>{progressResult.completedTasks} of {progressResult.totalTasks} tasks complete</span>
                        <span className="font-semibold text-slate-700">{progressResult.remainingPercentage}% remaining</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md text-[11px] font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Tasks not configured</span>
                      </div>
                      {canManageProjects && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickAddModalProject(project);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Tasks</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata & Actions Footer */}
                <div className="p-5 pt-3 mt-auto border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{project.projectManagerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">Due: {project.plannedCompletionDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingProject(project);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Inspect Construction Stages & Calculation"
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-600" />
                      <span>Inspect</span>
                    </button>

                    {canManageProjects && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(project, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                          title="Edit Project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(project.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform ml-0.5">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Code / Name</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 font-semibold">Lead Manager</th>
                  <th className="px-5 py-3.5 font-semibold">Units</th>
                  <th className="px-5 py-3.5 font-semibold">Progress</th>
                  <th className="px-5 py-3.5 font-semibold">Target Finish</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const progressResult = calculateProjectProgress(projectTasks);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => {
                        onSelectProject(project.id);
                        onNavigate('project-detail', project.id);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono font-semibold text-slate-500 text-[11px]">
                          {project.code}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {project.name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {project.type}
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate">
                        {project.location}
                      </td>
                      <td className="px-5 py-4 text-slate-800 font-medium">
                        {project.projectManagerName}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700 font-medium">
                        {projectTasks.length} tasks
                      </td>
                      <td className="px-5 py-4 min-w-[180px]">
                        {progressResult.hasTasks ? (
                          <div className="space-y-1">
                            <ProgressBar
                              progress={progressResult.progress}
                              verifiedProgress={progressResult.verifiedProgress}
                              showLabel
                              size="sm"
                            />
                            <div className="text-[10px] text-slate-500 font-mono">
                              {progressResult.completedTasks}/{progressResult.totalTasks} complete · {progressResult.remainingPercentage}% remaining
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Tasks not configured
                            </span>
                            {canManageProjects && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickAddModalProject(project);
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {project.plannedCompletionDate}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setInspectingProject(project)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                            title="Inspect Calculation & Stages"
                          >
                            <Calculator className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          {canManageProjects && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(project, e)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                title="Edit Project"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(project.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              onSelectProject(project.id);
                              onNavigate('project-detail', project.id);
                            }}
                            className="p-1.5 text-amber-700 hover:text-amber-900"
                            title="Open Explorer"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProject ? 'Edit Construction Project' : 'Register New Construction Project'}
        subtitle="Configure project hierarchy, typology, and leadership assignment"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{validationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Geographical Location Hierarchy */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Geographical Location Hierarchy</span>
              </span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded font-mono">
                Mandatory Fields (AP & Telangana Initialized)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* State Dropdown Select - Initialized with Andhra Pradesh & Telangana as primary options */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>State <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono">Req</span>
                </label>
                <select
                  required
                  value={formState}
                  onChange={handleStateChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-medium shadow-2xs"
                >
                  <optgroup label="⭐ Primary Priority States">
                    <option value="Andhra Pradesh">Andhra Pradesh (Primary)</option>
                    <option value="Telangana">Telangana (Primary)</option>
                  </optgroup>
                  <optgroup label="Other Operating Regions">
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Maharashtra">Maharashtra</option>
                  </optgroup>
                  {!['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Kerala', 'Maharashtra'].includes(formState) && (
                    <option value={formState}>{formState} (Current)</option>
                  )}
                </select>
              </div>

              {/* City Dropdown Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>City <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono">Req</span>
                </label>
                <select
                  required
                  value={isCustomCity ? '__custom__' : formCity}
                  onChange={handleCitySelectChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-medium shadow-2xs"
                >
                  <option value="" disabled>-- Select City --</option>
                  {availableCitiesForForm.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  {formCity && !availableCitiesForForm.includes(formCity) && !isCustomCity && (
                    <option value={formCity}>{formCity} (Current)</option>
                  )}
                  <option value="__custom__">+ Enter Custom City...</option>
                </select>
                {isCustomCity && (
                  <input
                    type="text"
                    required
                    value={customCityValue}
                    onChange={(e) => {
                      setCustomCityValue(e.target.value);
                      setFormCity(e.target.value);
                    }}
                    placeholder="Type custom city name..."
                    className="mt-1.5 w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-amber-50/50 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Area / Locality Dropdown Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Area / Locality <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono">Req</span>
                </label>
                <select
                  required
                  value={isCustomLocality ? '__custom__' : formLocality}
                  onChange={handleLocalitySelectChange}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-medium shadow-2xs"
                >
                  <option value="" disabled>-- Select Area / Locality --</option>
                  {availableLocalitiesForForm.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                  {formLocality && !availableLocalitiesForForm.includes(formLocality) && !isCustomLocality && (
                    <option value={formLocality}>{formLocality} (Current)</option>
                  )}
                  <option value="__custom__">+ Enter Custom Area...</option>
                </select>
                {isCustomLocality && (
                  <input
                    type="text"
                    required
                    value={customLocalityValue}
                    onChange={(e) => {
                      setCustomLocalityValue(e.target.value);
                      setFormLocality(e.target.value);
                    }}
                    placeholder="Type custom locality/area..."
                    className="mt-1.5 w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-amber-50/50 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Site Address
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Survey No, Plot, Street / Highway"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Postal Pincode
                </label>
                <input
                  type="text"
                  value={formPincode}
                  onChange={(e) => setFormPincode(e.target.value)}
                  placeholder="e.g. 500081 or 530045"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-mono"
                />
              </div>
            </div>

            {/* Coordinates (Optional) */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-sky-500" />
                  <span>Geographical Coordinates (Optional for Map GIS)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const c = formCity.toLowerCase();
                    if (c.includes('hyderabad') || c.includes('hitec')) {
                      setFormLatitude('17.4474');
                      setFormLongitude('78.3762');
                    } else if (c.includes('gachibowli')) {
                      setFormLatitude('17.4399');
                      setFormLongitude('78.3489');
                    } else if (c.includes('visakhapatnam') || c.includes('vizag') || c.includes('rushikonda')) {
                      setFormLatitude('17.7816');
                      setFormLongitude('83.3778');
                    } else if (c.includes('vijayawada') || c.includes('tadigadapa')) {
                      setFormLatitude('16.4851');
                      setFormLongitude('80.6865');
                    } else if (c.includes('amaravati') || c.includes('guntur')) {
                      setFormLatitude('16.5417');
                      setFormLongitude('80.5158');
                    } else if (c.includes('tirupati')) {
                      setFormLatitude('13.6288');
                      setFormLongitude('79.4192');
                    } else if (c.includes('warangal')) {
                      setFormLatitude('17.9784');
                      setFormLongitude('79.5941');
                    } else if (c.includes('coimbatore')) {
                      setFormLatitude('11.0825');
                      setFormLongitude('76.9958');
                    } else if (c.includes('bengaluru') || c.includes('bangalore')) {
                      setFormLatitude('12.9698');
                      setFormLongitude('77.7500');
                    } else if (c.includes('kochi')) {
                      setFormLatitude('9.9312');
                      setFormLongitude('76.2673');
                    } else {
                      setFormLatitude('12.8995');
                      setFormLongitude('80.2279');
                    }
                  }}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                >
                  ⚡ Preset City Coordinates
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  placeholder="Latitude e.g. 12.8995"
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-mono"
                />
                <input
                  type="text"
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  placeholder="Longitude e.g. 80.2279"
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Site Identification & Typology */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site / Project Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Royal Palms Residences"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Code
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. RP-2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Typology *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white font-medium"
              >
                <option value="Apartment Complex">Apartment Complex (Tower/Building & Floor hierarchy)</option>
                <option value="Villa Community">Villa Community (Villas with optional building levels)</option>
                <option value="Independent House">Independent House (Direct site-to-house hierarchy)</option>
                <option value="Individual Villa">Individual Villa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Manager *
              </label>
              <select
                value={formPMId}
                onChange={(e) => setFormPMId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {availableUsers.filter(u => u.role === 'admin' || u.role === 'project_manager').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Site Coordinators */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Site Civil Coordinators
            </label>
            <div className="flex flex-wrap gap-2">
              {availableUsers.filter(u => u.role === 'site_coordinator' || u.role === 'project_manager').map(coord => {
                const isSelected = formCoordinatorIds.includes(coord.id);
                return (
                  <button
                    key={coord.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormCoordinatorIds(prev => prev.filter(id => id !== coord.id));
                      } else {
                        setFormCoordinatorIds(prev => [...prev, coord.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3 h-3 text-amber-600" />
                    <span>{coord.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Towers / Wings Structure for Apartment Complexes */}
          {formType === 'Apartment Complex' && !editingProject && (
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs space-y-2">
              <div className="font-semibold text-sky-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-700" />
                <span>Apartment Complex Building & Wing Structure</span>
              </div>
              <p className="text-sky-800 text-[11px]">
                Enter number of towers/wings to bootstrap initial building hierarchy:
              </p>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-sky-950">Number of Wings / Towers:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={wingsCount}
                  onChange={(e) => setWingsCount(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 text-xs border border-sky-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Scope & Description
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Outline project specifications, community amenities, and client briefing..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Completion Date
              </label>
              <input
                type="date"
                value={formCompletionDate}
                onChange={(e) => setFormCompletionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Development Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Finishing">Finishing</option>
                <option value="Handover Phase">Handover Phase</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* 3. Construction Stages & Tasks Blueprint Template Workflow */}
          {!editingProject && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formApplyTemplate}
                    onChange={(e) => setFormApplyTemplate(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Initialize standard construction stages & tasks immediately
                  </span>
                </label>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                Automatically provisions weighted milestone tasks across all 15 construction stages for dynamic, automated progress tracking. If unchecked, project will register with <span className="font-semibold text-amber-900 font-mono">Tasks not configured (0%)</span> and an Add Tasks action.
              </p>

              {formApplyTemplate && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Stage Blueprint Template:
                  </label>
                  <select
                    value={formTemplateType}
                    onChange={(e) => setFormTemplateType(e.target.value as ProjectType)}
                    className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 font-medium shadow-2xs"
                  >
                    <option value="Apartment Complex">Apartment Complex Template (15 Stages: Piling, Raft, Columns, MEP, Elevators & Lobbies)</option>
                    <option value="Villa Community">Villa Community Template (15 Stages: Demarcation, Duplex RCC, Gardens, Solar & Clubhouse)</option>
                    <option value="Independent House">Independent House Template (15 Stages: Footings, Red Brick, Roof Slab, Woodwork & Handover)</option>
                    <option value="Apartment">Apartment / Single Wing Template</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              {editingProject ? 'Save Changes' : 'Register Site'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Project Details & Dynamic Calculation Inspection Modal */}
      {inspectingProject && (() => {
        const pTasks = tasks.filter(t => t.projectId === inspectingProject.id);
        const calc = calculateProjectProgress(pTasks);
        const filteredTasksForModal = selectedInspectStageId === 'all' 
          ? pTasks 
          : pTasks.filter(t => t.stageId === selectedInspectStageId);

        return (
          <Modal
            isOpen={true}
            onClose={() => {
              setInspectingProject(null);
              setSelectedInspectStageId('all');
            }}
            title={inspectingProject.name}
            subtitle={`${inspectingProject.code} · ${inspectingProject.type} · ${inspectingProject.location}`}
            maxWidth="4xl"
          >
            <div className="space-y-6">
              {/* Executive Progress KPI Strip */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                      Dynamic Construction Progress
                    </span>
                    <div className="flex items-baseline gap-3 mt-0.5">
                      <span className="text-3xl font-extrabold font-mono text-white">
                        {calc.hasTasks ? `${calc.progress}%` : 'Tasks not configured'}
                      </span>
                      {calc.hasTasks && (
                        <span className="text-xs font-mono text-slate-300">
                          ({calc.remainingPercentage}% remaining · {calc.verifiedProgress}% PM verified)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      inspectingProject.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                      inspectingProject.status === 'Finishing' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                      'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    }`}>
                      {inspectingProject.status}
                    </span>
                    {canManageProjects && (
                      <button
                        onClick={() => {
                          setQuickAddModalProject(inspectingProject);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    )}
                  </div>
                </div>

                {calc.hasTasks ? (
                  <ProgressBar
                    progress={calc.progress}
                    verifiedProgress={calc.verifiedProgress}
                    showLabel={false}
                    size="md"
                    className="mt-1"
                  />
                ) : (
                  <div className="text-xs text-amber-300/90 font-mono py-1">
                    0% — No tasks have been linked to this project yet.
                  </div>
                )}
              </div>

              {/* Mathematical Calculation Breakdown Formula Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    <span>Weighted Calculation Methodology & Live Formula</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Formula: Sum(Weight × Completion) / Sum(Weights)
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1.5 shadow-2xs">
                  <div className="text-amber-800 font-bold">
                    {calc.formula}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {calc.calculationExplanation}
                  </div>
                </div>

                {/* Status Counts Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-900">
                    <span className="block text-[10px] uppercase font-bold text-emerald-700">Completed (100%)</span>
                    <strong className="text-base">{calc.completedTasks}</strong> tasks
                  </div>
                  <div className="bg-sky-50 border border-sky-200 p-2 rounded-lg text-sky-900">
                    <span className="block text-[10px] uppercase font-bold text-sky-700">In Progress (Record %)</span>
                    <strong className="text-base">{calc.inProgressTasks}</strong> tasks
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-900">
                    <span className="block text-[10px] uppercase font-bold text-amber-700">Awaiting PM Sign</span>
                    <strong className="text-base">{calc.awaitingTasks}</strong> tasks
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg text-rose-900">
                    <span className="block text-[10px] uppercase font-bold text-rose-700">Blocked (0%)</span>
                    <strong className="text-base">{calc.blockedTasks}</strong> tasks
                  </div>
                  <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-600">Not Started (0%)</span>
                    <strong className="text-base">{calc.notStartedTasks}</strong> tasks
                  </div>
                </div>
              </div>

              {/* If no tasks: Callout to apply template */}
              {!calc.hasTasks && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">No Construction Tasks Configured</h4>
                    <p className="text-xs text-amber-800 max-w-md mx-auto mt-1">
                      This project currently displays 0% because no milestone tasks are assigned. Apply the standard 15-stage blueprint template or manually add trade tasks.
                    </p>
                  </div>
                  {canManageProjects && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => applyProjectTemplate(inspectingProject.id, inspectingProject.type)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Apply {inspectingProject.type} 15-Stage Template</span>
                      </button>
                      <button
                        onClick={() => setQuickAddModalProject(inspectingProject)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Custom Task</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Stage-by-Stage Construction Breakdown */}
              {calc.hasTasks && calc.stagesBreakdown.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-600" />
                      <span>Construction Stages Breakdown ({calc.stagesBreakdown.length} Active Stages)</span>
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500">Filter Stage:</span>
                      <button
                        onClick={() => setSelectedInspectStageId('all')}
                        className={`px-2 py-0.5 rounded font-mono ${
                          selectedInspectStageId === 'all'
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      {calc.stagesBreakdown.map(s => (
                        <button
                          key={s.stageId}
                          onClick={() => setSelectedInspectStageId(s.stageId)}
                          className={`px-2 py-0.5 rounded font-mono ${
                            selectedInspectStageId === s.stageId
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          S{s.stageId}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {calc.stagesBreakdown.map(stage => (
                      <div
                        key={stage.stageId}
                        onClick={() => setSelectedInspectStageId(stage.stageId)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedInspectStageId === stage.stageId
                            ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-bold text-slate-900 truncate">
                            Stage {stage.stageId}: {stage.stageName}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            {stage.stageProgress}%
                          </span>
                        </div>
                        <ProgressBar progress={stage.stageProgress} showLabel={false} size="sm" />
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                          <span>{stage.completedTasks}/{stage.totalTasks} tasks</span>
                          <span>Weight: {stage.stageWeight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Tasks Inspection & Real-Time Completion Controller */}
              {calc.hasTasks && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-slate-600" />
                      <span>Linked Tasks & Live Progress Controllers ({filteredTasksForModal.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Adjusting task completion immediately updates project progress in real time
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {filteredTasksForModal.map(task => {
                      const eff = task.completionPercentage !== undefined
                        ? task.completionPercentage
                        : (task.status === 'Completed' ? 100 : task.status === 'In Progress' ? 50 : 0);

                      return (
                        <div key={task.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  Stage {task.stageId}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{task.title}</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  (Weight: <strong>{task.weight}</strong>)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                task.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                task.status === 'In Progress' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                                task.status === 'Blocked' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                task.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {task.status}
                              </span>

                              <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                                {eff}%
                              </span>
                            </div>
                          </div>

                          {/* Live Slider Controller for Task Completion */}
                          {canManageProjects && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                                  Completion:
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={eff}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    let newStatus: TaskStatus = task.status;
                                    if (val === 100) newStatus = 'Completed';
                                    else if (val > 0 && task.status === 'Not Started') newStatus = 'In Progress';
                                    updateTask(task.id, {
                                      completionPercentage: val,
                                      status: newStatus
                                    });
                                  }}
                                  className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                                />
                                <span className="font-mono text-xs font-semibold text-slate-700 w-10 text-right">
                                  {eff}%
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateTask(task.id, { status: 'In Progress', completionPercentage: 50 })}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded"
                                >
                                  In Progress (50%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateTask(task.id, { status: 'Completed', completionPercentage: 100 })}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                                >
                                  Complete (100%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateTask(task.id, { status: 'Blocked', completionPercentage: eff, blockedReason: 'Civil / Material Dependency' })}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded"
                                >
                                  Block
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Site Lead: <strong className="text-slate-800">{inspectingProject.projectManagerName}</strong> · Due: <span className="font-mono text-slate-700">{inspectingProject.plannedCompletionDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Quick Add Tasks / Apply Template Modal */}
      {quickAddModalProject && (
        <Modal
          isOpen={true}
          onClose={() => setQuickAddModalProject(null)}
          title={`Add Tasks to "${quickAddModalProject.name}"`}
          subtitle={`${quickAddModalProject.code} · ${quickAddModalProject.type} at ${quickAddModalProject.location}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* 1-Click Template Setup Option */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Instant Construction Stages & Tasks Template</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Automatically populate the complete 15-stage construction milestone blueprint tailored for {quickAddModalProject.type}. Progress will immediately become measured and dynamic.
              </p>
              <button
                type="button"
                onClick={() => {
                  applyProjectTemplate(quickAddModalProject.id, quickAddModalProject.type);
                  setQuickAddModalProject(null);
                }}
                className="w-full mt-1 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
              >
                Apply {quickAddModalProject.type} Template (15 Stages)
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono absolute">
                Or Create Custom Task
              </span>
            </div>

            {/* Custom Task Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickTaskTitle.trim()) return;
                const stage = CONSTRUCTION_STAGES.find(s => s.id === quickTaskStageId) || CONSTRUCTION_STAGES[1];
                addTask({
                  title: quickTaskTitle.trim(),
                  description: `Site milestone for ${stage.name}.`,
                  stageId: quickTaskStageId,
                  stageName: stage.name,
                  activityId: 'ACT-CUSTOM',
                  projectId: quickAddModalProject.id,
                  propertyId: 'PROJECT_CORE',
                  unitNumber: 'Site Milestone',
                  assignedTo: quickAddModalProject.projectManagerName,
                  plannedStartDate: quickAddModalProject.startDate,
                  plannedFinishDate: quickAddModalProject.plannedCompletionDate,
                  status: quickTaskStatus,
                  completionPercentage: quickTaskCompletion,
                  priority: 'High',
                  dependencies: [],
                  weight: quickTaskWeight
                });
                setQuickAddModalProject(null);
                setQuickTaskTitle('');
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="e.g. Raft excavation and anti-termite treatment"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Construction Stage
                  </label>
                  <select
                    value={quickTaskStageId}
                    onChange={(e) => setQuickTaskStageId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {CONSTRUCTION_STAGES.map(s => (
                      <option key={s.id} value={s.id}>
                        Stage {s.id}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Weight (1 - 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quickTaskWeight}
                    onChange={(e) => setQuickTaskWeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Status
                  </label>
                  <select
                    value={quickTaskStatus}
                    onChange={(e) => {
                      const st = e.target.value as TaskStatus;
                      setQuickTaskStatus(st);
                      if (st === 'Completed') setQuickTaskCompletion(100);
                      else if (st === 'Not Started' || st === 'Blocked') setQuickTaskCompletion(0);
                      else setQuickTaskCompletion(50);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Completion Percentage ({quickTaskCompletion}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={quickTaskCompletion}
                    onChange={(e) => setQuickTaskCompletion(Number(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickAddModalProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Create & Calculate Progress
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteProject(deleteConfirmId);
        }}
        title="Delete Construction Project"
        message="Are you sure you want to delete this project? All associated units, tasks, and site updates will be permanently removed from browser storage."
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
};
