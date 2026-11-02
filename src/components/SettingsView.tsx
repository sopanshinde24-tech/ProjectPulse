import React, { useState } from 'react';
import {
  Bell,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react';
import {
  ActiveModuleId,
  DashboardKPIs,
  PortfolioState,
  UserAppRole,
} from '../types/portfolio';
import { exportProjectsToCSV, triggerCSVDownload } from '../utils/csvExport';

interface SettingsViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  currentUserName: string;
  currentUserRole: UserAppRole;
  onSwitchUserRole: (role: UserAppRole, userName: string) => void;
  onUpdateReferenceDate: (newRefDate: string) => void;
  onResetDemoData: () => void;
  onOpenQAVideoPackage: () => void;
  onNavigateModule: (mod: ActiveModuleId) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  kpis,
  currentUserName,
  currentUserRole,
  onSwitchUserRole,
  onUpdateReferenceDate,
  onResetDemoData,
  onOpenQAVideoPackage,
}) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'workspace' | 'rbac' | 'notifications' | 'data'
  >('profile');

  const [refDateInput, setRefDateInput] = useState(state.referenceDate);
  const [workspaceName, setWorkspaceName] = useState('PwC India Advisory · Enterprise PMO');
  const [fiscalCalendar, setFiscalCalendar] = useState('April – March (India FY26-27)');
  const [notifyOverdueMilestones, setNotifyOverdueMilestones] = useState(true);
  const [notifyCriticalRisks, setNotifyCriticalRisks] = useState(true);
  const [notifyBudgetOverruns, setNotifyBudgetOverruns] = useState(true);

  const handleExportFullJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projectpulse_pwc_workspace_${state.referenceDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPortfolioCSV = () => {
    const csv = exportProjectsToCSV(state.projects, kpis.projectMetricsMap);
    triggerCSVDownload(`projectpulse_portfolio_${state.referenceDate}.csv`, csv);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Administration · Workspace Configuration, RBAC & Data Governance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Platform Settings & Governance
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure active user profile, role-based access control (RBAC), simulation reference date, and database exports.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQAVideoPackage}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Open Automated QA & Video Suite</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Left Sub-Nav */}
        <div className="bg-white border border-slate-200 rounded p-3 space-y-1 h-fit text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile & Active Persona</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('workspace')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold cursor-pointer ${
              activeSection === 'workspace'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Workspace & Reference Date</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('rbac')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold cursor-pointer ${
              activeSection === 'rbac'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Team RBAC Permission Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold cursor-pointer ${
              activeSection === 'notifications'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alert & Notification Thresholds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('data')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded font-semibold cursor-pointer ${
              activeSection === 'data'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Management & Reset</span>
          </button>
        </div>

        {/* Settings Main Content */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded p-6">
          {activeSection === 'profile' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                Active User Profile & Role Switcher
              </h2>
              <p className="text-slate-600">
                Select any PwC India Advisory persona below to test role-based permissions and personalized views (such as <strong>My Projects</strong>).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(state.teamMembers || []).map((tm) => {
                  const isCurrent =
                    tm.name === currentUserName && tm.appRole === currentUserRole;
                  return (
                    <div
                      key={tm.id}
                      onClick={() => onSwitchUserRole(tm.appRole, tm.name)}
                      className={`p-3.5 rounded border cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-[#D04A02] bg-orange-50/40'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tm.name}</div>
                        <div className="text-[11px] text-slate-500">{tm.designation}</div>
                        <div className="text-[10px] font-mono text-slate-600 mt-1">
                          Role: <strong>{tm.appRole}</strong> · {tm.department}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-[#D04A02] text-white font-mono text-[10px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'workspace' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                Workspace & Simulation Reference Date
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Organization Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fiscal Reporting Calendar
                  </label>
                  <input
                    type="text"
                    value={fiscalCalendar}
                    onChange={(e) => setFiscalCalendar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-900">
                  Portfolio Reference Date (Overdue Milestone & Task Evaluation Anchor)
                </label>
                <p className="text-slate-600">
                  All milestone and task overdue calculations compare planned due dates against this reference date (default: <code>2026-11-02</code>).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="date"
                    value={refDateInput}
                    onChange={(e) => setRefDateInput(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateReferenceDate(refDateInput)}
                    className="px-4 py-1.5 rounded bg-[#D04A02] text-white font-semibold cursor-pointer"
                  >
                    Apply Reference Date
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rbac' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                Role-Based Access Control (RBAC) Matrix
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-600">
                    <th className="py-2.5 px-3">Capability</th>
                    <th className="py-2.5 px-3">Administrator</th>
                    <th className="py-2.5 px-3">Project Manager</th>
                    <th className="py-2.5 px-3">Team Member</th>
                    <th className="py-2.5 px-3">Executive / Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">View Executive Dashboards & Reports</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Update Tasks, Milestones & Issues</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-red-600 font-mono">Read-Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Create/Delete Projects & Edit Budgets</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-amber-700 font-mono">Restricted</td>
                    <td className="py-2.5 px-3 text-red-600 font-mono">Read-Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Reset Workspace Database</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-red-600 font-mono">Denied</td>
                    <td className="py-2.5 px-3 text-red-600 font-mono">Denied</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                Automated Governance Alert Rules
              </h2>
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Overdue Milestone Alerts</div>
                  <div className="text-slate-500">
                    Trigger top-bar notification when a milestone passes its planned completion date.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOverdueMilestones}
                  onChange={(e) => setNotifyOverdueMilestones(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Critical Risk Escalations (Score ≥ 16/25)</div>
                  <div className="text-slate-500">
                    Flag unresolved risks with Probability × Impact score of 16 or higher.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCriticalRisks}
                  onChange={(e) => setNotifyCriticalRisks(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Budget Overrun Warnings (&gt; 100% Utilization)</div>
                  <div className="text-slate-500">
                    Alert PMO leadership when actual expenditure exceeds approved allocation.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBudgetOverruns}
                  onChange={(e) => setNotifyBudgetOverruns(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                Database Persistence, Export & Demo Reset
              </h2>
              <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">
                  Storage Engine Status:{' '}
                  <span className="font-mono text-emerald-700">
                    {state.storageMode === 'sqlite-server'
                      ? 'SQLite Relational Server (projectpulse.db)'
                      : 'Resilient Browser LocalStorage'}
                  </span>
                </div>
                <p className="text-slate-600">
                  Contains {state.projects.length} Projects, {state.milestones.length} Milestones, {(state.tasks || []).length} Tasks, {state.risks.length} Risks, and {(state.issues || []).length} Issues.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportFullJSON}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full Workspace JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPortfolioCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Portfolio CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Synthetic Demo Dataset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
