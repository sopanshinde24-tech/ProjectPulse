import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  Download,
  Edit3,
  Eye,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DashboardKPIs,
  Department,
  HealthStatus,
  PortfolioState,
  Project,
  ProjectPriority,
  ProjectStatus,
} from '../types/portfolio';
import { DEPARTMENTS, formatCurrency } from '../utils/calculations';
import { exportProjectsToCSV, parseProjectsCSV, triggerCSVDownload } from '../utils/csvExport';

interface ProjectPortfolioViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  initialDepartmentFilter?: Department | 'All';
  initialStatusFilter?: string;
  initialHealthFilter?: HealthStatus | 'All';
  onlyMyProjects?: boolean;
  currentUserName?: string;
  guidedStepNumber: number | null;
  onInspectProject: (project: Project) => void;
  onOpenProjectDetails?: (project: Project) => void;
  onSaveProject: (project: Project, isNew: boolean) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProjects: (projects: Partial<Project>[]) => void;
}

export const ProjectPortfolioView: React.FC<ProjectPortfolioViewProps> = ({
  state,
  kpis,
  initialDepartmentFilter = 'All',
  initialStatusFilter = 'All',
  initialHealthFilter = 'All',
  onlyMyProjects = false,
  currentUserName = 'Aarav Mehta',
  guidedStepNumber,
  onInspectProject,
  onOpenProjectDetails,
  onSaveProject,
  onDeleteProject,
  onImportProjects,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'timeline'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>(initialDepartmentFilter);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'All');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'All'>(initialHealthFilter || 'All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<'All' | 'Over Budget' | 'Within Budget'>('All');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'endDate' | 'progress' | 'budget' | 'health'>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialDepartmentFilter) setDeptFilter(initialDepartmentFilter);
  }, [initialDepartmentFilter]);

  useEffect(() => {
    if (initialStatusFilter) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialHealthFilter) setHealthFilter(initialHealthFilter);
  }, [initialHealthFilter]);

  // Guided demo Step 2 automatic filter for Delayed/Red projects
  useEffect(() => {
    if (guidedStepNumber === 2) {
      setStatusFilter('Delayed');
    } else if (guidedStepNumber === 1) {
      setStatusFilter('All');
      setDeptFilter('All');
      setHealthFilter('All');
    }
  }, [guidedStepNumber]);

  const uniqueOwners = useMemo(() => {
    return Array.from(new Set(state.projects.map((p) => p.owner))).sort();
  }, [state.projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = state.projects.filter((p) => {
      const m = kpis.projectMetricsMap[p.id];
      if (onlyMyProjects) {
        const isOwner = p.owner.toLowerCase() === currentUserName.toLowerCase();
        const isTeam = p.teamMemberIds?.some((tmId) => {
          const tm = state.teamMembers?.find((t) => t.id === tmId);
          return tm?.name.toLowerCase() === currentUserName.toLowerCase();
        });
        if (!isOwner && !isTeam) return false;
      }
      if (deptFilter !== 'All' && p.department !== deptFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (healthFilter !== 'All' && m?.health !== healthFilter) return false;
      if (priorityFilter !== 'All' && (p.priority || 'High') !== priorityFilter) return false;
      if (ownerFilter !== 'All' && p.owner !== ownerFilter) return false;
      if (budgetFilter === 'Over Budget' && !m?.isOverBudget) return false;
      if (budgetFilter === 'Within Budget' && m?.isOverBudget) return false;

      if (q) {
        const hay = `${p.code} ${p.name} ${p.owner} ${p.department} ${p.category || ''} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const ma = kpis.projectMetricsMap[a.id];
      const mb = kpis.projectMetricsMap[b.id];
      let cmp = 0;
      if (sortBy === 'code') cmp = a.code.localeCompare(b.code);
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'endDate') cmp = a.endDate.localeCompare(b.endDate);
      else if (sortBy === 'progress') cmp = a.progress - b.progress;
      else if (sortBy === 'budget') cmp = a.allocatedBudget - b.allocatedBudget;
      else if (sortBy === 'health') {
        const rank = { Red: 3, Amber: 2, Green: 1 };
        cmp = (rank[ma?.health || 'Green'] || 0) - (rank[mb?.health || 'Green'] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [
    state.projects,
    state.teamMembers,
    kpis.projectMetricsMap,
    onlyMyProjects,
    currentUserName,
    deptFilter,
    statusFilter,
    healthFilter,
    priorityFilter,
    ownerFilter,
    budgetFilter,
    searchQuery,
    sortBy,
    sortDir,
  ]);

  // Modal Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState<Department>('Technology');
  const [formOwner, setFormOwner] = useState('Aarav Mehta');
  const [formOwnerRole, setFormOwnerRole] = useState('Partner, Advisory (PwC India)');
  const [formStartDate, setFormStartDate] = useState('2026-06-01');
  const [formEndDate, setFormEndDate] = useState('2026-12-31');
  const [formAllocated, setFormAllocated] = useState(1200000);
  const [formActual, setFormActual] = useState(650000);
  const [formStatus, setFormStatus] = useState<ProjectStatus>('Active');
  const [formPriority, setFormPriority] = useState<ProjectPriority>('High');
  const [formCategory, setFormCategory] = useState('Digital Transformation');
  const [formProgress, setFormProgress] = useState(50);
  const [formDesc, setFormDesc] = useState('');
  const [formObjective, setFormObjective] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    setFormCode(`PRJ-${state.projects.length + 101}`);
    setFormName('');
    setFormDept('Technology');
    setFormOwner(currentUserName || 'Aarav Mehta');
    setFormOwnerRole('Partner, Digital & Cloud Advisory (PwC India)');
    setFormStartDate('2026-06-01');
    setFormEndDate('2026-12-31');
    setFormAllocated(1250000);
    setFormActual(550000);
    setFormStatus('Active');
    setFormPriority('High');
    setFormCategory('Enterprise Transformation');
    setFormProgress(45);
    setFormDesc('Synthetic demonstration record: Enterprise digital transformation initiative.');
    setFormObjective('Deliver measurable operational efficiency and regulatory compliance.');
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormCode(project.code);
    setFormName(project.name);
    setFormDept(project.department);
    setFormOwner(project.owner);
    setFormOwnerRole(project.ownerRole);
    setFormStartDate(project.startDate);
    setFormEndDate(project.endDate);
    setFormAllocated(project.allocatedBudget);
    setFormActual(project.actualSpend);
    setFormStatus(project.status);
    setFormPriority(project.priority || 'High');
    setFormCategory(project.category || 'Enterprise Transformation');
    setFormProgress(project.progress);
    setFormDesc(project.description);
    setFormObjective(project.strategicObjective);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const projectRecord: Project = {
      id: editingProject ? editingProject.id : `prj-${Date.now()}`,
      code: formCode.trim(),
      name: formName.trim(),
      department: formDept,
      owner: formOwner.trim(),
      ownerRole: formOwnerRole.trim(),
      startDate: formStartDate,
      endDate: formEndDate,
      allocatedBudget: Number(formAllocated) || 0,
      actualSpend: Number(formActual) || 0,
      plannedSpend: Math.round((Number(formAllocated) || 0) * 0.85),
      status: formStatus,
      priority: formPriority,
      category: formCategory.trim(),
      progress: Math.max(0, Math.min(100, Number(formProgress) || 0)),
      plannedProgress: Math.min(100, (Number(formProgress) || 0) + 5),
      description: formDesc.trim(),
      strategicObjective: formObjective.trim(),
      teamMemberIds: editingProject?.teamMemberIds || ['tm-1', 'tm-8'],
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    onSaveProject(projectRecord, !editingProject);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csv = exportProjectsToCSV(filteredProjects, kpis.projectMetricsMap);
    triggerCSVDownload(`projectpulse_portfolio_${state.referenceDate}.csv`, csv);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      const parsed = parseProjectsCSV(content);
      if (parsed.length > 0) {
        onImportProjects(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            {onlyMyProjects
              ? `Personal Workspace · Assigned to ${currentUserName}`
              : 'Enterprise Project Register & Multi-View Directory'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {onlyMyProjects ? 'My Assigned Projects' : 'Project Portfolio'} ({filteredProjects.length})
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Switch between Table, Card Grid, and Timeline views. Click any project to inspect or open its dedicated 8-tab workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, project name, owner, category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as Department | 'All')}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Delayed">Delayed</option>
          <option value="At Risk">At Risk</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as HealthStatus | 'All')}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
        >
          <option value="All">All Health (RAG)</option>
          <option value="Green">Green (Healthy)</option>
          <option value="Amber">Amber (At Risk)</option>
          <option value="Red">Red (Critical)</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'All')}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical Priority</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        <div className="flex items-center gap-2">
          <select
            value={budgetFilter}
            onChange={(e) =>
              setBudgetFilter(e.target.value as 'All' | 'Over Budget' | 'Within Budget')
            }
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
          >
            <option value="All">All Budgets</option>
            <option value="Over Budget">Over Budget</option>
            <option value="Within Budget">Within Budget</option>
          </select>
          {(deptFilter !== 'All' ||
            statusFilter !== 'All' ||
            healthFilter !== 'All' ||
            priorityFilter !== 'All' ||
            ownerFilter !== 'All' ||
            budgetFilter !== 'All' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setDeptFilter('All');
                setStatusFilter('All');
                setHealthFilter('All');
                setPriorityFilter('All');
                setOwnerFilter('All');
                setBudgetFilter('All');
                setSearchQuery('');
              }}
              className="text-xs text-[#D04A02] font-semibold underline shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleSort('code')}
                      className="inline-flex items-center gap-1 font-bold hover:text-slate-900 cursor-pointer"
                    >
                      <span>Project</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Practice & Priority</th>
                  <th className="py-3 px-3">Engagement Lead</th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('endDate')}
                      className="inline-flex items-center gap-1 font-bold hover:text-slate-900 cursor-pointer"
                    >
                      <span>Schedule</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('budget')}
                      className="inline-flex items-center gap-1 font-bold hover:text-slate-900 cursor-pointer"
                    >
                      <span>Budget vs. Actual</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('progress')}
                      className="inline-flex items-center gap-1 font-bold hover:text-slate-900 cursor-pointer"
                    >
                      <span>Progress & MS</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('health')}
                      className="inline-flex items-center gap-1 font-bold hover:text-slate-900 cursor-pointer"
                    >
                      <span>Health & Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredProjects.map((project) => {
                  const m = kpis.projectMetricsMap[project.id];
                  const priority = project.priority || 'High';
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {project.code}
                          </span>
                          {project.isSynthetic && (
                            <span className="text-[10px] font-mono text-slate-400">
                              [SYNTHETIC]
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenProjectDetails
                              ? onOpenProjectDetails(project)
                              : onInspectProject(project)
                          }
                          className="font-bold text-slate-900 hover:text-[#D04A02] text-left mt-0.5 block cursor-pointer"
                        >
                          {project.name}
                        </button>
                        <div className="text-[11px] text-slate-500">
                          {project.category || 'Enterprise Advisory'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{project.department}</div>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            priority === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : priority === 'Medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {priority}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{project.owner}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {project.ownerRole}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-slate-900">{project.startDate}</div>
                        <div className="text-slate-500">to {project.endDate}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-slate-900">
                          {formatCurrency(project.actualSpend)} /{' '}
                          {formatCurrency(project.allocatedBudget)}
                        </div>
                        <div
                          className={`font-semibold ${
                            m.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(m.variance, true)} ({m.utilizationPercent}%)
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                          <span className="font-bold text-slate-900">{project.progress}%</span>
                          <span className="text-slate-500">
                            {m.completedMilestones}/{m.totalMilestones} MS
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.health === 'Red'
                                ? 'bg-red-600'
                                : m.health === 'Amber'
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              m.health === 'Red'
                                ? 'bg-red-600'
                                : m.health === 'Amber'
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <span className="font-mono font-bold text-slate-900">
                            {m.health}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700">
                            {project.status}
                          </span>
                        </div>
                        {m.overdueMilestones > 0 && (
                          <div className="text-[10px] font-mono text-red-700 font-semibold mt-0.5">
                            {m.overdueMilestones} overdue milestone(s)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {onOpenProjectDetails && (
                            <button
                              type="button"
                              onClick={() => onOpenProjectDetails(project)}
                              title="Open Full 8-Tab Workspace"
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                            >
                              Workspace
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onInspectProject(project)}
                            title="Quick Drawer Inspect"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            title="Edit Project"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProject(project.id)}
                            title="Delete Project"
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: GRID / CARD VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const m = kpis.projectMetricsMap[project.id];
            return (
              <div
                key={project.id}
                className="bg-white border border-slate-200 hover:border-slate-400 rounded p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {project.code} · {project.department}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        m.health === 'Red'
                          ? 'bg-red-100 text-red-800'
                          : m.health === 'Amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.health} · {project.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Engagement Lead:</span>
                      <span className="font-sans font-semibold text-slate-900">{project.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timeline:</span>
                      <span className="text-slate-800">
                        {project.startDate} → {project.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget Utilization:</span>
                      <span
                        className={`font-bold ${
                          m.isOverBudget ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(project.actualSpend)} ({m.utilizationPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Milestones & Tasks:</span>
                      <span className="text-slate-900">
                        {m.completedMilestones}/{m.totalMilestones} MS · {m.completedTasks}/{m.totalTasks} Tasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-slate-900">
                    {project.progress}% Complete
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProjectDetails
                          ? onOpenProjectDetails(project)
                          : onInspectProject(project)
                      }
                      className="px-3 py-1 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                    >
                      Open Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: PORTFOLIO TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Portfolio Delivery Horizon (Jan 2026 – Jan 2027)
              </h2>
              <p className="text-xs text-slate-500">
                Visual schedule bars across all {filteredProjects.length} filtered engagements relative to Reference Date ({state.referenceDate}).
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#D04A02]">
              Today: {state.referenceDate}
            </span>
          </div>

          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const m = kpis.projectMetricsMap[project.id];
              const minTime = new Date('2026-01-01T00:00:00Z').getTime();
              const maxTime = new Date('2027-01-31T00:00:00Z').getTime();
              const startT = Math.max(minTime, new Date(`${project.startDate}T00:00:00Z`).getTime());
              const endT = Math.min(maxTime, new Date(`${project.endDate}T00:00:00Z`).getTime());
              const leftPct = Math.max(0, ((startT - minTime) / (maxTime - minTime)) * 100);
              const widthPct = Math.max(4, ((endT - startT) / (maxTime - minTime)) * 100);

              return (
                <div
                  key={project.id}
                  onClick={() =>
                    onOpenProjectDetails
                      ? onOpenProjectDetails(project)
                      : onInspectProject(project)
                  }
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center p-2.5 rounded border border-slate-200 hover:border-slate-400 cursor-pointer"
                >
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {project.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {project.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {project.owner} · {project.startDate} → {project.endDate}
                    </div>
                  </div>

                  <div className="lg:col-span-8 relative h-7 bg-slate-100 rounded overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 rounded flex items-center justify-between px-2 text-[10px] font-mono font-bold text-white ${
                        m.health === 'Red'
                          ? 'bg-red-600'
                          : m.health === 'Amber'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      <span className="truncate">{project.code}</span>
                      <span>{project.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProject ? `Edit Engagement ${editingProject.code}` : 'Create New Portfolio Project'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Enterprise Cloud FinOps & RBI Compliance"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Advisory Practice</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as Department)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Manager / Partner</label>
                  <input
                    type="text"
                    required
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    list="pwc-owners-list"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                  <datalist id="pwc-owners-list">
                    {uniqueOwners.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Designation</label>
                  <input
                    type="text"
                    value={formOwnerRole}
                    onChange={(e) => setFormOwnerRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allocated Budget ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={formAllocated}
                    onChange={(e) => setFormAllocated(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Spend ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={formActual}
                    onChange={(e) => setFormActual(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Delayed">Delayed</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Completion Progress ({formProgress}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-[#D04A02]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Scope & Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategic Business Objective</label>
                <input
                  type="text"
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#D04A02] hover:bg-[#b53f02] text-white font-semibold cursor-pointer"
                >
                  {editingProject ? 'Save Project Updates' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
