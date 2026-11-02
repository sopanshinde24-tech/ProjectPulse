import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  GitBranch,
  Plus,
  Search,
} from 'lucide-react';
import {
  DashboardKPIs,
  DependencyStatus,
  DependencyType,
  IssueItem,
  IssueStatus,
  PortfolioState,
  ProjectPriority,
  TaskDependency,
} from '../types/portfolio';

interface IssuesDependenciesViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  onAddIssue: (issue: IssueItem) => void;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus, resolutionNotes?: string) => void;
  onAddDependency: (dep: TaskDependency) => void;
}

export const IssuesDependenciesView: React.FC<IssuesDependenciesViewProps> = ({
  state,
  kpis,
  onAddIssue,
  onUpdateIssueStatus,
  onAddDependency,
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'dependencies'>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  // New Issue Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(state.projects[1]?.id || 'prj-102');
  const [priority, setPriority] = useState<ProjectPriority>('Critical');
  const [owner, setOwner] = useState('Ananya Iyer');
  const [targetDate, setTargetDate] = useState('2026-11-18');

  // New Dependency Form
  const [depProjectId, setDepProjectId] = useState(state.projects[1]?.id || 'prj-102');
  const [blockingTaskId, setBlockingTaskId] = useState('tsk-102-2');
  const [blockedTaskId, setBlockedTaskId] = useState('tsk-102-3');
  const [depType, setDepType] = useState<DependencyType>('Finish-to-Start');
  const [depNotes, setDepNotes] = useState('');

  const issues = state.issues || [];
  const dependencies = state.dependencies || [];
  const tasks = state.tasks || [];

  const projectMap = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p])),
    [state.projects]
  );

  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  );

  const filteredIssues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return issues.filter((iss) => {
      if (statusFilter !== 'All' && iss.status !== statusFilter) return false;
      if (q) {
        const proj = projectMap.get(iss.projectId);
        const hay = `${iss.code} ${iss.title} ${iss.description} ${iss.owner} ${proj?.code || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, statusFilter, searchQuery, projectMap]);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newIssue: IssueItem = {
      id: `iss-${Date.now()}`,
      code: `ISS-0${issues.length + 1}`,
      title: title.trim(),
      description: description.trim() || 'Operational delivery blocker escalated for PMO resolution.',
      projectId,
      priority,
      owner,
      reportedDate: state.referenceDate,
      targetResolutionDate: targetDate,
      status: 'Open',
      resolutionNotes: 'Logged via Issues & Dependencies Governance module.',
      updatedAt: new Date().toISOString(),
    };
    onAddIssue(newIssue);
    setTitle('');
    setDescription('');
    setIsIssueModalOpen(false);
  };

  const handleCreateDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockingTaskId === blockedTaskId) return;
    const blockingTask = taskMap.get(blockingTaskId);
    const depStatus: DependencyStatus =
      blockingTask?.status === 'Completed'
        ? 'Fulfilled'
        : blockingTask?.status === 'Blocked'
        ? 'Blocked'
        : 'Active';

    const newDep: TaskDependency = {
      id: `dep-${Date.now()}`,
      projectId: depProjectId,
      blockingTaskId,
      blockedTaskId,
      dependencyType: depType,
      status: depStatus,
      notes: depNotes.trim() || 'Cross-deliverable task sequencing dependency.',
    };
    onAddDependency(newDep);
    setDepNotes('');
    setIsDepModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Governance · Blocker Resolution & Critical-Path Sequencing
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Issues & Dependencies Register
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Track active operational blockers ({kpis.openIssues} open, {kpis.criticalIssues} escalated) and blocking/blocked deliverable dependencies ({dependencies.length} links).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-medium cursor-pointer ${
                activeTab === 'issues' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Issues & Blockers ({issues.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dependencies')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-medium cursor-pointer ${
                activeTab === 'dependencies'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Task Dependencies ({dependencies.length})</span>
            </button>
          </div>

          {activeTab === 'issues' ? (
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Issue / Blocker</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDepModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Task Dependency</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ISSUES & BLOCKERS */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issue ID, title, project, owner..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'All')}
                className="px-2.5 py-1.5 border border-slate-300 rounded bg-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Escalated">Escalated</option>
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                    <th className="py-3 px-4">Issue ID</th>
                    <th className="py-3 px-3">Title & Resolution Notes</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3">Reported → Target</th>
                    <th className="py-3 px-3">Linked Task/Risk</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredIssues.map((iss) => {
                    const proj = projectMap.get(iss.projectId);
                    const relTask = iss.relatedTaskId ? taskMap.get(iss.relatedTaskId) : null;
                    return (
                      <tr key={iss.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {iss.code}
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <div className="font-bold text-slate-900">{iss.title}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {iss.description}
                          </div>
                          {iss.resolutionNotes && (
                            <div className="text-[11px] text-[#1E3A8A] font-medium mt-1">
                              Action: {iss.resolutionNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {proj?.code || iss.projectId}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              iss.priority === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : iss.priority === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {iss.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {iss.owner}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div>{iss.reportedDate}</div>
                          <div className="text-slate-500">Target: {iss.targetResolutionDate}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {relTask ? relTask.code : '—'}
                          {iss.relatedRiskId ? ` · ${iss.relatedRiskId.toUpperCase()}` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={iss.status}
                            onChange={(e) =>
                              onUpdateIssueStatus(iss.id, e.target.value as IssueStatus)
                            }
                            className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer ${
                              iss.status === 'Escalated'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : iss.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Escalated">Escalated</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASK DEPENDENCIES */}
      {activeTab === 'dependencies' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-3">Blocking Task (Predecessor)</th>
                  <th className="py-3 px-3">Dependency Type</th>
                  <th className="py-3 px-3">Blocked Task (Successor)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Critical-Path Impact Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dependencies.map((dep) => {
                  const proj = projectMap.get(dep.projectId);
                  const blocking = taskMap.get(dep.blockingTaskId);
                  const blocked = taskMap.get(dep.blockedTaskId);
                  return (
                    <tr key={dep.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {proj?.code || dep.projectId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">
                          {blocking?.code || dep.blockingTaskId}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {blocking?.title} ({blocking?.status})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#1E3A8A]">
                        {dep.dependencyType}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">
                          {blocked?.code || dep.blockedTaskId}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {blocked?.title} ({blocked?.status})
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            dep.status === 'Blocked'
                              ? 'bg-red-100 text-red-800'
                              : dep.status === 'At Risk'
                              ? 'bg-amber-100 text-amber-800'
                              : dep.status === 'Fulfilled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{dep.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Log New Issue */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Log Project Issue / Blocker</h2>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Resolution Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D04A02] text-white font-semibold rounded cursor-pointer"
                >
                  Save Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Link Task Dependency */}
      {isDepModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Link Task Dependency</h2>
              <button
                type="button"
                onClick={() => setIsDepModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <form onSubmit={handleCreateDependency} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project</label>
                <select
                  value={depProjectId}
                  onChange={(e) => setDepProjectId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Blocking Task (Predecessor)
                  </label>
                  <select
                    value={blockingTaskId}
                    onChange={(e) => setBlockingTaskId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Blocked Task (Successor)
                  </label>
                  <select
                    value={blockedTaskId}
                    onChange={(e) => setBlockedTaskId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dependency Type</label>
                <select
                  value={depType}
                  onChange={(e) => setDepType(e.target.value as DependencyType)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="Finish-to-Start">Finish-to-Start (FS)</option>
                  <option value="Start-to-Start">Start-to-Start (SS)</option>
                  <option value="Finish-to-Finish">Finish-to-Finish (FF)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D04A02] text-white font-semibold rounded cursor-pointer"
                >
                  Link Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
