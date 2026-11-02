import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Diamond,
  ExternalLink,
  Filter,
  GitBranch,
  ZoomIn,
} from 'lucide-react';
import {
  DashboardKPIs,
  Department,
  PortfolioState,
  Project,
} from '../types/portfolio';
import { DEPARTMENTS, isMilestoneOverdue, isTaskOverdue } from '../utils/calculations';

interface TimelineGanttViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  onOpenProjectDetails: (project: Project) => void;
  onUpdateProjectDates: (projectId: string, startDate: string, endDate: string) => void;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  state,
  kpis,
  onOpenProjectDetails,
  onUpdateProjectDates,
}) => {
  const [zoomMode, setZoomMode] = useState<'month' | 'week'>('month');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'prj-101': true,
    'prj-102': true,
    'prj-105': true,
    'prj-106': true,
  });

  const [editingDatesProjectId, setEditingDatesProjectId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');

  // Horizon configuration
  const horizonStartStr = zoomMode === 'month' ? '2026-01-01' : '2026-08-01';
  const horizonEndStr = zoomMode === 'month' ? '2027-01-31' : '2026-12-31';
  const minTime = new Date(`${horizonStartStr}T00:00:00Z`).getTime();
  const maxTime = new Date(`${horizonEndStr}T00:00:00Z`).getTime();
  const refTime = new Date(`${state.referenceDate}T00:00:00Z`).getTime();
  const refPct = Math.max(0, Math.min(100, ((refTime - minTime) / (maxTime - minTime)) * 100));

  const timeColumns = useMemo(() => {
    if (zoomMode === 'month') {
      return [
        'Jan 26',
        'Feb 26',
        'Mar 26',
        'Apr 26',
        'May 26',
        'Jun 26',
        'Jul 26',
        'Aug 26',
        'Sep 26',
        'Oct 26',
        'Nov 26',
        'Dec 26',
        'Jan 27',
      ];
    }
    return [
      'Aug W1',
      'Aug W3',
      'Sep W1',
      'Sep W3',
      'Oct W1',
      'Oct W3',
      'Nov W1 (Now)',
      'Nov W3',
      'Dec W1',
      'Dec W3',
    ];
  }, [zoomMode]);

  const filteredProjects = useMemo(() => {
    return state.projects.filter((p) => {
      if (deptFilter !== 'All' && p.department !== deptFilter) return false;
      if (selectedProjectId !== 'All' && p.id !== selectedProjectId) return false;
      return true;
    });
  }, [state.projects, deptFilter, selectedProjectId]);

  const getPosition = (startStr: string, endStr: string) => {
    const s = Math.max(minTime, new Date(`${startStr}T00:00:00Z`).getTime());
    const e = Math.min(maxTime, new Date(`${endStr}T00:00:00Z`).getTime());
    const left = Math.max(0, Math.min(96, ((s - minTime) / (maxTime - minTime)) * 100));
    const width = Math.max(2.5, Math.min(100 - left, ((e - s) / (maxTime - minTime)) * 100));
    return { left, width };
  };

  const getPointPosition = (dateStr: string) => {
    const t = new Date(`${dateStr}T00:00:00Z`).getTime();
    return Math.max(1, Math.min(98, ((t - minTime) / (maxTime - minTime)) * 100));
  };

  const toggleExpand = (projId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Project Delivery · Critical Path, Milestones & Task Dependencies
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Interactive Timeline & Gantt Chart
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Expand any project row to inspect underlying milestones (◆), task duration bars, and finish-to-start dependencies relative to{' '}
            <span className="font-mono font-bold text-slate-900">{state.referenceDate}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Zoom Mode */}
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setZoomMode('month')}
              className={`px-3 py-1.5 rounded font-medium cursor-pointer ${
                zoomMode === 'month' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              Monthly Horizon
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('week')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-medium cursor-pointer ${
                zoomMode === 'week' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Bi-Weekly Zoom</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as Department | 'All')}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Practices</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded bg-slate-50 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="All">All Projects ({state.projects.length})</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="bg-white border border-slate-200 rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> Green / On Track
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Amber / At Risk
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-600 inline-block" /> Red / Delayed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Diamond className="w-3.5 h-3.5 text-[#1E3A8A] fill-current" /> Milestone Gate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-slate-500" /> Finish-to-Start Dependency
          </span>
        </div>
        <div className="text-[#D04A02] font-bold">
          │ Reference Date Marker: {state.referenceDate}
        </div>
      </div>

      {/* Main Gantt Grid */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            {/* Timeline Header */}
            <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase font-bold text-slate-600">
              <div className="col-span-4 py-3 px-4 border-r border-slate-200">
                Project / Milestone / Deliverable Task
              </div>
              <div className="col-span-8 relative grid" style={{ gridTemplateColumns: `repeat(${timeColumns.length}, minmax(0, 1fr))` }}>
                {timeColumns.map((col) => (
                  <div
                    key={col}
                    className="py-3 px-1.5 text-center border-r border-slate-200/70 last:border-r-0 truncate"
                  >
                    {col}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-200">
              {filteredProjects.map((project) => {
                const m = kpis.projectMetricsMap[project.id];
                const isExpanded = Boolean(expandedProjects[project.id]);
                const pos = getPosition(project.startDate, project.endDate);
                const pMilestones = state.milestones.filter((ms) => ms.projectId === project.id);
                const pTasks = (state.tasks || []).filter((t) => t.projectId === project.id);

                return (
                  <React.Fragment key={project.id}>
                    {/* Project Parent Row */}
                    <div className="grid grid-cols-12 items-center hover:bg-slate-50/80 transition-colors">
                      <div className="col-span-4 py-3 px-4 border-r border-slate-200 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(project.id)}
                            className="mt-0.5 p-0.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {project.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenProjectDetails(project)}
                                className="text-xs font-bold text-slate-900 hover:text-[#D04A02] text-left cursor-pointer"
                              >
                                {project.name}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {project.owner} · {project.startDate} → {project.endDate}
                            </div>

                            {editingDatesProjectId === project.id && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono">
                                <input
                                  type="date"
                                  value={draftStart}
                                  onChange={(e) => setDraftStart(e.target.value)}
                                  className="px-1.5 py-0.5 border border-slate-300 rounded"
                                />
                                <span>→</span>
                                <input
                                  type="date"
                                  value={draftEnd}
                                  onChange={(e) => setDraftEnd(e.target.value)}
                                  className="px-1.5 py-0.5 border border-slate-300 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateProjectDates(project.id, draftStart, draftEnd);
                                    setEditingDatesProjectId(null);
                                  }}
                                  className="px-2 py-0.5 bg-[#D04A02] text-white rounded font-sans font-semibold cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingDatesProjectId === project.id) {
                                setEditingDatesProjectId(null);
                              } else {
                                setEditingDatesProjectId(project.id);
                                setDraftStart(project.startDate);
                                setDraftEnd(project.endDate);
                              }
                            }}
                            title="Adjust Schedule Dates"
                            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenProjectDetails(project)}
                            title="Open Project Workspace"
                            className="p-1 text-slate-500 hover:text-[#D04A02] rounded cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Gantt Bar Canvas */}
                      <div className="col-span-8 relative h-12 bg-slate-50/40 flex items-center">
                        {/* Vertical Reference Date Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#D04A02] z-10 pointer-events-none"
                          style={{ left: `${refPct}%` }}
                        />

                        {/* Project Duration Bar */}
                        <div
                          onClick={() => onOpenProjectDetails(project)}
                          className={`absolute h-6 rounded shadow-xs flex items-center justify-between px-2.5 text-[11px] font-mono font-bold text-white cursor-pointer overflow-hidden ${
                            m.health === 'Red'
                              ? 'bg-red-600'
                              : m.health === 'Amber'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                          title={`${project.code}: ${project.startDate} to ${project.endDate} (${project.progress}%)`}
                        >
                          <span className="truncate">{project.code}</span>
                          <span>{project.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Sub-Rows: Milestones & Tasks */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 divide-y divide-slate-200/60">
                        {/* Milestones */}
                        {pMilestones.map((ms) => {
                          const msLeft = getPointPosition(ms.plannedDate);
                          const overdue = isMilestoneOverdue(ms, state.referenceDate);
                          return (
                            <div
                              key={ms.id}
                              className="grid grid-cols-12 items-center text-xs"
                            >
                              <div className="col-span-4 py-2 pl-10 pr-4 border-r border-slate-200 flex items-center justify-between">
                                <div className="truncate">
                                  <span className="font-mono font-bold text-[#1E3A8A]">
                                    ◆ {ms.code}
                                  </span>{' '}
                                  <span className="text-slate-700">{ms.title}</span>
                                </div>
                                <span
                                  className={`font-mono text-[10px] font-bold shrink-0 ml-2 ${
                                    overdue ? 'text-red-700' : 'text-slate-500'
                                  }`}
                                >
                                  {ms.plannedDate} ({ms.completionPercent}%)
                                </span>
                              </div>

                              <div className="col-span-8 relative h-8 flex items-center">
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-[#D04A02]/50 pointer-events-none"
                                  style={{ left: `${refPct}%` }}
                                />
                                <div
                                  className="absolute -translate-x-1/2 flex items-center gap-1"
                                  style={{ left: `${msLeft}%` }}
                                  title={`Milestone ${ms.code}: Planned ${ms.plannedDate}`}
                                >
                                  <Diamond
                                    className={`w-4 h-4 fill-current ${
                                      overdue
                                        ? 'text-red-600'
                                        : ms.status === 'Completed'
                                        ? 'text-emerald-600'
                                        : 'text-[#1E3A8A]'
                                    }`}
                                  />
                                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-white/90 px-1 rounded border border-slate-200">
                                    {ms.code}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Tasks */}
                        {pTasks.map((t) => {
                          const tPos = getPosition(t.startDate, t.dueDate);
                          const overdue = isTaskOverdue(t, state.referenceDate);
                          return (
                            <div
                              key={t.id}
                              className="grid grid-cols-12 items-center text-xs"
                            >
                              <div className="col-span-4 py-2 pl-10 pr-4 border-r border-slate-200 flex items-center justify-between">
                                <div className="truncate">
                                  <span className="font-mono font-semibold text-slate-700">
                                    ↳ {t.code}
                                  </span>{' '}
                                  <span className="text-slate-600">{t.title}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                                  {t.assigneeName.split(' ')[0]} · {t.status}
                                </span>
                              </div>

                              <div className="col-span-8 relative h-8 flex items-center">
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-[#D04A02]/50 pointer-events-none"
                                  style={{ left: `${refPct}%` }}
                                />
                                <div
                                  className={`absolute h-4 rounded text-[10px] font-mono text-white px-1.5 flex items-center justify-between overflow-hidden ${
                                    t.status === 'Blocked' || overdue
                                      ? 'bg-red-500'
                                      : t.status === 'Completed'
                                      ? 'bg-slate-600'
                                      : 'bg-[#1E3A8A]'
                                  }`}
                                  style={{ left: `${tPos.left}%`, width: `${tPos.width}%` }}
                                  title={`${t.code}: ${t.startDate} → ${t.dueDate} (${t.status})`}
                                >
                                  <span className="truncate">{t.code}</span>
                                  {t.dependencyIds.length > 0 && <span>🔗</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
