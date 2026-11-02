import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  Kanban,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DashboardKPIs,
  PortfolioState,
  ProjectPriority,
  TaskItem,
  TaskStatus,
} from '../types/portfolio';
import { isTaskOverdue } from '../utils/calculations';

interface TasksDeliverablesViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  onAddTask: (task: TaskItem) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksDeliverablesView: React.FC<TasksDeliverablesViewProps> = ({
  state,
  kpis,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar' | 'grouped'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All' | 'Overdue'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(state.projects[0]?.id || 'prj-101');
  const [assigneeName, setAssigneeName] = useState('Nikhil Menon');
  const [priority, setPriority] = useState<ProjectPriority>('High');
  const [status, setStatus] = useState<TaskStatus>('In Progress');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [estimatedHours, setEstimatedHours] = useState(40);

  const tasks = state.tasks || [];
  const projectMap = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p])),
    [state.projects]
  );

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assigneeName))).sort(),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((t) => {
      if (projectFilter !== 'All' && t.projectId !== projectFilter) return false;
      if (statusFilter === 'Overdue') {
        if (!isTaskOverdue(t, state.referenceDate)) return false;
      } else if (statusFilter !== 'All' && t.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'All' && t.assigneeName !== assigneeFilter) return false;
      if (q) {
        const proj = projectMap.get(t.projectId);
        const hay = `${t.code} ${t.title} ${t.description} ${t.assigneeName} ${proj?.code || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    tasks,
    projectFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    searchQuery,
    state.referenceDate,
    projectMap,
  ]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tm = state.teamMembers?.find((m) => m.name === assigneeName);
    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      code: `TSK-${tasks.length + 101}`,
      title: title.trim(),
      description: description.trim() || 'Deliverable work package tracked in ProjectPulse AI.',
      projectId,
      assigneeId: tm?.id || 'tm-10',
      assigneeName,
      priority,
      status,
      startDate,
      dueDate,
      estimatedHours: Number(estimatedHours) || 40,
      actualHours: status === 'Completed' ? Number(estimatedHours) || 40 : 12,
      completedDate: status === 'Completed' ? state.referenceDate : null,
      dependencyIds: [],
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };
    onAddTask(newTask);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleStatusChange = (task: TaskItem, nextStatus: TaskStatus) => {
    const updated: TaskItem = {
      ...task,
      status: nextStatus,
      completedDate: nextStatus === 'Completed' ? state.referenceDate : null,
      actualHours: nextStatus === 'Completed' ? task.estimatedHours : task.actualHours,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTask(updated);
    if (selectedTask?.id === task.id) setSelectedTask(updated);
  };

  const statuses: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

  return (
    <div className="space-y-5">
      {/* Header & View Mode Controls */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Project Delivery · Work Breakdown & Deliverable Execution
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Tasks & Deliverables ({filteredTasks.length})
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {kpis.completedTasks}/{kpis.totalTasks} completed ({kpis.taskCompletionRate}%) ·{' '}
            <span className="text-red-700 font-semibold">{kpis.blockedTasks} Blocked</span> ·{' '}
            <span className="text-amber-700 font-semibold">{kpis.overdueTasks} Overdue</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'calendar' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                viewMode === 'grouped' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>By Project</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, code, assignee..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded"
          />
        </div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Projects</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'All' | 'Overdue')}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Task Statuses</option>
          <option value="Overdue">Overdue Tasks Only</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'All')}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-3">Deliverable Title</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Assigned Person</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Start → Due Date</th>
                  <th className="py-3 px-3">Effort (Act/Est)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTasks.map((t) => {
                  const proj = projectMap.get(t.projectId);
                  const overdue = isTaskOverdue(t, state.referenceDate);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="hover:text-[#D04A02] underline cursor-pointer"
                        >
                          {t.code}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="font-bold text-slate-900 hover:text-[#D04A02] text-left cursor-pointer"
                        >
                          {t.title}
                        </button>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {t.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {proj?.code || t.projectId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {t.assigneeName}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            t.priority === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : t.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>
                          {t.startDate} →{' '}
                          <span className={overdue ? 'text-red-700 font-bold' : ''}>
                            {t.dueDate}
                          </span>
                        </div>
                        {overdue && (
                          <span className="text-[10px] text-red-700 font-bold">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {t.actualHours}h / {t.estimatedHours}h
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            handleStatusChange(t, e.target.value as TaskStatus)
                          }
                          className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer ${
                            t.status === 'Blocked'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : t.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white text-slate-800 border-slate-300'
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTask(t.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-100/80 border border-slate-200 rounded p-3 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {colStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-xs font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((t) => {
                    const proj = projectMap.get(t.projectId);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="bg-white border border-slate-200 hover:border-slate-400 rounded p-3 space-y-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-900">
                            {t.code} · {proj?.code}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{t.title}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{t.assigneeName}</span>
                          <span className="font-mono">Due {t.dueDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: CALENDAR / SCHEDULE HORIZON VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Deliverable Due-Date Schedule (Sorted Chronologically)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...filteredTasks]
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((t) => {
                const proj = projectMap.get(t.projectId);
                const overdue = isTaskOverdue(t, state.referenceDate);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className={`p-3.5 rounded border cursor-pointer ${
                      overdue
                        ? 'border-red-300 bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#1E3A8A]">Due: {t.dueDate}</span>
                      <span className="font-bold text-slate-900">
                        {t.code} ({proj?.code})
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">{t.title}</div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Assignee: {t.assigneeName} · Status: <strong>{t.status}</strong>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW 4: PROJECT GROUPING VIEW */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {state.projects.map((proj) => {
            const pTasks = filteredTasks.filter((t) => t.projectId === proj.id);
            if (pTasks.length === 0) return null;
            return (
              <div key={proj.id} className="bg-white border border-slate-200 rounded p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#D04A02]">
                      {proj.code}
                    </span>{' '}
                    <span className="text-sm font-bold text-slate-900">{proj.name}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-500">
                    {pTasks.length} Task(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="p-3 border border-slate-200 rounded hover:border-slate-400 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-slate-900">{t.code}</span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {t.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 mt-1">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.assigneeName} · Due {t.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 overflow-y-auto space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#D04A02]">
                  {selectedTask.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedTask.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">{selectedTask.description}</p>
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded font-mono">
                <div>
                  <span className="text-slate-500 block">Assignee:</span>
                  <strong className="font-sans text-slate-900">{selectedTask.assigneeName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Priority:</span>
                  <strong className="text-slate-900">{selectedTask.priority}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Start Date:</span>
                  <strong className="text-slate-900">{selectedTask.startDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Due Date:</span>
                  <strong className="text-slate-900">{selectedTask.dueDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Effort:</span>
                  <strong className="text-slate-900">{selectedTask.estimatedHours} hrs</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Actual Logged:</span>
                  <strong className="text-slate-900">{selectedTask.actualHours} hrs</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Update Deliverable Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedTask, st)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer ${
                        selectedTask.status === st
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Deliverable Task</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deploy Async DB2 CDC Connector in Production"
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
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {(state.teamMembers || []).map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D04A02] text-white font-semibold rounded cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
