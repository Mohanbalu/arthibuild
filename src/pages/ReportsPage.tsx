import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getScopedProperties, getScopedProjects } from '../services/permissions';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Users, Building2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { projects, properties, tasks, customizations } = useData();
  const { currentUser } = useAuth();

  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const scopedTasks = useMemo(() => {
    return tasks.filter(t => scopedPropertyIds.has(t.propertyId));
  }, [tasks, scopedPropertyIds]);

  const scopedCustomizations = useMemo(() => {
    return customizations.filter(c => scopedPropertyIds.has(c.propertyId));
  }, [customizations, scopedPropertyIds]);

  // Contractor performance metrics
  const contractorStats: Record<string, { total: number; completed: number; blocked: number }> = {};
  scopedTasks.forEach(t => {
    const contractor = t.assignedTo || 'Unassigned';
    if (!contractorStats[contractor]) {
      contractorStats[contractor] = { total: 0, completed: 0, blocked: 0 };
    }
    contractorStats[contractor].total += 1;
    if (t.status === 'Completed') contractorStats[contractor].completed += 1;
    if (t.status === 'Blocked') contractorStats[contractor].blocked += 1;
  });

  // Package distribution stats
  const packageStats = [
    { label: 'Package A: Structure Only', count: scopedProperties.filter(p => p.packageType.includes('Package A')).length, color: 'bg-slate-700' },
    { label: 'Package B: Semi-Finished', count: scopedProperties.filter(p => p.packageType.includes('Package B')).length, color: 'bg-sky-600' },
    { label: 'Package C: Fully Finished', count: scopedProperties.filter(p => p.packageType.includes('Package C')).length, color: 'bg-emerald-600' },
    { label: 'Package D: Custom Package', count: scopedProperties.filter(p => p.packageType.includes('Package D')).length, color: 'bg-purple-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-600" />
          <span>Construction Analytics & Portfolio Intelligence</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cumulative progress, contractor throughput, package distribution, and delivery risk metrics
        </p>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Progress</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {scopedProperties.length > 0 ? Math.round(scopedProperties.reduce((a, b) => a + b.overallProgress, 0) / scopedProperties.length) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across your {scopedProperties.length} assigned residential units</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestone Verification</div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {scopedTasks.filter(t => t.approvalStatus === 'Verified by PM').length} / {scopedTasks.filter(t => t.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Completed milestones signed by PM</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Customizations</div>
          <div className="text-2xl font-bold font-mono text-purple-900 mt-1">
            ₹{scopedCustomizations.filter(c => c.status === 'Approved').reduce((a, b) => a + b.estimatedCost, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Additional value added to contracts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Tasks</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {scopedTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{scopedTasks.filter(t => t.status === 'In Progress').length} in active execution</div>
        </div>
      </div>

      {/* Package Breakdown & Stage Progress Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Contract Package Breakdown</h2>
          <div className="space-y-3">
            {packageStats.map(pkg => {
              const pct = scopedProperties.length > 0 ? Math.round((pkg.count / scopedProperties.length) * 100) : 0;
              return (
                <div key={pkg.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{pkg.label}</span>
                    <span className="font-mono text-slate-900 font-bold">{pkg.count} units ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${pkg.color} h-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contractor Performance Audit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Contractor & Trade Performance</h2>
          <div className="divide-y divide-slate-100">
            {Object.entries(contractorStats).map(([name, stat]) => {
              const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
              return (
                <div key={name} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {stat.total} scheduled tasks · {stat.blocked > 0 ? <span className="text-rose-600 font-bold">{stat.blocked} blocked</span> : '0 impediments'}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-900">{rate}%</span>
                    <div className="text-[10px] text-slate-500">{stat.completed}/{stat.total} done</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
