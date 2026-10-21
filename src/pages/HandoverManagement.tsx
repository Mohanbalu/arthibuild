import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { HandoverRecord } from '../types';
import { getScopedProperties, getScopedProjects } from '../services/permissions';
import { Modal } from '../components/common/Modal';
import { PackageBadge } from '../components/common/Badge';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  Download, 
  User, 
  Key, 
  Home, 
  Sparkles,
  Check
} from 'lucide-react';

interface HandoverManagementProps {
  onNavigate: (view: string, id?: string) => void;
}

export const HandoverManagement: React.FC<HandoverManagementProps> = ({ onNavigate }) => {
  const { handovers, properties, projects, executeHandover, createHandoverRecord } = useData();
  const { canSignHandover, currentUser } = useAuth();

  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => scopedPropertyIds.has(h.propertyId));
  }, [handovers, scopedPropertyIds]);

  const [selectedRecord, setSelectedRecord] = useState<HandoverRecord | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [customerSignName, setCustomerSignName] = useState('');
  const [repSignName, setRepSignName] = useState(currentUser.name);

  // Filter properties ready for handover within user's scope but don't have a record yet
  const readyProperties = scopedProperties.filter(p => 
    p.status === 'Ready for Handover' && !handovers.some(h => h.propertyId === p.id)
  );

  const handleOpenSignModal = (record: HandoverRecord) => {
    setSelectedRecord(record);
    setCustomerSignName(record.customerName);
    setRepSignName(currentUser.name);
    setIsSignModalOpen(true);
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    executeHandover(selectedRecord.id, customerSignName, repSignName);

    // Fire celebration confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsSignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Possession Clearance & Handover Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clearance verification: 100% contractual tasks completed, mandatory audits passed, and possession certificate signing
          </p>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 text-emerald-950">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Zero-Defect Handover Clearance:</strong> Units are unlocked for legal possession strictly when all tasks within their contracted scope are finished, applicable quality audits are signed, and customer snag items are rectified.
        </span>
      </div>

      {/* Units Newly Ready for Handover Clearance Initiation */}
      {readyProperties.length > 0 && (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
          <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-700" />
            <span>{readyProperties.length} Units Reached 100% Completion & Ready for Clearance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readyProperties.map(p => (
              <div key={p.id} className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{p.unitNumber}</div>
                  <div className="text-[11px] text-slate-500">{p.customerName} · {p.packageType}</div>
                </div>
                <button
                  onClick={() => createHandoverRecord(p.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Initiate Handover File
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handover Records Grid */}
      <div className="space-y-4">
        {filteredHandovers.map(rec => {
          const isDone = rec.status === 'Handed Over';

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {rec.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {rec.unitNumber}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    Customer: <strong className="text-slate-900">{rec.customerName}</strong> ({rec.customerEmail})
                  </p>

                  <div className="mt-2">
                    <PackageBadge packageType={rec.packageType} />
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>

              {/* Clearance Checkpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Contractual Tasks: 100%</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>QA Audit: Passed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Zero Snagging Defects</span>
                </div>
              </div>

              {rec.clearanceNotes && (
                <p className="text-xs text-slate-600">
                  <strong>Clearance Audit Notes:</strong> {rec.clearanceNotes}
                </p>
              )}

              {/* Possession certificate details if handed over */}
              {isDone && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-950 font-mono">
                  <div>
                    <span className="text-slate-500">Possession Certificate: </span>
                    <strong className="text-emerald-900">{rec.handoverCertificateId}</strong>
                    <span className="text-slate-400 ml-2">({rec.handoverDate})</span>
                  </div>
                  <div>
                    Signed by: <strong>{rec.signedByCustomer}</strong> & <strong>{rec.signedByRepresentative}</strong>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Ready since {rec.readyDate}
                </span>

                <div className="flex items-center gap-2">
                  {!isDone && canSignHandover && (
                    <button
                      onClick={() => handleOpenSignModal(rec)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Execute Possession Ceremony & Certificate</span>
                    </button>
                  )}

                  {isDone && (
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Possession Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Handover Signing Modal */}
      {selectedRecord && (
        <Modal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          title="Possession Ceremony & Handover Signing"
          subtitle={`${selectedRecord.unitNumber} · ${selectedRecord.customerName}`}
          maxWidth="lg"
        >
          <form onSubmit={handleExecute} className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Handover Clearance Satisfied</span>
              </div>
              <p className="leading-relaxed">
                Unit <strong>{selectedRecord.unitNumber}</strong> has fulfilled all contractual obligations under {selectedRecord.packageType}. Signing will generate Possession Certificate and update ownership status.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Signature Acceptance Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerSignName}
                  onChange={(e) => setCustomerSignName(e.target.value)}
                  placeholder="Full legal name of customer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arthi Construction Authorized Signatory *
                </label>
                <input
                  type="text"
                  required
                  value={repSignName}
                  onChange={(e) => setRepSignName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Issue Possession Certificate 🎉</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
