import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ActiveModuleId,
  DashboardKPIs,
  Department,
  HealthStatus,
  PortfolioState,
  Project,
} from '../types/portfolio';
import {
  calculateRiskScore,
  DEPARTMENTS,
  formatCurrency,
  getDaysOverdue,
  isMilestoneOverdue,
} from '../utils/calculations';

interface ExecutiveDashboardProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  guidedStepNumber: number | null;
  onInspectProject: (project: Project) => void;
  onOpenProjectDetails?: (project: Project) => void;
  onNavigateWithFilter: (
    module: ActiveModuleId,
    filterOptions?: { department?: Department | 'All'; status?: string; health?: HealthStatus | 'All' }
  ) => void;
  onOpenAIChat: () => void;
  onQuickResolveOverdueDemo: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  state,
  kpis,
  guidedStepNumber,
  onInspectProject,
  onOpenProjectDetails,
  onNavigateWithFilter,
  onOpenAIChat,
  onQuickResolveOverdueDemo,
}) => {
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [dateWindow, setDateWindow] = useState<'All' | 'Q3-Q4 2026' | 'Next 30 Days'>('All');

  const filteredProjects = useMemo(() => {
    return state.projects.filter((p) => {
      if (selectedDept !== 'All' && p.department !== selectedDept) return false;
      if (dateWindow === 'Next 30 Days') {
        return p.endDate >= state.referenceDate && p.endDate <= '2026-12-05';
      }
      return true;
    });
  }, [state.projects, selectedDept, dateWindow, state.referenceDate]);

  const filteredProjectIds = useMemo(
    () => new Set(filteredProjects.map((p) => p.id)),
    [filteredProjects]
  );

  // Attention projects (Delayed, At Risk, Red health, or Over Budget)
  const attentionProjects = useMemo(() => {
    return filteredProjects
      .filter((p) => kpis.projectMetricsMap[p.id]?.requiresAttention)
      .sort((a, b) => {
        const ma = kpis.projectMetricsMap[a.id];
        const mb = kpis.projectMetricsMap[b.id];
        if (ma.health === 'Red' && mb.health !== 'Red') return -1;
        if (ma.health !== 'Red' && mb.health === 'Red') return 1;
        return mb.variance - ma.variance;
      });
  }, [filteredProjects, kpis.projectMetricsMap]);

  // Upcoming & Overdue Milestones
  const priorityMilestones = useMemo(() => {
    return state.milestones
      .filter(
        (m) =>
          filteredProjectIds.has(m.projectId) &&
          m.status !== 'Completed' &&
          m.completionPercent < 100
      )
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
      .slice(0, 5);
  }, [state.milestones, filteredProjectIds]);

  // Critical Unresolved Risks
  const criticalRisks = useMemo(() => {
    return state.risks
      .filter((r) => filteredProjectIds.has(r.projectId) && r.status !== 'Resolved')
      .sort(
        (a, b) =>
          calculateRiskScore(b.probability, b.impact) -
          calculateRiskScore(a.probability, a.impact)
      )
      .slice(0, 5);
  }, [state.risks, filteredProjectIds]);

  const projectMap = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p])),
    [state.projects]
  );

  const recentActivity = useMemo(
    () => (state.activityLog || []).slice(0, 6),
    [state.activityLog]
  );

  const step1Highlight = guidedStepNumber === 1 || guidedStepNumber === 2;
  const step8Highlight = guidedStepNumber === 8;

  return (
    <div className="space-y-6">
      {/* Executive Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            <span>PwC India Advisory · Portfolio Intelligence Command Center</span>
            <span>•</span>
            <span>Ref Date: {state.referenceDate}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Executive Portfolio Overview
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time delivery health, capital utilization, milestone velocity, and critical risk telemetry across {kpis.totalProjects} enterprise engagements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Practice:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as Department | 'All')}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Practices ({state.projects.length})</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Horizon:</span>
            <select
              value={dateWindow}
              onChange={(e) =>
                setDateWindow(e.target.value as 'All' | 'Q3-Q4 2026' | 'Next 30 Days')
              }
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">Full FY26-27 Horizon</option>
              <option value="Q3-Q4 2026">Q3–Q4 2026 Delivery</option>
              <option value="Next 30 Days">Closing Next 30 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenAIChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#FDBA74]" />
            <span>Ask PwC AI Copilot</span>
          </button>
        </div>
      </div>

      {/* 6 Required Executive Summary KPI Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 ${
          step1Highlight || step8Highlight ? 'ring-2 ring-[#D04A02] rounded p-1 bg-orange-50/30' : ''
        }`}
      >
        {/* Card 1: Total Projects */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('portfolio', { department: selectedDept, status: 'All' })}
          className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Projects</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {kpis.totalProjects}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <span>{formatCurrency(kpis.totalAllocatedBudget)} budget</span>
            <span className="text-[#1E3A8A] font-semibold">View all →</span>
          </div>
        </button>

        {/* Card 2: Projects On Track */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('portfolio', { health: 'Green', status: 'Active' })}
          className="text-left bg-white border border-slate-200 hover:border-emerald-500 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Projects On Track</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {kpis.onTrackProjects}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-700 font-semibold">
              {kpis.healthDistribution.Green} Green Total
            </span>
            <span className="text-slate-500">{kpis.activeProjects} Active</span>
          </div>
        </button>

        {/* Card 3: Projects At Risk */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('portfolio', { status: 'At Risk' })}
          className="text-left bg-white border border-slate-200 hover:border-amber-500 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Projects At Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-2">
            {kpis.atRiskProjects}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-700 font-semibold">
              {kpis.healthDistribution.Amber} Amber Health
            </span>
            <span className="text-slate-500">{kpis.highUnresolvedRisks} High Risks</span>
          </div>
        </button>

        {/* Card 4: Delayed Projects */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('portfolio', { status: 'Delayed' })}
          className="text-left bg-white border border-slate-200 hover:border-red-500 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Delayed Projects</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-2">
            {kpis.delayedProjects}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-red-700 font-semibold">
              {kpis.overdueMilestones} Overdue MS
            </span>
            <span className="text-slate-500">{kpis.blockedTasks} Blocked Tasks</span>
          </div>
        </button>

        {/* Card 5: Completed Projects */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('portfolio', { status: 'Completed' })}
          className="text-left bg-white border border-slate-200 hover:border-sky-500 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Completed Projects</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-700 mt-2">
            {kpis.completedProjects}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-sky-700 font-semibold">100% Delivered</span>
            <span className="text-slate-500">
              {kpis.completedMilestones}/{kpis.totalMilestones} MS
            </span>
          </div>
        </button>

        {/* Card 6: Overall Project Progress */}
        <button
          type="button"
          onClick={() => onNavigateWithFilter('gantt')}
          className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded p-4 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Overall Progress</span>
            <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {kpis.averagePortfolioProgress}%
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1E3A8A] h-full rounded-full"
              style={{ width: `${kpis.averagePortfolioProgress}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Planned: {kpis.averagePlannedProgress}%</span>
            <span>Tasks: {kpis.taskCompletionRate}%</span>
          </div>
        </button>
      </div>

      {/* Executive Attention Section (Immediate Partner/Director Action Required) */}
      <div className="bg-white border border-red-200 rounded p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Executive Attention Required ({attentionProjects.length} Initiatives)
              </h2>
              <p className="text-xs text-slate-600">
                Projects with Delayed schedule status, Red RAG health, overdue milestones, or budget variance overruns.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQuickResolveOverdueDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D04A02]" />
              <span>Execute PRJ-102 Recovery Sprint</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateWithFilter('ai-assistant')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white transition-colors cursor-pointer"
            >
              <span>Generate AI Recovery Brief</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {attentionProjects.map((project) => {
            const m = kpis.projectMetricsMap[project.id];
            const isRed = m.health === 'Red';
            return (
              <div
                key={project.id}
                className={`border rounded p-4 flex flex-col justify-between transition-all ${
                  isRed
                    ? 'border-red-200 bg-red-50/30 hover:border-red-400'
                    : 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {project.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                          isRed
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {m.health} · {project.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lead: <span className="font-semibold text-slate-800">{project.owner}</span> ({project.department})
                  </p>

                  <div className="mt-3 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completion vs Plan:</span>
                      <span className="font-semibold text-slate-900">
                        {project.progress}% / {project.plannedProgress ?? 80}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget Variance:</span>
                      <span
                        className={`font-semibold ${
                          m.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(m.variance, true)} ({m.utilizationPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Overdue MS / Blocked Tasks:</span>
                      <span className="font-semibold text-red-700">
                        {m.overdueMilestones} MS · {m.blockedTasks} Tasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onInspectProject(project)}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    Quick Inspect
                  </button>
                  {onOpenProjectDetails && (
                    <button
                      type="button"
                      onClick={() => onOpenProjectDetails(project)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Portfolio Health Distribution + Planned vs Actual Progress Trend + Department Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Portfolio Health & Budget Telemetry */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                1. Portfolio Health & Capital Status
              </h2>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              RAG governance distribution and aggregate capital utilization.
            </p>

            {/* Stacked RAG Bar */}
            <div className="mt-4">
              <div className="flex h-3 w-full rounded overflow-hidden bg-slate-100">
                <div
                  className="bg-emerald-600 transition-all"
                  style={{
                    width: `${(kpis.healthDistribution.Green / Math.max(1, kpis.totalProjects)) * 100}%`,
                  }}
                  title={`Green: ${kpis.healthDistribution.Green}`}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{
                    width: `${(kpis.healthDistribution.Amber / Math.max(1, kpis.totalProjects)) * 100}%`,
                  }}
                  title={`Amber: ${kpis.healthDistribution.Amber}`}
                />
                <div
                  className="bg-red-600 transition-all"
                  style={{
                    width: `${(kpis.healthDistribution.Red / Math.max(1, kpis.totalProjects)) * 100}%`,
                  }}
                  title={`Red: ${kpis.healthDistribution.Red}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <button
                  type="button"
                  onClick={() => onNavigateWithFilter('portfolio', { health: 'Green' })}
                  className="p-2 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <div className="text-lg font-bold font-mono text-emerald-800">
                    {kpis.healthDistribution.Green}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">Green (Healthy)</div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateWithFilter('portfolio', { health: 'Amber' })}
                  className="p-2 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <div className="text-lg font-bold font-mono text-amber-800">
                    {kpis.healthDistribution.Amber}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-700">Amber (Watch)</div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateWithFilter('portfolio', { health: 'Red' })}
                  className="p-2 rounded bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <div className="text-lg font-bold font-mono text-red-800">
                    {kpis.healthDistribution.Red}
                  </div>
                  <div className="text-[11px] font-semibold text-red-700">Red (Critical)</div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Approved Portfolio Budget:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(kpis.totalAllocatedBudget)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Actual Expenditure:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(kpis.totalActualSpend)} ({kpis.budgetUtilizationPercent}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Net Budget Variance:</span>
              <span
                className={`font-bold ${
                  kpis.totalBudgetVariance > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(kpis.totalBudgetVariance, true)} ({kpis.overBudgetProjectsCount} over budget)
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Project Progress Trend (Planned vs Actual) */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Progress Trend (Planned vs. Actual)
              </h2>
              <span className="text-[11px] font-mono text-slate-500">May – Oct 2026</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly cumulative delivery velocity and expenditure trajectory.
            </p>

            <div className="mt-4 space-y-3">
              {kpis.monthlyPortfolioTrend.map((pt) => (
                <div key={pt.month} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-slate-700 w-10">{pt.month}</span>
                    <span className="text-slate-500">
                      Actual <strong className="text-slate-900">{pt.actualProgress}%</strong> vs Plan{' '}
                      <strong>{pt.plannedProgress}%</strong>
                    </span>
                    <span className="text-slate-600">{formatCurrency(pt.actual)}</span>
                  </div>
                  <div className="relative h-2.5 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-300 rounded"
                      style={{ width: `${pt.plannedProgress}%` }}
                      title={`Planned: ${pt.plannedProgress}%`}
                    />
                    <div
                      className="absolute top-0 left-0 h-full bg-[#1E3A8A] rounded"
                      style={{ width: `${pt.actualProgress}%` }}
                      title={`Actual: ${pt.actualProgress}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 inline-block bg-[#1E3A8A] rounded-xs" /> Actual Velocity
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 inline-block bg-slate-300 rounded-xs" /> Planned Baseline
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateWithFilter('budget')}
              className="text-[#D04A02] font-semibold hover:underline cursor-pointer"
            >
              Financials →
            </button>
          </div>
        </div>

        {/* Chart 3: Projects by Department */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                3. Delivery by Advisory Practice
              </h2>
              <span className="text-[11px] font-mono text-slate-500">4 Practices</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Department-wise completion rate, budget utilization, and RAG status.
            </p>

            <div className="mt-4 space-y-3.5">
              {kpis.departmentPerformance.map((dept) => (
                <div
                  key={dept.department}
                  onClick={() =>
                    onNavigateWithFilter('portfolio', { department: dept.department })
                  }
                  className="p-2.5 rounded border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {dept.department} ({dept.projectCount})
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-emerald-700 font-semibold">
                        {dept.healthCounts.Green}G
                      </span>
                      <span className="text-amber-700 font-semibold">
                        {dept.healthCounts.Amber}A
                      </span>
                      <span className="text-red-700 font-semibold">
                        {dept.healthCounts.Red}R
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-slate-900">{dept.averageProgress}%</span>
                    </div>
                  </div>
                  <div className="mt-1.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dept.healthCounts.Red > 0
                          ? 'bg-red-600'
                          : dept.healthCounts.Amber > 0
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${dept.averageProgress}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      Spend: {formatCurrency(dept.actualSpend)} ({dept.utilizationPercent}%)
                    </span>
                    <span>
                      MS Rate: {dept.milestoneCompletionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Upcoming & Overdue Milestones + Critical Risks + Recent Project Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming & Overdue Milestones */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Upcoming & Overdue Milestones
                </h2>
                <p className="text-xs text-slate-500">
                  {kpis.overdueMilestones} overdue · {kpis.milestoneCompletionRate}% portfolio completion
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateWithFilter('milestones')}
                className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
              >
                All Milestones →
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {priorityMilestones.map((ms) => {
                const overdue = isMilestoneOverdue(ms, state.referenceDate);
                const daysLate = overdue ? getDaysOverdue(ms.plannedDate, state.referenceDate) : 0;
                const proj = projectMap.get(ms.projectId);
                return (
                  <div key={ms.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {ms.code}
                        </span>
                        <span className="text-xs text-slate-500">({proj?.code})</span>
                        {overdue && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-100 text-red-800 rounded">
                            {daysLate}d OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {ms.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Owner: {ms.owner} · Planned: <span className="font-mono">{ms.plannedDate}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-slate-900 shrink-0">
                      {ms.completionPercent}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Critical Risks */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Critical Unresolved Risks
                </h2>
                <p className="text-xs text-slate-500">
                  {kpis.criticalUnresolvedRisks} Critical (≥16/25) · {kpis.openIssues} Open Issues
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateWithFilter('risks')}
                className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
              >
                Risk Register →
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {criticalRisks.map((r) => {
                const score = calculateRiskScore(r.probability, r.impact);
                const proj = projectMap.get(r.projectId);
                return (
                  <div key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {r.code}
                        </span>
                        <span className="text-xs text-slate-500">({proj?.code})</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded">
                          {r.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">
                        {r.description}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Owner: {r.owner} · Mitigation: <span className="font-mono font-semibold">{r.mitigationProgress}%</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded font-mono text-xs font-bold shrink-0 ${
                        score >= 16
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {score}/25
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Project Activity Feed */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Recent Project Activity
                </h2>
                <p className="text-xs text-slate-500">
                  Live chronological audit trail across engagements
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateWithFilter('activity-log')}
                className="text-xs font-semibold text-[#D04A02] hover:underline cursor-pointer"
              >
                Full Audit Log →
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentActivity.map((act) => (
                <div key={act.id} className="py-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span className="font-bold text-slate-900">{act.userName}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">
                        {act.action} {act.entityType}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {act.timestamp.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                    <span className="font-mono font-semibold text-slate-900">{act.entityCode}: </span>
                    {act.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
