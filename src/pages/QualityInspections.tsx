import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { QualityInspection, InspectionChecklistItem } from '../types';
import { getScopedProperties, getScopedProjects } from '../services/permissions';
import { Modal } from '../components/common/Modal';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  ShieldCheck, 
  ArrowRight,
  Camera,
  Check,
  X,
  Minus
} from 'lucide-react';

interface QualityInspectionsProps {
  onNavigate: (view: string, id?: string) => void;
}

export const QualityInspections: React.FC<QualityInspectionsProps> = ({ onNavigate }) => {
  const { inspections, properties, projects, createInspection, updateInspectionItem, signOffInspection } = useData();
  const { canConductInspection, currentUser } = useAuth();

  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const filteredInspections = useMemo(() => {
    return inspections.filter(insp => scopedPropertyIds.has(insp.propertyId));
  }, [inspections, scopedPropertyIds]);

  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form
  const [formPropertyId, setFormPropertyId] = useState(scopedProperties[0]?.id || '');
  const [formType, setFormType] = useState<QualityInspection['inspectionType']>('Pre-Handover Snagging');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInspector, setFormInspector] = useState('Er. Rajesh Narayanan (QA Lead)');

  const handleOpenDetails = (insp: QualityInspection) => {
    setSelectedInspection(insp);
  };

  const handleItemStatusChange = (
    inspectionId: string, 
    itemId: string, 
    newStatus: 'Pass' | 'Fail' | 'Not Applicable',
    remarks?: string
  ) => {
    updateInspectionItem(inspectionId, itemId, { status: newStatus, remarks });
    // Update local modal state
    setSelectedInspection(prev => {
      if (!prev || prev.id !== inspectionId) return prev;
      return {
        ...prev,
        items: prev.items.map(it => it.id === itemId ? { ...it, status: newStatus } : it)
      };
    });
  };

  const handleScheduleInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === formPropertyId) || properties[0];

    // Determine package-specific checklist items
    let checklist: string[] = [];
    if (prop.packageType.includes('Package A')) {
      // Structure only checklist
      checklist = [
        'RCC Column vertical plumb & grid line orientation',
        'Ceiling and wall 2-coat plastering flatness & zero debonding',
        'Door and window opening aperture dimensions (+/- 5mm)',
        'Plumbing core-cut sleeve clearances and structural soundness',
        'Floor sub-base level and compaction check'
      ];
    } else if (prop.packageType.includes('Package B')) {
      // Semi-finished checklist
      checklist = [
        'Structural alignment and plastering check',
        'Concealed CPVC waterline hydrostatic pressure test (10 bar)',
        'Drainage slope and vertical stack leak testing',
        'Concealed electrical conduit continuity and box integrity',
        'Earthing pit earth resistance test (< 2.0 ohms)',
        'Window aperture sealing and waterproofing'
      ];
    } else {
      // Fully finished checklist
      checklist = [
        'Vitrified tile level, hollow tap test & epoxy grout seal',
        'Concealed plumbing hydrostatic pressure test (10 bar / 24h)',
        'Drainage flow and floor trap water seal check',
        'Electrical insulation resistance (> 50M ohms) and MCB trip test',
        'Teak main door lock latching & UPVC window sliding ease',
        'Interior emulsion paint sheen uniformity and zero touch-up flashing',
        'Sanitary Jaguar fixture chrome finish & water aerator operation',
        'Kitchen granite counter platform silicone sealing'
      ];
    }

    createInspection({
      propertyId: prop.id,
      unitNumber: prop.unitNumber,
      projectId: prop.projectId,
      inspectionType: formType,
      scheduledDate: formDate,
      inspectorName: formInspector,
      overallRemarks: `Audit tailored specifically for ${prop.packageType}.`
    }, checklist);

    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sky-600" />
            <span>Quality Inspections & Snagging Audits</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Package-specific quality checklists: Structure-Only civil integrity vs. Fully-Finished turnkey audits
          </p>
        </div>

        {canConductInspection && (
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Inspection</span>
          </button>
        )}
      </div>

      {/* Advisory Note */}
      <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-1 text-sky-950">
        <div className="font-bold flex items-center gap-2 text-sky-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Package-Specific Inspection Governance</span>
        </div>
        <p className="text-sky-900 text-[11px] leading-relaxed">
          Structure-only units receive structural integrity and plaster alignment audits; they are never subjected to or delayed by tile or paint checks. Turnkey units undergo multi-point snagging across all trades before handover clearance is unlocked.
        </p>
      </div>

      {/* Inspections List */}
      <div className="space-y-4">
        {filteredInspections.map(insp => {
          const passCount = insp.items.filter(i => i.status === 'Pass').length;
          const failCount = insp.items.filter(i => i.status === 'Fail').length;
          const pendingCount = insp.items.filter(i => i.status === 'Pending').length;

          return (
            <div
              key={insp.id}
              onClick={() => handleOpenDetails(insp)}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-800 rounded">
                      {insp.inspectionType}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {insp.unitNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {insp.overallRemarks}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    insp.status === 'Passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    insp.status === 'Failed with Defects' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {insp.status}
                  </span>
                </div>
              </div>

              {/* Checklist progress strip */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold">{passCount} Passed</span>
                  <span>·</span>
                  <span className={failCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                    {failCount} Defects
                  </span>
                  <span>·</span>
                  <span className="text-slate-500">{pendingCount} Unchecked</span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Auditor: {insp.inspectorName} · Date: {insp.scheduledDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspection Details & Checklist Execution Modal */}
      {selectedInspection && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInspection(null)}
          title={`Audit: ${selectedInspection.inspectionType}`}
          subtitle={`${selectedInspection.unitNumber} · Auditor: ${selectedInspection.inspectorName}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Inspection Checklist Items ({selectedInspection.items.length})</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                selectedInspection.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {selectedInspection.status}
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {selectedInspection.items.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(selectedInspection.id, item.id, 'Pass')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                        item.status === 'Pass'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Pass
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(selectedInspection.id, item.id, 'Fail', 'Defect identified during walkthrough.')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                        item.status === 'Fail'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> Fail
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(selectedInspection.id, item.id, 'Not Applicable')}
                      className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                        item.status === 'Not Applicable'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign Off */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                All mandatory items must Pass with zero open defects before signing off.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => signOffInspection(selectedInspection.id, currentUser.name, 'All checklist items verified. Quality standards certified.')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign Off & Approve Inspection</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Inspection Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Quality Audit"
        subtitle="Automatic package-specific checklist generation"
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleInspection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Property Unit *
            </label>
            <select
              value={formPropertyId}
              onChange={(e) => setFormPropertyId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {scopedProperties.map(p => (
                <option key={p.id} value={p.id}>{p.unitNumber} ({p.packageType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Type *
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Pre-Plastering">Pre-Plastering Structural & Plumb Audit</option>
              <option value="Electrical & Plumbing">Concealed Electrical & Plumbing Pressure Test</option>
              <option value="Pre-Flooring">Pre-Flooring Subfloor & Waterproofing Test</option>
              <option value="Pre-Handover Snagging">Pre-Handover Snagging & Multi-Point Audit</option>
              <option value="Final Clearance">Final Clearance & Handover Sign-off Audit</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Audit Date *
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Inspector Name
              </label>
              <input
                type="text"
                required
                value={formInspector}
                onChange={(e) => setFormInspector(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              Create Inspection & Checklist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
