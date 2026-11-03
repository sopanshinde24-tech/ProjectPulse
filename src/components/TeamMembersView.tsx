import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import {
  DashboardKPIs,
  Department,
  PortfolioState,
  TeamMember,
  UserAppRole,
} from '../types/portfolio';
import { SOPAN_SHINDE_AVATAR_URL } from '../data/seedData';
import { DEPARTMENTS } from '../utils/calculations';

interface TeamMembersViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  currentRole: UserAppRole;
  onSwitchRole: (role: UserAppRole, userName: string) => void;
  onAddTeamMember: (member: TeamMember) => void;
  onUpdateMemberCapacity: (memberId: string, capacityHours: number, appRole: UserAppRole) => void;
}

export const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  state,
  kpis,
  currentRole,
  onSwitchRole,
  onAddTeamMember,
  onUpdateMemberCapacity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<UserAppRole | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Member Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Senior Manager, Digital Advisory');
  const [appRole, setAppRole] = useState<UserAppRole>('Project Manager');
  const [department, setDepartment] = useState<Department>('Technology');
  const [location, setLocation] = useState('Mumbai (BKC)');
  const [weeklyCapacity, setWeeklyCapacity] = useState(40);

  const filteredWorkloads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return kpis.teamWorkloads.filter((tm) => {
      if (deptFilter !== 'All' && tm.department !== deptFilter) return false;
      if (roleFilter !== 'All' && tm.appRole !== roleFilter) return false;
      if (q) {
        const hay = `${tm.name} ${tm.designation} ${tm.location} ${tm.assignedProjectCodes.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [kpis.teamWorkloads, deptFilter, roleFilter, searchQuery]);

  const avgUtilization = useMemo(() => {
    if (kpis.teamWorkloads.length === 0) return 0;
    const sum = kpis.teamWorkloads.reduce((s, w) => s + w.utilizationPercent, 0);
    return Math.round(sum / kpis.teamWorkloads.length);
  }, [kpis.teamWorkloads]);

  const overallocatedCount = useMemo(
    () => kpis.teamWorkloads.filter((w) => w.utilizationPercent > 100).length,
    [kpis.teamWorkloads]
  );

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parts = name.trim().split(' ');
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@pwc-india-demo.in`,
      designation: designation.trim(),
      appRole,
      department,
      location: location.trim(),
      weeklyCapacityHours: Number(weeklyCapacity) || 40,
      avatarInitials: initials,
    };
    onAddTeamMember(newMember);
    setName('');
    setEmail('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Resource & Team Governance · Capacity & RBAC Access Control
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Team & Resource Capacity ({filteredWorkloads.length} Members)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Workload utilization is calculated deterministically from assigned active task hours divided by defined weekly capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs font-mono">
            Avg Utilization: <strong className="text-slate-900">{avgUtilization}%</strong> · Overallocated:{' '}
            <strong className="text-red-700">{overallocatedCount}</strong>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partner, director, location, project code..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as Department | 'All')}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All Advisory Practices</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserAppRole | 'All')}
          className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
        >
          <option value="All">All RBAC Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Project Manager">Project Manager</option>
          <option value="Team Member">Team Member</option>
          <option value="Executive / Viewer">Executive / Viewer</option>
        </select>
      </div>

      {/* Team Capacity Cards & Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkloads.map((tm) => {
          const isOver = tm.utilizationPercent > 100;
          return (
            <div
              key={tm.id}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {tm.avatarUrl || tm.name.toLowerCase() === 'sopan shinde' ? (
                      <img
                        src={tm.avatarUrl || SOPAN_SHINDE_AVATAR_URL}
                        alt={tm.name}
                        className="w-10 h-10 rounded-md object-cover object-top border border-slate-300 shadow-2xs shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                        {tm.avatarInitials}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{tm.name}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1">{tm.designation}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      tm.appRole === 'Administrator'
                        ? 'bg-purple-100 text-purple-800'
                        : tm.appRole === 'Project Manager'
                        ? 'bg-blue-100 text-blue-800'
                        : tm.appRole === 'Team Member'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tm.appRole}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {tm.location}
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {tm.department} Practice
                  </span>
                </div>

                {/* Workload Bar */}
                <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">Workload Utilization:</span>
                    <span
                      className={`font-bold ${
                        isOver
                          ? 'text-red-700'
                          : tm.utilizationPercent >= 80
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {tm.utilizationPercent}% ({tm.allocatedWeeklyHours}h / {tm.weeklyCapacityHours}h)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOver
                          ? 'bg-red-600'
                          : tm.utilizationPercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, tm.utilizationPercent)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-600">
                    <div>
                      Projects: <strong className="text-slate-900">{tm.assignedProjectsCount}</strong>
                    </div>
                    <div>
                      Active Tasks: <strong className="text-slate-900">{tm.activeTasksCount}</strong>
                    </div>
                    <div>
                      Overdue:{' '}
                      <strong className={tm.overdueTasksCount > 0 ? 'text-red-700' : 'text-slate-900'}>
                        {tm.overdueTasksCount}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-600">
                  Assigned Engagements:{' '}
                  <span className="font-bold text-slate-900">
                    {tm.assignedProjectCodes.join(', ') || 'Advisory Pool'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Capacity (h/wk):</span>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={tm.weeklyCapacityHours}
                    onChange={(e) =>
                      onUpdateMemberCapacity(
                        tm.id,
                        Number(e.target.value) || 40,
                        tm.appRole
                      )
                    }
                    className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchRole(tm.appRole, tm.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 transition-colors cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  <span>Impersonate Role</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Advisory Team Member</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Devika Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="devika.kulkarni@pwc-india-demo.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Practice</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RBAC Role</label>
                  <select
                    value={appRole}
                    onChange={(e) => setAppRole(e.target.value as UserAppRole)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Executive / Viewer">Executive / Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Weekly Capacity (h)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={weeklyCapacity}
                    onChange={(e) => setWeeklyCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D04A02] text-white font-semibold rounded cursor-pointer"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
