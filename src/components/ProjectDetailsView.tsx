import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ListTodo,
  Users,
} from 'lucide-react';
import {
  ActiveModuleId,
  DashboardKPIs,
  MilestoneStatus,
  PortfolioState,
  Project,
  RiskStatus,
  TaskStatus,
} from '../types/portfolio';
import {
  calculateRiskScore,
  formatCurrency,
  isMilestoneOverdue,
  isTaskOverdue,
} from '../utils/calculations';

interface ProjectDetailsViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  selectedProjectId: string;
  onSelectProjectId: (id: string) => void;
  onBackToPortfolio: () => void;
  onUpdateMilestoneStatus: (
    milestoneId: string,
    newStatus: MilestoneStatus,
    newPercent: number,
    note: string
  ) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateRiskMitigation: (riskId: string, progress: number, status: RiskStatus) => void;
  onUpdateProjectBudget: (projectId: string, allocated: number, actual: number) => void;
  onNavigateModule: (mod: ActiveModuleId) => void;
}

type ProjectTabId =
  | 'overview'
  | 'tasks'
  | 'milestones'
  | 'timeline'
  | 'risks'
  | 'budget'
  | 'team'
  | 'activity';

export const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({
  state,
  kpis,
  selectedProjectId,
  onSelectProjectId,
  onBackToPortfolio,
  onUpdateMilestoneStatus,
  onUpdateTaskStatus,
  onUpdateRiskMitigation,
  onUpdateProjectBudget,
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectTabId>('overview');

  const project: Project = useMemo(() => {
    return (
      state.projects.find((p) => p.id === selectedProjectId) ||
      state.projects[1] ||
      state.projects[0]
    );
  }, [state.projects, selectedProjectId]);

  const metrics = kpis.projectMetricsMap[project.id];

  const projectTasks = useMemo(
    () => (state.tasks || []).filter((t) => t.projectId === project.id),
    [state.tasks, project.id]
  );

  const projectMilestones = useMemo(
    () => state.milestones.filter((m) => m.projectId === project.id),
    [state.milestones, project.id]
  );

  const projectRisks = useMemo(
    () => state.risks.filter((r) => r.projectId === project.id),
    [state.risks, project.id]
  );

  const projectIssues = useMemo(
    () => (state.issues || []).filter((i) => i.projectId === project.id),
    [state.issues, project.id]
  );

  const projectTeam = useMemo(() => {
    const ids = new Set(project.teamMemberIds || []);
    return kpis.teamWorkloads.filter(
      (tm) => ids.has(tm.id) || tm.name === project.owner
    );
  }, [kpis.teamWorkloads, project]);

  const projectActivity = useMemo(() => {
    const acts = (state.activityLog || []).filter((a) => a.projectId === project.id);
    const msHist = state.milestoneHistory
      .filter((h) => h.projectId === project.id)
      .map((h) => ({
        id: h.id,
        userName: h.author,
        userRole: 'Project Lead',
        action: 'Updated' as const,
        entityType: 'Milestone' as const,
        entityCode: h.milestoneId.toUpperCase(),
        projectId: h.projectId,
        timestamp: h.timestamp,
        description: `${h.note} (${h.previousPercent}% → ${h.newPercent}%)`,
      }));
    return [...acts, ...msHist].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.activityLog, state.milestoneHistory, project.id]);

  const [editAlloc, setEditAlloc] = useState(project.allocatedBudget);
  const [editActual, setEditActual] = useState(project.actualSpend);

  React.useEffect(() => {
    setEditAlloc(project.allocatedBudget);
    setEditActual(project.actualSpend);
  }, [project.id, project.allocatedBudget, project.actualSpend]);

  const tabs: { id: ProjectTabId; label: string; count?: number }[] = [
    { id: 'overview', label: '1. Overview' },
    { id: 'tasks', label: '2. Tasks', count: projectTasks.length },
    { id: 'milestones', label: '3. Milestones', count: projectMilestones.length },
    { id: 'timeline', label: '4. Timeline' },
    { id: 'risks', label: '5. Risks & Issues', count: projectRisks.length + projectIssues.length },
    { id: 'budget', label: '6. Budget' },
    { id: 'team', label: '7. Team', count: projectTeam.length },
    { id: 'activity', label: '8. Activity', count: projectActivity.length },
  ];

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Project Selector */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToPortfolio}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Portfolio</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Switch Engagement:</span>
            <select
              value={project.id}
              onChange={(e) => onSelectProjectId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded bg-slate-50 font-semibold text-slate-900 cursor-pointer"
            >
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-3 border-t border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#D04A02]">
                {project.code}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800">
                {project.department}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                  metrics.health === 'Red'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : metrics.health === 'Amber'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {metrics.health} Health · {project.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-800">
                Priority: {project.priority || 'High'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1.5">{project.name}</h1>
            <p className="text-xs text-slate-600 mt-1">
              Engagement Lead: <strong className="text-slate-900">{project.owner}</strong> ({project.ownerRole}) · Horizon:{' '}
              <span className="font-mono">
                {project.startDate} → {project.endDate}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-500">Completion</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {project.progress}%
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-500">Utilization</div>
              <div
                className={`text-lg font-bold font-mono mt-0.5 ${
                  metrics.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {metrics.utilizationPercent}%
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
              <div className="text-[10px] font-mono uppercase text-slate-500">Max Risk</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {metrics.maxRiskScore}/25
              </div>
            </div>
          </div>
        </div>

        {/* 8-Tab Navigation Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-[#FDBA74]'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Engagement Scope & Strategic Charter
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{project.description}</p>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-mono uppercase font-bold text-[#1E3A8A]">
                Strategic Business Objective
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-1">
                {project.strategicObjective}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 border border-slate-200 rounded">
                <div className="text-[11px] text-slate-500">Milestones</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  {metrics.completedMilestones}/{metrics.totalMilestones}
                </div>
                <div className="text-[10px] font-mono text-red-600">
                  {metrics.overdueMilestones} overdue
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <div className="text-[11px] text-slate-500">Deliverable Tasks</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  {metrics.completedTasks}/{metrics.totalTasks}
                </div>
                <div className="text-[10px] font-mono text-red-600">
                  {metrics.blockedTasks} blocked
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <div className="text-[11px] text-slate-500">Open Risks</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  {metrics.openRisksCount}
                </div>
                <div className="text-[10px] font-mono text-red-600">
                  {metrics.criticalRisksCount} critical
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <div className="text-[11px] text-slate-500">Open Issues</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  {metrics.openIssuesCount}
                </div>
                <div className="text-[10px] font-mono text-slate-500">Active trackers</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Governance Health Diagnostic
            </h2>
            <div className="space-y-2">
              {metrics.healthReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D04A02] shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Budget:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(project.allocatedBudget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Spend:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(project.actualSpend)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(metrics.remainingBudget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Variance:</span>
                <span
                  className={`font-bold ${
                    metrics.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(metrics.variance, true)} ({metrics.utilizationPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Project Tasks & Deliverables ({projectTasks.length})
              </h2>
              <p className="text-xs text-slate-500">
                Update task statuses directly or open the full Tasks & Deliverables workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateModule('tasks')}
              className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
            >
              Open Full Task Board →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Title & Description</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Effort (Act/Est)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projectTasks.map((t) => {
                  const overdue = isTaskOverdue(t, state.referenceDate);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {t.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-500">{t.description}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {t.assigneeName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{t.priority}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span className={overdue ? 'text-red-700 font-bold' : 'text-slate-800'}>
                          {t.dueDate}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {t.actualHours}h / {t.estimatedHours}h
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            onUpdateTaskStatus(t.id, e.target.value as TaskStatus)
                          }
                          className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold bg-white cursor-pointer"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Project Milestones ({projectMilestones.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigateModule('milestones')}
              className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
            >
              Manage All Milestones →
            </button>
          </div>

          <div className="space-y-3">
            {projectMilestones.map((ms) => {
              const overdue = isMilestoneOverdue(ms, state.referenceDate);
              return (
                <div
                  key={ms.id}
                  className="p-4 border border-slate-200 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ms.code}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{ms.title}</span>
                      {overdue && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-100 text-red-800 rounded">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{ms.deliverableNotes}</p>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Owner: {ms.owner} · Planned: {ms.plannedDate} · Actual:{' '}
                      {ms.actualDate || 'Pending'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {ms.completionPercent}%
                    </span>
                    {ms.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMilestoneStatus(
                            ms.id,
                            'Completed',
                            100,
                            `Completed milestone ${ms.code} from Project Details workspace.`
                          )
                        }
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
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
      )}

      {/* TAB 4: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Project Schedule & Milestone Sequence
            </h2>
            <button
              type="button"
              onClick={() => onNavigateModule('gantt')}
              className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
            >
              Open Full Interactive Gantt →
            </button>
          </div>

          <div className="space-y-3">
            {projectMilestones.map((ms) => (
              <div
                key={ms.id}
                className="p-3 border border-slate-200 rounded flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900">{ms.code}</span> —{' '}
                  <span className="font-semibold text-slate-800">{ms.title}</span>
                </div>
                <div className="font-mono text-slate-600">
                  Planned: <strong>{ms.plannedDate}</strong> · {ms.completionPercent}% ({ms.status})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RISKS & ISSUES */}
      {activeTab === 'risks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Project Risks ({projectRisks.length})
            </h2>
            {projectRisks.map((r) => {
              const score = calculateRiskScore(r.probability, r.impact);
              return (
                <div key={r.id} className="p-3.5 border border-slate-200 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {r.code} ({r.category})
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      Score {score}/25
                    </span>
                  </div>
                  <p className="text-xs text-slate-800">{r.description}</p>
                  <div className="text-[11px] text-slate-600">
                    Mitigation ({r.mitigationProgress}%): {r.mitigationPlan}
                  </div>
                  {r.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRiskMitigation(
                          r.id,
                          Math.min(100, r.mitigationProgress + 20),
                          r.mitigationProgress + 20 >= 100 ? 'Resolved' : 'Mitigating'
                        )
                      }
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                    >
                      Advance Mitigation (+20%)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Project Issues & Blockers ({projectIssues.length})
            </h2>
            {projectIssues.length === 0 ? (
              <p className="text-xs text-slate-500">No active issues logged for this project.</p>
            ) : (
              projectIssues.map((iss) => (
                <div key={iss.id} className="p-3.5 border border-slate-200 rounded space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {iss.code} · {iss.priority}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-red-700">
                      {iss.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{iss.title}</div>
                  <p className="text-xs text-slate-600">{iss.description}</p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Owner: {iss.owner} · Target: {iss.targetResolutionDate}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BUDGET */}
      {activeTab === 'budget' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Project Budget & Expenditure Control
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-200 rounded">
              <div className="text-xs text-slate-500">Approved Budget</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(project.allocatedBudget)}
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded">
              <div className="text-xs text-slate-500">Actual Spend</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(project.actualSpend)}
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded">
              <div className="text-xs text-slate-500">Remaining Budget</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(metrics.remainingBudget)}
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded">
              <div className="text-xs text-slate-500">Budget Variance</div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  metrics.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(metrics.variance, true)} ({metrics.utilizationPercent}%)
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-end gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Update Approved Budget ($)
              </label>
              <input
                type="number"
                step={25000}
                value={editAlloc}
                onChange={(e) => setEditAlloc(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Update Actual Spend ($)
              </label>
              <input
                type="number"
                step={25000}
                value={editActual}
                onChange={(e) => setEditActual(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => onUpdateProjectBudget(project.id, editAlloc, editActual)}
              className="px-4 py-2 rounded bg-[#D04A02] hover:bg-[#b53f02] text-white font-semibold cursor-pointer"
            >
              Recalculate & Save Budget
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: TEAM */}
      {activeTab === 'team' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Assigned Advisory Team & Capacity ({projectTeam.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectTeam.map((tm) => (
              <div key={tm.id} className="p-4 border border-slate-200 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900">{tm.name}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                    {tm.appRole}
                  </span>
                </div>
                <div className="text-xs text-slate-600">{tm.designation}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  Location: {tm.location} · Utilization: <strong>{tm.utilizationPercent}%</strong> ({tm.allocatedWeeklyHours}h/{tm.weeklyCapacityHours}h)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Project Chronological Audit Trail ({projectActivity.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {projectActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{act.userName}</span>{' '}
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px]">
                    {act.action} {act.entityType}
                  </span>
                  <p className="text-slate-700 mt-1">{act.description}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {act.timestamp.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
