import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CustomizationRequest, CustomizationCategory, CustomizationStatus } from '../types';
import { getScopedProperties, getScopedProjects, getScopedCustomizations } from '../services/permissions';
import { Modal } from '../components/common/Modal';
import { CustomizationStatusBadge } from '../components/common/Badge';
import { 
  Sliders, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  DollarSign, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';

interface CustomizationRequestsProps {
  onNavigate: (view: string, id?: string) => void;
}

export const CustomizationRequests: React.FC<CustomizationRequestsProps> = ({ onNavigate }) => {
  const { customizations, properties, projects, submitCustomization, reviewCustomization, customerDecisionCustomization } = useData();
  const { canSubmitCustomization, canReviewCustomization, isCustomer, currentUser } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scoped properties and projects for current user role
  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<CustomizationRequest | null>(null);

  // Customer Decision Confirmation Modals
  const [confirmingApprovalReq, setConfirmingApprovalReq] = useState<CustomizationRequest | null>(null);
  const [confirmingDeclineReq, setConfirmingDeclineReq] = useState<CustomizationRequest | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New Request Form
  const [formPropertyId, setFormPropertyId] = useState(
    isCustomer && currentUser.assignedPropertyId ? currentUser.assignedPropertyId : (scopedProperties[0]?.id || '')
  );
  const [formCategory, setFormCategory] = useState<CustomizationCategory>('Flooring');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Review Form
  const [reviewCost, setReviewCost] = useState<number>(25000);
  const [reviewDays, setReviewDays] = useState<number>(4);
  const [reviewRemarks, setReviewRemarks] = useState('');

  const categories: CustomizationCategory[] = [
    'Flooring', 'Painting', 'Lighting', 'Electrical Points', 'Kitchen', 'Bathroom Fixtures', 'Interior Design', 'Other'
  ];

  // Strictly filter requests scoped by user's authorized role and property ownership (Requirement 1 & 4)
  const scopedRequests = useMemo(() => {
    return getScopedCustomizations(currentUser, customizations, properties, projects);
  }, [currentUser, customizations, properties, projects]);

  const filteredRequests = scopedRequests.filter(req => {
    const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || req.category === selectedCategory;
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleOpenReview = (req: CustomizationRequest) => {
    setReviewingRequest(req);
    setReviewCost(req.estimatedCost || 25000);
    setReviewDays(req.scheduleImpactDays || 4);
    setReviewRemarks(req.managerRemarks || '');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    reviewCustomization(
      reviewingRequest.id,
      reviewCost,
      reviewDays,
      reviewRemarks || 'Proposal generated and ready for customer review.',
      currentUser.name
    );

    setReviewingRequest(null);
  };

  const handleExecuteDecision = (reqId: string, decision: 'Approved' | 'Rejected', remarks?: string) => {
    setIsActionProcessing(true);
    setActionError(null);

    const result = customerDecisionCustomization(reqId, decision, remarks, currentUser);
    setIsActionProcessing(false);

    if (result && !result.success) {
      setActionError(result.error || 'Failed to process request.');
      return;
    }

    setConfirmingApprovalReq(null);
    setConfirmingDeclineReq(null);
    setDeclineRemarks('');
    setActionSuccessMessage(
      decision === 'Approved'
        ? `Customization request ${reqId} approved! Delivery schedule and tasks have been updated.`
        : `Customization request ${reqId} declined. Marked as rejected without schedule impact.`
    );

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 5000);
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    const prop = properties.find(p => p.id === formPropertyId) || properties[0];

    submitCustomization({
      propertyId: prop.id,
      unitNumber: prop.unitNumber,
      projectId: prop.projectId,
      customerId: prop.customerId,
      customerName: isCustomer ? currentUser.name : prop.customerName,
      category: formCategory,
      title: formTitle,
      description: formDescription,
      estimatedCost: 0,
      scheduleImpactDays: 0
    });

    setIsSubmitModalOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <span>Customization Requests & Schedule Impact</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured workflow: Submission → PM Technical & Cost Review → Customer Approval → Automated Schedule Update
          </p>
        </div>

        {canSubmitCustomization && (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Customization Request</span>
          </button>
        )}
      </div>

      {/* Workflow Explanation Banner */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1 text-purple-900">
        <div className="font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Strict Approval Contract Governance</span>
        </div>
        <p className="text-[11px] text-purple-800 leading-relaxed">
          Submitting a customization request does <em>not</em> modify contractual delivery or scope immediately. The Project Manager must first formulate the quotation and schedule impact. Only upon customer authorization is the new timeline appended to the delivery forecast engine.
        </p>
      </div>

      {/* Action Notifications */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request title, unit, or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Awaiting Customer Approval">Awaiting Customer Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Request Cards Grid */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No customization requests matching criteria.
          </div>
        ) : (
          filteredRequests.map(req => {
            const isAwaitingBuyer = req.status === 'Awaiting Customer Approval';
            const isPendingManager = req.status === 'Submitted' || req.status === 'Under Review';

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {req.category}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {req.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {req.unitNumber}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      {req.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Buyer: {req.customerName}</span>
                      <span>·</span>
                      <span>Requested: {req.requestDate}</span>
                      {req.reviewedBy && (
                        <>
                          <span>·</span>
                          <span>Reviewed by: {req.reviewedBy}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <CustomizationStatusBadge status={req.status} />
                  </div>
                </div>

                {/* Manager Remarks & Financial/Schedule Breakdown */}
                {(req.estimatedCost > 0 || req.managerRemarks) && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-4 font-mono">
                        <span>
                          Estimated Cost: <strong className="text-slate-900">₹{req.estimatedCost.toLocaleString()}</strong>
                        </span>
                        <span>
                          Schedule Impact: <strong className="text-rose-600">+{req.scheduleImpactDays} days</strong>
                        </span>
                      </div>

                      {req.appliedToSchedule && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Delivery forecast updated (+{req.scheduleImpactDays}d)
                        </span>
                      )}
                    </div>

                    {req.managerRemarks && (
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <strong>Project Lead Remarks:</strong> {req.managerRemarks}
                      </p>
                    )}

                    {req.customerRemarks && (
                      <p className="text-slate-600 text-[11px] leading-relaxed bg-white p-2 rounded border border-slate-200">
                        <strong>Customer Response:</strong> {req.customerRemarks}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons based on User Role & Status */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {req.status === 'Approved' ? '✓ Scope approved and scheduled in task tracker' : 'Workflow in progress'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* PM Action: Review proposal & enter cost/delay */}
                    {isPendingManager && canReviewCustomization && (
                      <button
                        onClick={() => handleOpenReview(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      >
                        Formulate Quotation & Schedule
                      </button>
                    )}

                    {/* Customer Action (or testing as PM/Admin): Approve or Reject proposal */}
                    {isAwaitingBuyer && (() => {
                      const canDecideThis = 
                        (!isCustomer && (currentUser.role === 'admin' || currentUser.role === 'project_manager')) ||
                        (isCustomer && (req.customerId === currentUser.id || req.propertyId === currentUser.assignedPropertyId));

                      return canDecideThis ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirmingApprovalReq(req)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve (+{req.scheduleImpactDays}d)</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingDeclineReq(req);
                              setDeclineRemarks('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          Awaiting authorization ({req.customerName})
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal for PM */}
      {reviewingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setReviewingRequest(null)}
          title={`Review Customization: ${reviewingRequest.title}`}
          subtitle={`${reviewingRequest.unitNumber} (${reviewingRequest.category})`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveReview} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <strong>Buyer Request:</strong> {reviewingRequest.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Additional Cost (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={reviewCost}
                  onChange={(e) => setReviewCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Impact (Extra Days Added) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="60"
                  value={reviewDays}
                  onChange={(e) => setReviewDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-rose-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engineering Remarks & Scope Notes *
              </label>
              <textarea
                rows={3}
                required
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Explain procurement timeline, structural feasibility, and labor specifications..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
              >
                Send Proposal to Customer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit New Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Customization Request"
        subtitle="Request interior finishes, fixture upgrades, or architectural alterations"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitNewRequest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Unit *
              </label>
              <select
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {scopedProperties.map(p => (
                  <option key={p.id} value={p.id}>{p.unitNumber} ({p.projectName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customization Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CustomizationCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Request Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Upgrade living hall flooring to Italian Botticino marble"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Requirements & Specifications *
            </label>
            <textarea
              rows={3}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Specify preferred brand, room locations, or dimension alterations..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              Submit for Manager Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Approval Confirmation Modal */}
      {confirmingApprovalReq && (
        <Modal
          isOpen={true}
          onClose={() => !isActionProcessing && setConfirmingApprovalReq(null)}
          title="Confirm Customization Approval"
          subtitle={`Request #${confirmingApprovalReq.id} - ${confirmingApprovalReq.unitNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Binding Schedule & Cost Revision Notice</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Approving this proposal will officially authorize the work, add the quoted cost to this unit's ledger, and extend the delivery forecast by <strong>+{confirmingApprovalReq.scheduleImpactDays} days</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Proposal Title:</span>
                <span className="font-semibold text-slate-900 text-right">{confirmingApprovalReq.title}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Target Property Unit:</span>
                <span className="font-mono font-semibold text-slate-800">{confirmingApprovalReq.unitNumber}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Quoted Additional Cost:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  ₹{confirmingApprovalReq.estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Schedule Impact:</span>
                <span className="font-bold text-rose-600 font-mono">
                  +{confirmingApprovalReq.scheduleImpactDays} days
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                <em>Note: This schedule adjustment applies strictly to <strong>{confirmingApprovalReq.unitNumber}</strong> and will not affect any other units or customers in the project.</em>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={() => setConfirmingApprovalReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={() => handleExecuteDecision(confirmingApprovalReq.id, 'Approved', 'Approved by customer with confirmed timeline and cost revision.')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isActionProcessing ? 'Updating...' : 'Authorize & Update Schedule'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Decline Confirmation Modal */}
      {confirmingDeclineReq && (
        <Modal
          isOpen={true}
          onClose={() => !isActionProcessing && setConfirmingDeclineReq(null)}
          title="Decline Customization Proposal"
          subtitle={`Request #${confirmingDeclineReq.id} - ${confirmingDeclineReq.unitNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-semibold">Are you sure you want to decline this proposal?</p>
              <p className="text-[11px] text-rose-700">
                This proposal will be marked as rejected. No costs will be charged and the delivery schedule will remain unchanged.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason or Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={declineRemarks}
                onChange={(e) => setDeclineRemarks(e.target.value)}
                placeholder="e.g. Quoted cost exceeds budget or timeline impact is too long..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={() => setConfirmingDeclineReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={isActionProcessing}
                onClick={() => handleExecuteDecision(confirmingDeclineReq.id, 'Rejected', declineRemarks || 'Declined by customer.')}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isActionProcessing ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
