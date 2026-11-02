import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  Milestone,
  MilestoneHistoryEntry,
  MilestoneStatus,
  Project,
  ProjectComputedMetrics,
  RiskItem,
} from '../types/portfolio';
import {
  calculateRiskScore,
  formatCurrency,
  getDaysOverdue,
  getRiskSeverity,
  isMilestoneOverdue,
} from '../utils/calculations';

interface ProjectInspectorModalProps {
  project: Project | null;
  metrics: ProjectComputedMetrics | null;
  milestones: Milestone[];
  milestoneHistory: MilestoneHistoryEntry[];
  risks: RiskItem[];
  referenceDate: string;
  onClose: () => void;
  onUpdateMilestoneStatus: (
    milestoneId: string,
    newStatus: MilestoneStatus,
    newPercent: number,
    note: string
  ) => void;
  onUpdateRiskMitigation: (
    riskId: string,
    mitigationProgress: number,
    status: RiskItem['status']
  ) => void;
  onNavigateModule: (module: 'milestones' | 'budget' | 'risks') => void;
}

export const ProjectInspectorModal: React.FC<ProjectInspectorModalProps> = ({
  project,
  metrics,
  milestones,
  milestoneHistory,
  risks,
  referenceDate,
  onClose,
  onUpdateMilestoneStatus,
  onUpdateRiskMitigation,
  onNavigateModule,
}) => {
  if (!project || !metrics) return null;

  const projectMilestones = milestones.filter((m) => m.projectId === project.id);
  const projectRisks = risks.filter((r) => r.projectId === project.id);
  const projectHistory = milestoneHistory.filter((h) => h.projectId === project.id);

  const healthColor =
    metrics.health === 'Red'
      ? 'text-[#DC2626]'
      : metrics.health === 'Amber'
      ? 'text-[#D97706]'
      : 'text-[#16A34A]';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end">
      <div className="bg-white w-full max-w-3xl h-full overflow-y-auto border-l border-slate-200 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="font-semibold text-slate-900">{project.code}</span>
                <span>·</span>
                <span>{project.department}</span>
                <span>·</span>
                <span>Owner: {project.owner} ({project.ownerRole})</span>
                <span>·</span>
                <span className={`font-semibold ${healthColor}`}>
                  Health: {metrics.health} ({project.status})
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1 font-display">
                {project.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close project inspector"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Synthetic Notice & Objective */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Strategic Objective & Scope</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Synthetic Demonstration Record · Timeline: {project.startDate} to {project.endDate}
                </span>
              </div>
              <p className="text-sm text-slate-800 font-medium">{project.strategicObjective}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>
              {metrics.healthReasons.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-700 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">Health Diagnostic Drivers:</span>
                  <span>{metrics.healthReasons.join(' · ')}</span>
                </div>
              )}
            </div>

            {/* Key Project Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-slate-200 rounded p-3.5 bg-white">
                <div className="text-xs text-slate-500">Allocated Budget</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatCurrency(project.allocatedBudget)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Approved baseline</div>
              </div>

              <div className="border border-slate-200 rounded p-3.5 bg-white">
                <div className="text-xs text-slate-500">Actual Expenditure</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatCurrency(project.actualSpend)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {metrics.utilizationPercent}% utilized
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3.5 bg-white">
                <div className="text-xs text-slate-500">Budget Variance</div>
                <div
                  className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                    metrics.isOverBudget ? 'text-[#DC2626]' : 'text-[#16A34A]'
                  }`}
                >
                  {formatCurrency(metrics.variance, true)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {metrics.isOverBudget ? 'Exceeds allocation' : 'Within allocation'}
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3.5 bg-white">
                <div className="text-xs text-slate-500">Completion Progress</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {project.progress}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {metrics.completedMilestones}/{metrics.totalMilestones} milestones done
                </div>
              </div>
            </div>

            {/* Milestones Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <span>Project Milestones ({projectMilestones.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateModule('milestones');
                  }}
                  className="text-xs font-medium text-[#1E3A8A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Milestone Tracker</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="border border-slate-200 rounded divide-y divide-slate-200">
                {projectMilestones.map((ms) => {
                  const overdue = isMilestoneOverdue(ms, referenceDate);
                  const daysLate = overdue ? getDaysOverdue(ms.plannedDate, referenceDate) : 0;
                  return (
                    <div key={ms.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="font-semibold text-slate-900">{ms.code}</span>
                          <span>·</span>
                          <span
                            className={
                              overdue
                                ? 'text-[#DC2626] font-semibold'
                                : ms.status === 'Completed'
                                ? 'text-[#16A34A] font-semibold'
                                : 'text-slate-600'
                            }
                          >
                            {overdue ? `Overdue (${daysLate}d past target)` : ms.status}
                          </span>
                          <span>·</span>
                          <span className="text-slate-500">Planned: {ms.plannedDate}</span>
                          {ms.actualDate && (
                            <>
                              <span>·</span>
                              <span className="text-slate-500">Actual: {ms.actualDate}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{ms.title}</div>
                        <div className="text-xs text-slate-600">{ms.deliverableNotes}</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-slate-900">{ms.completionPercent}%</div>
                          <div className="text-[11px] text-slate-500">Completion</div>
                        </div>
                        {ms.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMilestoneStatus(
                                ms.id,
                                'Completed',
                                100,
                                `Marked Completed via Project Inspector on ${referenceDate}.`
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-medium bg-[#1E3A8A] hover:bg-slate-800 text-white rounded transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Mark 100% Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Associated Risks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-700" />
                  <span>Linked Risk Register ({projectRisks.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateModule('risks');
                  }}
                  className="text-xs font-medium text-[#1E3A8A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Risk Register</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="border border-slate-200 rounded divide-y divide-slate-200">
                {projectRisks.map((r) => {
                  const score = calculateRiskScore(r.probability, r.impact);
                  const severity = getRiskSeverity(score);
                  return (
                    <div key={r.id} className="p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{r.code}</span>
                          <span>·</span>
                          <span>{r.category}</span>
                          <span>·</span>
                          <span
                            className={
                              severity === 'Critical'
                                ? 'text-[#DC2626] font-semibold'
                                : severity === 'High'
                                ? 'text-[#D97706] font-semibold'
                                : 'text-slate-700'
                            }
                          >
                            Score {score}/25 ({severity}: P{r.probability} × I{r.impact})
                          </span>
                        </div>
                        <span className="text-slate-600">
                          Status: {r.status} · Mitigation: {r.mitigationProgress}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">{r.description}</p>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Mitigation Plan: </span>
                        {r.mitigationPlan}
                      </p>

                      {r.status !== 'Resolved' && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateRiskMitigation(
                                r.id,
                                Math.min(100, r.mitigationProgress + 25),
                                r.mitigationProgress + 25 >= 100 ? 'Resolved' : 'Mitigating'
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                          >
                            Advance Mitigation (+25%)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateRiskMitigation(r.id, 100, 'Resolved')}
                            className="px-2.5 py-1 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition-colors cursor-pointer"
                          >
                            Resolve Risk (100%)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestone Progress History Log */}
            {projectHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>Recorded Progress History ({projectHistory.length})</span>
                </h3>
                <div className="border border-slate-200 rounded divide-y divide-slate-200 bg-slate-50/50">
                  {projectHistory.map((h) => (
                    <div key={h.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono text-slate-500">
                        <span>
                          {h.timestamp.slice(0, 10)} · {h.author}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {h.previousPercent}% ({h.previousStatus}) → {h.newPercent}% ({h.newStatus})
                        </span>
                      </div>
                      <p className="text-slate-700">{h.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DollarSign className="w-3.5 h-3.5" />
            <span>All figures dynamically linked to Executive Dashboard & Budget Monitor</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
