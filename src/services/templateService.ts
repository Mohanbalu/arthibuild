import { ConstructionTask, ConstructionProject, ProjectType } from '../types';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { addDays, format, parseISO } from 'date-fns';

export interface StageTaskTemplate {
  stageId: number;
  stageName: string;
  activityId: string;
  title: string;
  description: string;
  weight: number;
  durationDays: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export const TEMPLATES_BY_TYPE: Record<string, StageTaskTemplate[]> = {
  'Apartment Complex': [
    {
      stageId: 1,
      stageName: 'Planning and approvals',
      activityId: 'ACT-AC-01',
      title: 'Master site boundary layout, municipal plan sanction & NOCs',
      description: 'DTCP/RERA approvals, environmental clearances, and master grid layout survey.',
      weight: 5,
      durationDays: 20,
      priority: 'Critical'
    },
    {
      stageId: 2,
      stageName: 'Foundation',
      activityId: 'ACT-AC-02',
      title: 'Deep piling, raft excavation & RCC basement foundation pour',
      description: 'Bored cast-in-situ piles, pile caps, anti-termite treatment, and waterproof raft slab.',
      weight: 12,
      durationDays: 30,
      priority: 'Critical'
    },
    {
      stageId: 3,
      stageName: 'Structural construction',
      activityId: 'ACT-AC-03',
      title: 'Multi-level RCC frame, columns & roof slab staging',
      description: 'Vertical column casting, prestressed floor beams, and high-tensile slab concrete.',
      weight: 18,
      durationDays: 45,
      priority: 'Critical'
    },
    {
      stageId: 4,
      stageName: 'Brickwork and walls',
      activityId: 'ACT-AC-04',
      title: 'AAC lightweight block perimeter masonry & corridor wall framing',
      description: 'Precision AAC block laying with polymer mortar and seismic band lintels.',
      weight: 10,
      durationDays: 25,
      priority: 'High'
    },
    {
      stageId: 5,
      stageName: 'Plastering',
      activityId: 'ACT-AC-05',
      title: 'Dual-coat external weather plaster & internal gypsum finish',
      description: 'External sand-faced waterproof plastering and internal smooth ceiling/wall gypsum.',
      weight: 8,
      durationDays: 25,
      priority: 'Medium'
    },
    {
      stageId: 6,
      stageName: 'Electrical installation',
      activityId: 'ACT-AC-06',
      title: 'Transformer yard, central electrical risers & conduit drops',
      description: 'Main electrical distribution panel, armored cabling, floor conduits, and switchboxes.',
      weight: 7,
      durationDays: 20,
      priority: 'High'
    },
    {
      stageId: 7,
      stageName: 'Plumbing',
      activityId: 'ACT-AC-07',
      title: 'Central water supply manifold, STP pipeline & drainage stacks',
      description: 'Concealed CPVC hot/cold distribution lines, SWR drainage risers, and hydro-testing.',
      weight: 7,
      durationDays: 20,
      priority: 'High'
    },
    {
      stageId: 8,
      stageName: 'Flooring',
      activityId: 'ACT-AC-08',
      title: 'Double-charged vitrified flooring & grand lobby granite',
      description: 'Vitrified flooring in common lobbies, corridors, and units with anti-skid bathroom tiles.',
      weight: 8,
      durationDays: 25,
      priority: 'Medium'
    },
    {
      stageId: 9,
      stageName: 'Painting',
      activityId: 'ACT-AC-09',
      title: 'Exterior weather-shield silicone coat & interior emulsion',
      description: 'Wall putty base, alkali-resistant primer, and high-sheen washable emulsion paint.',
      weight: 6,
      durationDays: 20,
      priority: 'Medium'
    },
    {
      stageId: 10,
      stageName: 'Doors and windows',
      activityId: 'ACT-AC-10',
      title: 'Fire-rated stairwell doors & heavy-duty UPVC sliding windows',
      description: 'Engineered entrance fire doors, UPVC 3-track sliding window assemblies with mesh.',
      weight: 5,
      durationDays: 15,
      priority: 'Medium'
    },
    {
      stageId: 11,
      stageName: 'Lighting and fixtures',
      activityId: 'ACT-AC-11',
      title: 'Elevator machine installation & common area solar lighting',
      description: 'Passenger elevator rails/cabin erection and architectural LED illumination.',
      weight: 5,
      durationDays: 15,
      priority: 'High'
    },
    {
      stageId: 12,
      stageName: 'Interior installation',
      activityId: 'ACT-AC-12',
      title: 'Clubhouse, gym fitness zone & entrance security lobby counters',
      description: 'Amenity fitouts, granite cladding, security intercom, and access barrier installation.',
      weight: 5,
      durationDays: 15,
      priority: 'Low'
    },
    {
      stageId: 13,
      stageName: 'Quality inspection',
      activityId: 'ACT-AC-13',
      title: 'Multi-point structural QA audit, fire mock trial & snag list',
      description: 'Fire safety compliance clearance, water pressure audit, and unit handover inspections.',
      weight: 5,
      durationDays: 10,
      priority: 'Critical'
    },
    {
      stageId: 14,
      stageName: 'Defect correction',
      activityId: 'ACT-AC-14',
      title: 'Snag rectifications, facade cleaning & exterior pressure wash',
      description: 'Finishing touch-ups, silicone bead sealing, and deep construction debris clearing.',
      weight: 4,
      durationDays: 10,
      priority: 'High'
    },
    {
      stageId: 15,
      stageName: 'Final handover',
      activityId: 'ACT-AC-15',
      title: 'Municipal Occupancy Certificate & Owners Association handover',
      description: 'Receiving OC, joint owner society walkthrough, digital warranties, and key ceremonies.',
      weight: 3,
      durationDays: 10,
      priority: 'Critical'
    }
  ],

  'Villa Community': [
    {
      stageId: 1,
      stageName: 'Planning and approvals',
      activityId: 'ACT-VC-01',
      title: 'Gated community layout demarcation & civil zoning clearance',
      description: 'Compound boundary sanction, private road network approvals, and borewell drilling.',
      weight: 5,
      durationDays: 18,
      priority: 'High'
    },
    {
      stageId: 2,
      stageName: 'Foundation',
      activityId: 'ACT-VC-02',
      title: 'Villa isolated column footings & plinth tie-beam casting',
      description: 'Excavation to hard strata, anti-termite soil barrier, and plinth beam framework.',
      weight: 12,
      durationDays: 25,
      priority: 'Critical'
    },
    {
      stageId: 3,
      stageName: 'Structural construction',
      activityId: 'ACT-VC-03',
      title: 'Duplex villa ground & first-floor RCC roof slab casting',
      description: 'RCC columns, lintel chajjas, double-height living room slab, and terrace slab.',
      weight: 16,
      durationDays: 35,
      priority: 'Critical'
    },
    {
      stageId: 4,
      stageName: 'Brickwork and walls',
      activityId: 'ACT-VC-04',
      title: 'Wire-cut red clay brick masonry & private garden boundary walls',
      description: 'External brick walls with rich cement mortar and private villa garden perimeter.',
      weight: 10,
      durationDays: 20,
      priority: 'High'
    },
    {
      stageId: 5,
      stageName: 'Plastering',
      activityId: 'ACT-VC-05',
      title: 'Internal ceiling/wall plastering & waterproof terrace screed',
      description: '2-coat river sand cement plastering with micro-fiber crack prevention mesh.',
      weight: 8,
      durationDays: 20,
      priority: 'Medium'
    },
    {
      stageId: 6,
      stageName: 'Electrical installation',
      activityId: 'ACT-VC-06',
      title: 'Concealed copper line wiring, EV charging point & solar conduit',
      description: 'Distribution board, rooftop solar conduit link, and 3-phase domestic earthing.',
      weight: 7,
      durationDays: 15,
      priority: 'High'
    },
    {
      stageId: 7,
      stageName: 'Plumbing',
      activityId: 'ACT-VC-07',
      title: 'Solar water heater plumbing, pressure pump & garden irrigation',
      description: 'CPVC concealed hot/cold lines, underground sump connection, and lawn drip line.',
      weight: 7,
      durationDays: 15,
      priority: 'High'
    },
    {
      stageId: 8,
      stageName: 'Flooring',
      activityId: 'ACT-VC-08',
      title: 'Imported marble in living/dining & designer wooden bedroom tiles',
      description: 'Italian marble water-cut laying, epoxy grouting, and anti-skid patio flooring.',
      weight: 8,
      durationDays: 20,
      priority: 'Medium'
    },
    {
      stageId: 9,
      stageName: 'Painting',
      activityId: 'ACT-VC-09',
      title: 'Royale luxury interior emulsion & external stone texture coat',
      description: 'Surface preparation, moisture barrier primer, and premium washable emulsion.',
      weight: 6,
      durationDays: 18,
      priority: 'Medium'
    },
    {
      stageId: 10,
      stageName: 'Doors and windows',
      activityId: 'ACT-VC-10',
      title: 'Seasoned teak entrance doorway & double-glazed garden patio sliders',
      description: 'Teak frame with digital smart lock and powder-coated acoustic aluminium sliders.',
      weight: 6,
      durationDays: 14,
      priority: 'Medium'
    },
    {
      stageId: 11,
      stageName: 'Lighting and fixtures',
      activityId: 'ACT-VC-11',
      title: 'Architectural mood lighting, chandeliers & Jaguar art fixtures',
      description: 'Smart automated switches, bathroom diverters, rain shower, and terrace spotlights.',
      weight: 5,
      durationDays: 14,
      priority: 'Medium'
    },
    {
      stageId: 12,
      stageName: 'Interior installation',
      activityId: 'ACT-VC-12',
      title: 'Modular acrylic kitchen with quartz counter & master wardrobes',
      description: 'Factory-finish kitchen cabinets, soft-close hardware, and bespoke study woodwork.',
      weight: 5,
      durationDays: 16,
      priority: 'Low'
    },
    {
      stageId: 13,
      stageName: 'Quality inspection',
      activityId: 'ACT-VC-13',
      title: 'Comprehensive 150-point villa snagging & moisture scan audit',
      description: 'Thermal camera check, window water-tightness test, and drainage slope audit.',
      weight: 4,
      durationDays: 8,
      priority: 'Critical'
    },
    {
      stageId: 14,
      stageName: 'Defect correction',
      activityId: 'ACT-VC-14',
      title: 'Snag rectifications, marble mirror re-polish & garden turfing',
      description: 'Diamond crystallization marble polish, paint touch-ups, and lawn landscaping.',
      weight: 3,
      durationDays: 8,
      priority: 'High'
    },
    {
      stageId: 15,
      stageName: 'Final handover',
      activityId: 'ACT-VC-15',
      title: 'Owner housewarming possession ceremony & warranty pack handover',
      description: 'Handover ceremony with customized key docket, solar manuals, and warranty documents.',
      weight: 3,
      durationDays: 6,
      priority: 'Critical'
    }
  ],

  'Independent House': [
    {
      stageId: 1,
      stageName: 'Planning and approvals',
      activityId: 'ACT-IH-01',
      title: 'Architectural CAD plan approval & plot ground marking',
      description: 'Municipal building license, borewell installation, and soil bearing capacity test.',
      weight: 5,
      durationDays: 15,
      priority: 'High'
    },
    {
      stageId: 2,
      stageName: 'Foundation',
      activityId: 'ACT-IH-02',
      title: 'Soil excavation, anti-termite spray & RCC column footings',
      description: 'Isolated footings, column starter stub-ups, and reinforced plinth beam casting.',
      weight: 12,
      durationDays: 20,
      priority: 'Critical'
    },
    {
      stageId: 3,
      stageName: 'Structural construction',
      activityId: 'ACT-IH-03',
      title: 'Ground + First floor RCC columns, beam framework & slab pour',
      description: 'Centering shuttering, Fe550D rebar grid, electrical drops, and M25 concrete casting.',
      weight: 18,
      durationDays: 30,
      priority: 'Critical'
    },
    {
      stageId: 4,
      stageName: 'Brickwork and walls',
      activityId: 'ACT-IH-04',
      title: 'Red clay brick wall construction & window frame positioning',
      description: 'Outer 9-inch load-bearing walls and 4.5-inch inner partitions with lintels.',
      weight: 10,
      durationDays: 18,
      priority: 'High'
    },
    {
      stageId: 5,
      stageName: 'Plastering',
      activityId: 'ACT-IH-05',
      title: 'Internal smooth plastering & external sand-faced cement finish',
      description: '2-coat cement plastering, terrace weathering tiles, and parapet wall coping.',
      weight: 8,
      durationDays: 18,
      priority: 'Medium'
    },
    {
      stageId: 6,
      stageName: 'Electrical installation',
      activityId: 'ACT-IH-06',
      title: 'Concealed PVC conduits, copper wiring & distribution board',
      description: 'Individual phase distribution board, inverter wiring, and earth chemical pit.',
      weight: 7,
      durationDays: 14,
      priority: 'High'
    },
    {
      stageId: 7,
      stageName: 'Plumbing',
      activityId: 'ACT-IH-07',
      title: 'Water tank overhead plumbing, motor pump & concealed CPVC pipes',
      description: 'CPVC supply lines, PVC drainage pipes to municipal line, and pressure leak test.',
      weight: 7,
      durationDays: 14,
      priority: 'High'
    },
    {
      stageId: 8,
      stageName: 'Flooring',
      activityId: 'ACT-IH-08',
      title: 'Vitrified living room tiles & staircase granite cladding',
      description: 'Premium vitrified flooring, anti-skid bathroom tiles, and full-bullnose granite steps.',
      weight: 8,
      durationDays: 16,
      priority: 'Medium'
    },
    {
      stageId: 9,
      stageName: 'Painting',
      activityId: 'ACT-IH-09',
      title: 'Putty coats, primer base & washable acrylic interior emulsion',
      description: 'Smooth wall putty application, primer base, and 2 finish coats of acrylic paint.',
      weight: 6,
      durationDays: 15,
      priority: 'Medium'
    },
    {
      stageId: 10,
      stageName: 'Doors and windows',
      activityId: 'ACT-IH-10',
      title: 'Teakwood main door with brass locks & UPVC sliding windows',
      description: 'Carved teak front door, flush bathroom doors, and soundproof UPVC windows.',
      weight: 5,
      durationDays: 12,
      priority: 'Medium'
    },
    {
      stageId: 11,
      stageName: 'Lighting and fixtures',
      activityId: 'ACT-IH-11',
      title: 'Modular switchplates, ceiling LED fans & CP sanitary fittings',
      description: 'Installing modular switches, geyser points, vanity basin taps, and overhead showers.',
      weight: 5,
      durationDays: 12,
      priority: 'Medium'
    },
    {
      stageId: 12,
      stageName: 'Interior installation',
      activityId: 'ACT-IH-12',
      title: 'Modular kitchen counter with sink & bedroom wardrobe woodwork',
      description: 'Jet black granite kitchen platform, stainless steel sink, and custom laminate wardrobes.',
      weight: 5,
      durationDays: 14,
      priority: 'Low'
    },
    {
      stageId: 13,
      stageName: 'Quality inspection',
      activityId: 'ACT-IH-13',
      title: 'Pre-handover structural & civil quality checklist verification',
      description: 'Checking plumb lines, tap water flow, window sealing, and electrical socket polarities.',
      weight: 4,
      durationDays: 6,
      priority: 'Critical'
    },
    {
      stageId: 14,
      stageName: 'Defect correction',
      activityId: 'ACT-IH-14',
      title: 'Snag list touch-ups, acid tile cleaning & site clearance',
      description: 'Fine paint touch-ups, hardware lubrication, and complete construction waste removal.',
      weight: 3,
      durationDays: 6,
      priority: 'High'
    },
    {
      stageId: 15,
      stageName: 'Final handover',
      activityId: 'ACT-IH-15',
      title: 'Housewarming key ceremony & possession certificate handover',
      description: 'Handing over keys, structural stability certificate, and civil warranty manual.',
      weight: 3,
      durationDays: 4,
      priority: 'Critical'
    }
  ]
};

// Aliases
TEMPLATES_BY_TYPE['Apartment'] = TEMPLATES_BY_TYPE['Apartment Complex'];
TEMPLATES_BY_TYPE['Individual Villa'] = TEMPLATES_BY_TYPE['Villa Community'];

/**
 * Generates initial ConstructionTask records for a project based on its selected template type and project status.
 */
export function generateTasksFromTemplate(
  project: Pick<ConstructionProject, 'id' | 'name' | 'type' | 'startDate' | 'plannedCompletionDate' | 'status'>,
  propertyId: string = 'PROJECT_CORE',
  unitNumber: string = 'Master Milestone'
): ConstructionTask[] {
  const templateList = TEMPLATES_BY_TYPE[project.type] || TEMPLATES_BY_TYPE['Apartment Complex'];

  let rollingDate: Date;
  try {
    rollingDate = parseISO(project.startDate);
  } catch {
    rollingDate = new Date();
  }

  const generatedTasks: ConstructionTask[] = [];

  templateList.forEach((tmpl, index) => {
    const plannedFinish = addDays(rollingDate, tmpl.durationDays);
    const taskId = `TSK-${project.id}-${String(index + 1).padStart(2, '0')}`;
    const prevTaskId = index > 0 ? `TSK-${project.id}-${String(index).padStart(2, '0')}` : undefined;

    // Determine initial status based on project's status
    let taskStatus: ConstructionTask['status'] = 'Not Started';
    let completionPercentage = 0;
    let approvalStatus: ConstructionTask['approvalStatus'] = 'Pending Verification';
    let approvedBy: string | undefined = undefined;

    if (project.status === 'Completed') {
      taskStatus = 'Completed';
      completionPercentage = 100;
      approvalStatus = 'Verified by PM';
      approvedBy = 'Project Manager';
    } else if (project.status === 'Finishing') {
      if (index < 9) {
        taskStatus = 'Completed';
        completionPercentage = 100;
        approvalStatus = 'Verified by PM';
        approvedBy = 'Project Manager';
      } else if (index === 9) {
        taskStatus = 'In Progress';
        completionPercentage = 60;
      } else {
        taskStatus = 'Not Started';
        completionPercentage = 0;
      }
    } else if (project.status === 'In Progress') {
      if (index === 0) {
        taskStatus = 'Completed';
        completionPercentage = 100;
        approvalStatus = 'Verified by PM';
        approvedBy = 'Project Manager';
      } else if (index === 1) {
        taskStatus = 'In Progress';
        completionPercentage = 60;
      } else {
        taskStatus = 'Not Started';
        completionPercentage = 0;
      }
    } else {
      // Planning
      if (index === 0) {
        taskStatus = 'In Progress';
        completionPercentage = 40;
      } else {
        taskStatus = 'Not Started';
        completionPercentage = 0;
      }
    }

    generatedTasks.push({
      id: taskId,
      title: tmpl.title,
      description: tmpl.description,
      stageId: tmpl.stageId,
      stageName: tmpl.stageName,
      activityId: tmpl.activityId,
      projectId: project.id,
      propertyId: propertyId,
      unitNumber: unitNumber,
      assignedTo: 'Lead Civil & MEP Team',
      plannedStartDate: format(rollingDate, 'yyyy-MM-dd'),
      plannedFinishDate: format(plannedFinish, 'yyyy-MM-dd'),
      status: taskStatus,
      completionPercentage,
      priority: tmpl.priority,
      dependencies: prevTaskId ? [prevTaskId] : [],
      weight: tmpl.weight,
      progressNotes: [`Scheduled via ${project.type} standard construction stage template.`],
      photoUrls: [],
      approvalStatus,
      approvedBy
    });

    rollingDate = addDays(plannedFinish, 1);
  });

  return generatedTasks;
}
