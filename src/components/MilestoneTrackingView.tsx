import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  History,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  DashboardKPIs,
  Milestone,
  MilestoneStatus,
  PortfolioState,
} from '../types/portfolio';
import { getDaysOverdue, isMilestoneOverdue } from '../utils/calculations';
import { downloadTextFile, generateMilestonesCSV } from '../utils/csvExport';

interface MilestoneTrackingViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  guidedStepNumber: number | null;
  onAddMilestone: (milestone: Milestone, historyNote: string) => void;
  onUpdateMilestone: (
    milestoneId: string,
    newStatus: MilestoneStatus,
    newPercent: number,
    actualDate: string | null,
    note: string
  ) => void;
}

export const MilestoneTrackingView: React.FC<MilestoneTrackingViewProps> = ({
  state,
  kpis,
  guidedStepNumber,
  onAddMilestone,
  onUpdateMilestone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedMilestoneForUpdate, setSelectedMilestoneForUpdate] =
    useState<Milestone | null>(null);
  const [updatePercent, setUpdatePercent] = useState<number>(100);
  const [updateStatus, setUpdateStatus] = useState<MilestoneStatus>('Completed');
  const [updateActualDate, setUpdateActualDate] = useState<string>(state.referenceDate);
  const [updateNote, setUpdateNote] = useState<string>('');

  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [newMsProjectId, setNewMsProjectId] = useState(state.projects[0]?.id || 'prj-101');
  const [newMsTitle, setNewMsTitle] = useState('');
  const [newMsOwner, setNewMsOwner] = useState('Ananya Iyer');
  const [newMsPlannedDate, setNewMsPlannedDate] = useState('2026-12-10');
  const [newMsNotes, setNewMsNotes] = useState('');

  const projectMap = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p])),
    [state.projects]
  );

  const filteredMilestones = useMemo(() => {
    return state.milestones.filter((m) => {
      const p = projectMap.get(m.projectId);
      const overdue = isMilestoneOverdue(m, state.referenceDate);
      const q = searchQuery.trim().toLowerCase();

      if (
        q &&
        !m.title.toLowerCase().includes(q) &&
        !m.code.toLowerCase().includes(q) &&
        !m.owner.toLowerCase().includes(q) &&
        !(p?.name.toLowerCase().includes(q) || p?.code.toLowerCase().includes(q))
      ) {
        return false;
      }

      if (projectFilter !== 'All' && m.projectId !== projectFilter) return false;
      if (statusFilter === 'Overdue' && !overdue) return false;
      if (statusFilter === 'Completed' && m.status !== 'Completed') return false;
      if (statusFilter === 'In Progress' && (m.status !== 'In Progress' || overdue)) return false;
      if (statusFilter === 'Upcoming' && m.status !== 'Upcoming') return false;

      return true;
    });
  }, [state.milestones, state.referenceDate, projectMap, searchQuery, projectFilter, statusFilter]);

  const handleOpenUpdateModal = (ms: Milestone) => {
    setSelectedMilestoneForUpdate(ms);
    setUpdatePercent(ms.status === 'Completed' ? ms.completionPercent : 100);
    setUpdateStatus(ms.status === 'Completed' ? ms.status : 'Completed');
    setUpdateActualDate(ms.actualDate || state.referenceDate);
    setUpdateNote(`Verified deliverable completion and updated status on ${state.referenceDate}.`);
  };

  const handleConfirmUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForUpdate) return;
    const finalStatus: MilestoneStatus =
      updatePercent === 100 ? 'Completed' : updateStatus;
    const finalActualDate =
      finalStatus === 'Completed' ? updateActualDate || state.referenceDate : null;

    onUpdateMilestone(
      selectedMilestoneForUpdate.id,
      finalStatus,
      updatePercent,
      finalActualDate,
      updateNote.trim() || `Updated milestone progress to ${updatePercent}%.`
    );
    setSelectedMilestoneForUpdate(null);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsTitle.trim()) return;
    const proj = projectMap.get(newMsProjectId);
    const projMsCount = state.milestones.filter((m) => m.projectId === newMsProjectId).length + 1;
    const code = `${proj ? proj.code.replace('PRJ-', 'MS-') : 'MS-NEW'}-${projMsCount}`;
    const isPast = newMsPlannedDate < state.referenceDate;

    const newMs: Milestone = {
      id: `ms-${Date.now()}`,
      projectId: newMsProjectId,
      code,
      title: newMsTitle.trim(),
      owner: newMsOwner.trim() || proj?.owner || 'PMO Lead',
      plannedDate: newMsPlannedDate,
      actualDate: null,
      status: isPast ? 'Overdue' : 'In Progress',
      completionPercent: 25,
      deliverableNotes: newMsNotes.trim() || 'Added via Milestone Tracking module.',
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    onAddMilestone(newMs, `Created milestone ${code} (${newMs.title}) with planned date ${newMsPlannedDate}.`);
    setNewMsTitle('');
    setNewMsNotes('');
    setIsAddingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-mono text-slate-500">
            03 · Milestone Schedule Tracking & Progress Audit Log
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Milestone Tracking & Delivery History
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `projectpulse_milestones_${state.referenceDate}.csv`,
                generateMilestonesCSV(state.milestones, state.projects)
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Milestones CSV
          </button>
          <button
            type="button"
            onClick={() => setIsAddingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Total Tracked Milestones</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {kpis.totalMilestones}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {state.projects.length} strategic projects
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Completed Milestones</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#16A34A] mt-1">
            {kpis.completedMilestones} ({kpis.milestoneCompletionRate}%)
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Verified against actual completion dates
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Overdue Milestones</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#DC2626] mt-1">
            {kpis.overdueMilestones}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Planned date prior to {state.referenceDate}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">In Progress & Upcoming</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {kpis.inProgressMilestones + kpis.upcomingMilestones}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {kpis.inProgressMilestones} active · {kpis.upcomingMilestones} upcoming
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestone, code, owner..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <select
            aria-label="Filter by Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="All">All Projects ({state.projects.length})</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Status Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded">
          {(['All', 'Overdue', 'In Progress', 'Completed', 'Upcoming'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'Overdue' ? `Overdue (${kpis.overdueMilestones})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Split: Milestones Table (8 cols) + Progress History Timeline (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Milestones Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-4">Milestone & Project</th>
                  <th className="py-3 px-3">Planned vs. Actual</th>
                  <th className="py-3 px-3">Status & Schedule</th>
                  <th className="py-3 px-3 text-right">Completion</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMilestones.map((ms) => {
                  const proj = projectMap.get(ms.projectId);
                  const overdue = isMilestoneOverdue(ms, state.referenceDate);
                  const daysOverdue = overdue
                    ? getDaysOverdue(ms.plannedDate, state.referenceDate)
                    : 0;
                  const isDemoFocus =
                    (guidedStepNumber === 4 || guidedStepNumber === 7) &&
                    ms.code === 'MS-102-2';

                  return (
                    <tr
                      key={ms.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isDemoFocus ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-600' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                          <span className="font-bold text-slate-900">{ms.code}</span>
                          <span>·</span>
                          <span>
                            {proj?.code} ({proj?.department})
                          </span>
                          <span>·</span>
                          <span>{ms.owner}</span>
                        </div>
                        <div className="font-semibold text-slate-900 text-sm mt-0.5">
                          {ms.title}
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">
                          {ms.deliverableNotes}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        <div>Planned: {ms.plannedDate}</div>
                        <div className="text-slate-500">
                          Actual: {ms.actualDate || '— Pending'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        {overdue ? (
                          <div className="text-[#DC2626] font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Overdue ({daysOverdue}d late)</span>
                          </div>
                        ) : ms.status === 'Completed' ? (
                          <div className="text-[#16A34A] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="text-slate-700 font-semibold">{ms.status}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-900">{ms.completionPercent}%</div>
                        <div className="w-16 ml-auto h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                          <div
                            style={{ width: `${ms.completionPercent}%` }}
                            className={`h-full ${
                              overdue
                                ? 'bg-[#DC2626]'
                                : ms.status === 'Completed'
                                ? 'bg-[#16A34A]'
                                : 'bg-[#1E3A8A]'
                            }`}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenUpdateModal(ms)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer"
                        >
                          Update Progress
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress History Audit Log (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <span>Milestone Progress History</span>
              </h2>
              <p className="text-xs text-slate-500">
                Chronological audit log of status and completion changes
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              {state.milestoneHistory.length} entries
            </span>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 divide-y divide-slate-100">
            {state.milestoneHistory.map((entry) => {
              const ms = state.milestones.find((m) => m.id === entry.milestoneId);
              const proj = projectMap.get(entry.projectId);
              return (
                <div key={entry.id} className="pt-3 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {ms?.code || entry.milestoneId} · {proj?.code}
                    </span>
                    <span>{entry.timestamp.slice(0, 10)}</span>
                  </div>
                  <div className="font-medium text-slate-800">
                    {ms?.title || 'Milestone Update'}
                  </div>
                  <div className="font-mono text-[11px] text-[#1E3A8A] font-semibold">
                    {entry.previousPercent}% ({entry.previousStatus}) → {entry.newPercent}% (
                    {entry.newStatus}) · by {entry.author}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{entry.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Update Milestone Progress Modal */}
      {selectedMilestoneForUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Update Milestone {selectedMilestoneForUpdate.code}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedMilestoneForUpdate(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpdate} className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">
                  {selectedMilestoneForUpdate.title}
                </span>{' '}
                (Planned: {selectedMilestoneForUpdate.plannedDate})
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => {
                      const s = e.target.value as MilestoneStatus;
                      setUpdateStatus(s);
                      if (s === 'Completed') setUpdatePercent(100);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Completion Date
                  </label>
                  <input
                    type="date"
                    value={updateActualDate}
                    onChange={(e) => setUpdateActualDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Completion Percentage ({updatePercent}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={updatePercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setUpdatePercent(val);
                    if (val === 100) setUpdateStatus('Completed');
                  }}
                  className="w-full accent-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress History Audit Note
                </label>
                <textarea
                  rows={2}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestoneForUpdate(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  Save Milestone & Log History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Milestone Modal */}
      {isAddingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Add New Project Milestone
              </h2>
              <button
                type="button"
                onClick={() => setIsAddingModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Project
                </label>
                <select
                  value={newMsProjectId}
                  onChange={(e) => setNewMsProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Milestone Deliverable Title
                </label>
                <input
                  type="text"
                  value={newMsTitle}
                  onChange={(e) => setNewMsTitle(e.target.value)}
                  placeholder="e.g., Production Parallel Cutover Sign-Off"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={newMsOwner}
                    onChange={(e) => setNewMsOwner(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Completion Date
                  </label>
                  <input
                    type="date"
                    value={newMsPlannedDate}
                    onChange={(e) => setNewMsPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Acceptance Criteria / Notes
                </label>
                <textarea
                  rows={2}
                  value={newMsNotes}
                  onChange={(e) => setNewMsNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
