import { ConstructionActivity, PackageType } from '../types';

export interface ConstructionStageDef {
  id: number;
  name: string;
  category: 'Civil & Structure' | 'Services & M&E' | 'Finishes & Interiors' | 'Quality & Handover';
  description: string;
  defaultWeight: number;
}

export const CONSTRUCTION_STAGES: ConstructionStageDef[] = [
  { id: 1, name: 'Planning and approvals', category: 'Civil & Structure', description: 'Architectural drawings, structural engineering signs, municipal sanction, borewell & temporary power', defaultWeight: 5 },
  { id: 2, name: 'Foundation', category: 'Civil & Structure', description: 'Earth excavation, PCC bedding, steel rebar footings, column starter stub-ups, foundation concrete pour & curing', defaultWeight: 10 },
  { id: 3, name: 'Structural construction', category: 'Civil & Structure', description: 'RCC columns, beams, lintels, roof slab shuttering, steel reinforcement and high-grade concrete casting', defaultWeight: 15 },
  { id: 4, name: 'Brickwork and walls', category: 'Civil & Structure', description: 'Solid/AAC block masonry, internal partition walls, parapet wall construction, door/window frame fixing', defaultWeight: 10 },
  { id: 5, name: 'Plastering', category: 'Civil & Structure', description: 'Ceiling plaster, internal 2-coat river sand/gypsum plastering, external weather-proof cement plaster', defaultWeight: 8 },
  { id: 6, name: 'Electrical installation', category: 'Services & M&E', description: 'PVC conduit chasing, distribution board setting, fire-resistant copper wiring, earthing pit & switch boxes', defaultWeight: 7 },
  { id: 7, name: 'Plumbing', category: 'Services & M&E', description: 'CPVC concealed water supply lines, SWR drainage/waste pipes, overhead tank manifold, pressure testing', defaultWeight: 7 },
  { id: 8, name: 'Flooring', category: 'Finishes & Interiors', description: 'Subfloor screeding, vitrified/granite tile laying, bathroom anti-skid tiles, skirting, epoxy grouting', defaultWeight: 8 },
  { id: 9, name: 'Painting', category: 'Finishes & Interiors', description: 'Wall putty 2 coats, primer coat, premium washable acrylic interior emulsion, exterior weathercoat paint', defaultWeight: 6 },
  { id: 10, name: 'Doors and windows', category: 'Finishes & Interiors', description: 'Teak main entrance door, laminated flush internal doors, UPVC 3-track sliding windows with mosquito mesh', defaultWeight: 5 },
  { id: 11, name: 'Lighting and fixtures', category: 'Finishes & Interiors', description: 'Modular switches, LED panel lights, exhaust fans, CP bathroom fittings (taps, showers, health faucets)', defaultWeight: 5 },
  { id: 12, name: 'Interior installation', category: 'Finishes & Interiors', description: 'Granite kitchen counter slab, SS sink, modular wardrobe carcases, bathroom vanity, vanity mirrors', defaultWeight: 5 },
  { id: 13, name: 'Quality inspection', category: 'Quality & Handover', description: 'Comprehensive snagging inspection, plumb-line check, water leak testing, electrical earth continuity', defaultWeight: 4 },
  { id: 14, name: 'Defect correction', category: 'Quality & Handover', description: 'Rectification of snag list items, surface touch-ups, silicon sealing, deep debris cleaning', defaultWeight: 3 },
  { id: 15, name: 'Final handover', category: 'Quality & Handover', description: 'Owner walkthrough, key handover ceremony, warranties document packet, digital handover certificate', defaultWeight: 2 }
];

export const STANDARD_ACTIVITIES: ConstructionActivity[] = [
  {
    id: 'ACT-01',
    name: 'Statutory approvals & site layout marking',
    stageId: 1,
    stageName: 'Planning and approvals',
    description: 'Municipal sanctioned plan verification and grid line center marking on ground',
    defaultDurationDays: 14,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-02',
    name: 'Foundation excavation & PCC concrete',
    stageId: 2,
    stageName: 'Foundation',
    description: 'Soil trench excavation, anti-termite treatment, 100mm PCC base concrete layer',
    defaultDurationDays: 12,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-03',
    name: 'RCC Column footings & plinth beam',
    stageId: 2,
    stageName: 'Foundation',
    description: 'Reinforcement rebar tied, footing concrete cast, plinth beam RCC framework',
    defaultDurationDays: 16,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-04',
    name: 'RCC Columns and roof slab casting',
    stageId: 3,
    stageName: 'Structural construction',
    description: 'Vertical column shuttering, beam scaffolding, slab rebar mesh and M25 ready-mix concrete pouring',
    defaultDurationDays: 21,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-05',
    name: 'AAC / Red brick masonry walls',
    stageId: 4,
    stageName: 'Brickwork and walls',
    description: 'External 8-inch perimeter walls and internal 4-inch partition walls with cement mortar 1:6',
    defaultDurationDays: 18,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-06',
    name: 'Internal & external cement plastering',
    stageId: 5,
    stageName: 'Plastering',
    description: 'Smooth internal sponge plastering and 2-coat waterproof external sand-faced plastering',
    defaultDurationDays: 15,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-07',
    name: 'Electrical conduit pipes and wiring',
    stageId: 6,
    stageName: 'Electrical installation',
    description: 'Chasing walls, laying heavy gauge PVC conduits, metal back boxes, wiring pull-through',
    defaultDurationDays: 14,
    isMandatoryForPackageA: false, // EXCLUDED in Package A
    isMandatoryForPackageB: true,  // INCLUDED in Package B
    isMandatoryForPackageC: true   // INCLUDED in Package C
  },
  {
    id: 'ACT-08',
    name: 'Concealed plumbing and drainage lines',
    stageId: 7,
    stageName: 'Plumbing',
    description: 'CPVC hot and cold pipe routing in bathrooms & kitchen, PVC sewage and rainwater lines',
    defaultDurationDays: 12,
    isMandatoryForPackageA: false, // EXCLUDED in Package A
    isMandatoryForPackageB: true,  // INCLUDED in Package B
    isMandatoryForPackageC: true   // INCLUDED in Package C
  },
  {
    id: 'ACT-09',
    name: 'Vitrified floor tiling & wall dado',
    stageId: 8,
    stageName: 'Flooring',
    description: 'Double charged 4x2 ft vitrified tile flooring, toilet anti-skid floor and 7ft glazed wall dado',
    defaultDurationDays: 16,
    isMandatoryForPackageA: false,
    isMandatoryForPackageB: false, // EXCLUDED in Package B (left for customer)
    isMandatoryForPackageC: true   // INCLUDED in Package C
  },
  {
    id: 'ACT-10',
    name: 'Putty, primer and emulsion painting',
    stageId: 9,
    stageName: 'Painting',
    description: '2 coats acrylic putty, 1 coat sealer primer, 2 coats washable premium emulsion interior paint',
    defaultDurationDays: 14,
    isMandatoryForPackageA: false,
    isMandatoryForPackageB: false,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-11',
    name: 'Doors, teak main door & UPVC windows',
    stageId: 10,
    stageName: 'Doors and windows',
    description: 'Teak wood entrance door frame and shutter, flush internal doors, sliding UPVC glazed windows',
    defaultDurationDays: 10,
    isMandatoryForPackageA: false,
    isMandatoryForPackageB: false,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-12',
    name: 'Modular switches, lights & sanitary fixtures',
    stageId: 11,
    stageName: 'Lighting and fixtures',
    description: 'Schneider modular switches, LED ceiling lamps, Jaguar chrome CP bibcocks, wall-mount commodes',
    defaultDurationDays: 9,
    isMandatoryForPackageA: false,
    isMandatoryForPackageB: false,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-13',
    name: 'Kitchen granite counter & modular cabinets',
    stageId: 12,
    stageName: 'Interior installation',
    description: 'Black pearl granite kitchen platform with SS sink, modular soft-close tandem drawers',
    defaultDurationDays: 12,
    isMandatoryForPackageA: false,
    isMandatoryForPackageB: false,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-14',
    name: 'Comprehensive snagging & quality audit',
    stageId: 13,
    stageName: 'Quality inspection',
    description: 'Civil engineer and QA inspector audit: level check, pipe leak testing, electrical safety check',
    defaultDurationDays: 5,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-15',
    name: 'Snag rectification and deep site cleaning',
    stageId: 14,
    stageName: 'Defect correction',
    description: 'Addressing snag defects, touchup paint, cleaning mortar residue, polished handover readiness',
    defaultDurationDays: 6,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  },
  {
    id: 'ACT-16',
    name: 'Final handover & key delivery',
    stageId: 15,
    stageName: 'Final handover',
    description: 'Formal walkthrough with property buyer, warranty cards handover, digital possession certificate',
    defaultDurationDays: 2,
    isMandatoryForPackageA: true,
    isMandatoryForPackageB: true,
    isMandatoryForPackageC: true
  }
];

export const PACKAGE_DEFINITIONS: Record<PackageType, {
  name: PackageType;
  shortName: string;
  badgeColor: string;
  description: string;
  scopeSummary: string;
  targetTimelineWeeks: number;
  activityIds: string[];
}> = {
  'Package A: Structure Only': {
    name: 'Package A: Structure Only',
    shortName: 'Structure Only',
    badgeColor: 'border-slate-300 bg-slate-50 text-slate-800',
    description: 'Core civil foundation, RCC reinforced concrete framework, exterior/interior brick masonry walls, and specified 2-coat cement plastering.',
    scopeSummary: 'Foundation, Columns/Beams, Slab Casting, Masonry Walls, Cement Plastering. Excludes electrical, plumbing, tiles, paint, and joinery.',
    targetTimelineWeeks: 22,
    activityIds: ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-14', 'ACT-15', 'ACT-16']
  },
  'Package B: Semi-Finished': {
    name: 'Package B: Semi-Finished',
    shortName: 'Semi-Finished',
    badgeColor: 'border-sky-300 bg-sky-50 text-sky-800',
    description: 'Full structural framework, brickwork, plastering, plus concealed electrical conduits, copper wiring pull, and pressurized plumbing lines.',
    scopeSummary: 'Structure + Plastering + Electrical Conduit & Wiring + Concealed Plumbing & Drainage. Buyer handles custom flooring, painting, and fixtures.',
    targetTimelineWeeks: 30,
    activityIds: ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-14', 'ACT-15', 'ACT-16']
  },
  'Package C: Fully Finished': {
    name: 'Package C: Fully Finished',
    shortName: 'Fully Finished',
    badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    description: 'Turnkey move-in ready contract. Structural civil works, concealed utilities, vitrified tiles, emulsion painting, doors, windows, lighting, sanitary fixtures, and kitchen modular counter.',
    scopeSummary: 'Turnkey execution with premium tiles, Asian Paints emulsion, UPVC windows, Jaguar fittings, modular switches, and granite counter.',
    targetTimelineWeeks: 42,
    activityIds: ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09', 'ACT-10', 'ACT-11', 'ACT-12', 'ACT-13', 'ACT-14', 'ACT-15', 'ACT-16']
  },
  'Package D: Custom Package': {
    name: 'Package D: Custom Package',
    shortName: 'Custom Package',
    badgeColor: 'border-purple-300 bg-purple-50 text-purple-800',
    description: 'Bespoke itemized agreement tailored to customer specifications with itemized inclusion/exclusion toggles.',
    scopeSummary: 'Custom scope negotiated with Arthi construction engineers. Dynamically configured per unit.',
    targetTimelineWeeks: 36,
    activityIds: ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-06', 'ACT-07', 'ACT-08', 'ACT-09', 'ACT-14', 'ACT-15', 'ACT-16']
  }
};
