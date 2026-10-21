import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculatePropertyDeliveryForecast } from '../services/estimationEngine';
import { getScopedProperties, getScopedProjects } from '../services/permissions';
import { PackageBadge } from '../components/common/Badge';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  Calendar, 
  Sliders, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface DeliveryScheduleProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const DeliverySchedule: React.FC<DeliveryScheduleProps> = ({ 
  onNavigate, 
  onSelectProperty 
}) => {
  const { properties, projects, tasks, customizations, forecastLogs, recalculateAllForecasts } = useData();
  const { currentUser } = useAuth();

  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [isRecalculating, setIsRecalculating] = useState(false);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  // Calculate forecasts for scoped units
  const forecastList = useMemo(() => {
    return scopedProperties.map(property => {
      const propTasks = tasks.filter(t => t.propertyId === property.id);
      const forecast = calculatePropertyDeliveryForecast(property, propTasks, customizations);
      return {
        property,
        forecast
      };
    });
  }, [scopedProperties, tasks, customizations]);

  const filteredList = forecastList.filter(item => {
    if (filterRisk === 'all') return true;
    return item.forecast.riskLevel === filterRisk;
  });

  const handleRecalculate = () => {
    setIsRecalculating(true);
    recalculateAllForecasts();
    setTimeout(() => setIsRecalculating(false), 500);
  };

  const criticalDelayCount = forecastList.filter(f => f.forecast.riskLevel === 'Critical Delay').length;
  const onTrackCount = forecastList.filter(f => f.forecast.riskLevel === 'On Track').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Delivery Forecasting & Schedule Risk Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, rule-based completion estimates derived from critical path dependencies and approved customizations
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-amber-600' : ''}`} />
          <span>Recalculate Forecasts</span>
        </button>
      </div>

      {/* Advisory Banner */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-1">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <Info className="w-4 h-4" />
          <span>Rule-Based Forecasting Architecture</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Forecasts are calculated deterministically by evaluating:
          <strong> Remaining contractual tasks</strong> → <strong>Sequential stage dependencies (1 to 15)</strong> → <strong>Parallel intra-stage execution</strong> → <strong>Approved customization additions</strong> → <strong>Reported material impediments</strong>. A structure-only unit is never delayed by unrelated interior activities of other apartments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">On Schedule</div>
          <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">{onTrackCount} Units</div>
          <div className="text-[11px] text-slate-500 mt-1">Within agreed completion commitments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Schedule Variances</div>
          <div className="text-2xl font-bold font-mono text-rose-950 mt-1">{criticalDelayCount} Units</div>
          <div className="text-[11px] text-slate-500 mt-1">Impediment / approved customization impact</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Custom Scope Impact</div>
          <div className="text-2xl font-bold font-mono text-purple-950 mt-1">
            {customizations.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.scheduleImpactDays, 0)} Days
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Contractually approved extension days</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <span className="text-xs font-medium text-slate-500 mr-2">Filter by Risk:</span>
        {['all', 'On Track', 'Low Risk', 'Moderate Delay', 'Critical Delay'].map(level => (
          <button
            key={level}
            onClick={() => setFilterRisk(level)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterRisk === level
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {level === 'all' ? 'All Units' : level}
          </button>
        ))}
      </div>

      {/* Forecast Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Property Unit</th>
                <th className="px-5 py-3.5 font-semibold">Package Scope</th>
                <th className="px-5 py-3.5 font-semibold">Committed Date</th>
                <th className="px-5 py-3.5 font-semibold">Estimated Date</th>
                <th className="px-5 py-3.5 font-semibold">Variance</th>
                <th className="px-5 py-3.5 font-semibold">Risk Level</th>
                <th className="px-5 py-3.5 font-semibold">Primary Factor / Reason</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(({ property, forecast }) => (
                <tr
                  key={property.id}
                  onClick={() => {
                    onSelectProperty(property.id);
                    onNavigate('property-detail', property.id);
                  }}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{property.unitNumber}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{property.projectName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <PackageBadge packageType={property.packageType} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {forecast.originalDeliveryDate}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {forecast.currentEstimatedDate}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    {forecast.varianceFromCommittedDays > 0 ? (
                      <span className="text-rose-600 font-bold">+{forecast.varianceFromCommittedDays}d</span>
                    ) : (
                      <span className="text-emerald-700">0d</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${forecast.riskBadgeClass}`}>
                      {forecast.riskLevel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                    {forecast.primaryDelayReason}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Change History Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Forecast Change History & Audit Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent record of contractual delivery adjustments and trigger events
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {forecastLogs.map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{log.triggerEvent}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                    {log.propertyId}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {log.reason}
                </p>
              </div>

              <div className="text-right sm:text-right shrink-0 font-mono text-xs">
                <div className="text-slate-500">
                  {log.previousEstimatedDate} → <strong className="text-slate-900">{log.newEstimatedDate}</strong>
                </div>
                <div className={`text-[11px] font-semibold ${log.varianceDays > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {log.varianceDays > 0 ? `+${log.varianceDays} days adjustment` : 'Original baseline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
