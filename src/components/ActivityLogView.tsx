import React, { useMemo, useState } from 'react';
import { Activity, Filter, Search } from 'lucide-react';
import { ActivityLogEntry, PortfolioState } from '../types/portfolio';

interface ActivityLogViewProps {
  state: PortfolioState;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');

  const combinedLog = useMemo(() => {
    const baseLogs = state.activityLog || [];
    const msLogs: ActivityLogEntry[] = state.milestoneHistory.map((mh) => ({
      id: `mh-log-${mh.id}`,
      userName: mh.author,
      userRole: 'Project Lead',
      action: 'Updated',
      entityType: 'Milestone',
      entityCode: mh.milestoneId.toUpperCase(),
      projectId: mh.projectId,
      timestamp: mh.timestamp,
      description: `${mh.note} (Status: ${mh.previousStatus} → ${mh.newStatus}, Progress: ${mh.previousPercent}% → ${mh.newPercent}%)`,
    }));

    return [...baseLogs, ...msLogs].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }, [state.activityLog, state.milestoneHistory]);

  const filteredLog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return combinedLog.filter((item) => {
      if (entityFilter !== 'All' && item.entityType !== entityFilter) return false;
      if (actionFilter !== 'All' && item.action !== actionFilter) return false;
      if (q) {
        const hay = `${item.userName} ${item.entityCode} ${item.description} ${item.action}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [combinedLog, entityFilter, actionFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Administration · Immutable Governance & Change Audit Trail
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Workspace Activity Log ({filteredLog.length} Events)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Chronological log of all actual user and system operations across projects, tasks, milestones, risks, issues, and budgets.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user, entity code, description..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
          >
            <option value="All">All Entity Types</option>
            <option value="Project">Project</option>
            <option value="Task">Task</option>
            <option value="Milestone">Milestone</option>
            <option value="Risk">Risk</option>
            <option value="Issue">Issue</option>
            <option value="Budget">Budget</option>
            <option value="Report">Report</option>
          </select>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Action Types</option>
          <option value="Created">Created</option>
          <option value="Updated">Updated</option>
          <option value="Completed">Completed</option>
          <option value="Escalated">Escalated</option>
          <option value="Approved">Approved</option>
          <option value="Deleted">Deleted</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Actor & RBAC Role</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-4">Audit Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLog.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {item.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.userName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{item.userRole}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.action === 'Escalated' || item.action === 'Deleted'
                          ? 'bg-red-100 text-red-800'
                          : item.action === 'Completed' || item.action === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="text-slate-500">{item.entityType}:</span>{' '}
                    <strong className="text-slate-900">{item.entityCode}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    <div className="flex items-start gap-2">
                      <Activity className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <span>{item.description}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
