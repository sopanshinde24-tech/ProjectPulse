import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  Download,
  Edit3,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  DashboardKPIs,
  Department,
  PortfolioState,
  Project,
} from '../types/portfolio';
import {
  calculateBudgetMetrics,
  DEPARTMENTS,
  formatCurrency,
} from '../utils/calculations';
import { downloadTextFile, generateProjectsCSV } from '../utils/csvExport';

interface BudgetMonitoringViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  guidedStepNumber: number | null;
  onInspectProject: (project: Project) => void;
  onUpdateProjectBudget: (
    projectId: string,
    allocatedBudget: number,
    actualSpend: number
  ) => void;
}

export const BudgetMonitoringView: React.FC<BudgetMonitoringViewProps> = ({
  state,
  kpis,
  guidedStepNumber,
  onInspectProject,
  onUpdateProjectBudget,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'All'>('All');
  const [overBudgetOnly, setOverBudgetOnly] = useState<boolean>(false);
  const [editingBudgetProject, setEditingBudgetProject] = useState<Project | null>(null);
  const [editAlloc, setEditAlloc] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);

  const filteredProjects = useMemo(() => {
    return state.projects
      .filter((p) => {
        if (departmentFilter !== 'All' && p.department !== departmentFilter) return false;
        const bm = calculateBudgetMetrics(p.allocatedBudget, p.actualSpend);
        if (overBudgetOnly && !bm.isOverBudget) return false;
        return true;
      })
      .sort((a, b) => {
        const va = a.actualSpend - a.allocatedBudget;
        const vb = b.actualSpend - b.allocatedBudget;
        return vb - va;
      });
  }, [state.projects, departmentFilter, overBudgetOnly]);

  const handleOpenBudgetModal = (p: Project) => {
    setEditingBudgetProject(p);
    setEditAlloc(p.allocatedBudget);
    setEditActual(p.actualSpend);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetProject) return;
    onUpdateProjectBudget(
      editingBudgetProject.id,
      Math.max(0, editAlloc),
      Math.max(0, editActual)
    );
    setEditingBudgetProject(null);
  };

  const maxMonthlySpend = useMemo(() => {
    return Math.max(
      1,
      ...kpis.monthlyPortfolioTrend.map((m) => Math.max(m.planned, m.actual))
    );
  }, [kpis.monthlyPortfolioTrend]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Governance · Financial Control, Variance & Monthly Expenditure Telemetry
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Budget & Financial Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Monitor Approved Budget, Actual Spend, Remaining Balance, Planned Spend, and Monthly Expenditure Trends across all 12 engagements.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              `projectpulse_budget_ledger_${state.referenceDate}.csv`,
              generateProjectsCSV(state)
            )
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Export Financial Ledger CSV
        </button>
      </div>

      {/* Top Financial KPIs (5 Cards including Remaining Budget & Planned Spend) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Approved Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(kpis.totalAllocatedBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Planned To-Date: {formatCurrency(kpis.totalPlannedSpend)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Actual Spend</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatCurrency(kpis.totalActualSpend)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {kpis.budgetUtilizationPercent}% portfolio utilization
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Remaining Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#1E3A8A] mt-1">
            {formatCurrency(kpis.totalRemainingBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Formula: Approved − Actual Spend
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Budget Variance</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              kpis.totalBudgetVariance > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
            }`}
          >
            {formatCurrency(kpis.totalBudgetVariance, true)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Formula: Actual Spend − Approved Budget
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs text-slate-500">Projects Exceeding Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#DC2626] mt-1">
            {kpis.overBudgetProjectsCount}{' '}
            <span className="text-xs font-normal text-slate-500">
              of {kpis.totalProjects}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Initiatives with utilization &gt; 100%
          </div>
        </div>
      </div>

      {/* Monthly Expenditure Trends & Department Budget Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Expenditure Trends Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D04A02]" />
              <span>Monthly Expenditure Trend (May – Oct 2026)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Planned monthly burn versus actual recorded expenditure across all practices
            </p>
          </div>

          <div className="space-y-3">
            {kpis.monthlyPortfolioTrend.map((pt) => {
              const plannedW = Math.round((pt.planned / maxMonthlySpend) * 100);
              const actualW = Math.round((pt.actual / maxMonthlySpend) * 100);
              const isOver = pt.actual > pt.planned;
              return (
                <div key={pt.month} className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{pt.month} 2026</span>
                    <span>
                      Actual: <strong>{formatCurrency(pt.actual)}</strong> / Plan:{' '}
                      <span className="text-slate-500">{formatCurrency(pt.planned)}</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div
                        className="h-full bg-slate-400"
                        style={{ width: `${plannedW}%` }}
                        title={`Planned: ${formatCurrency(pt.planned)}`}
                      />
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div
                        className={`h-full ${isOver ? 'bg-red-600' : 'bg-[#1E3A8A]'}`}
                        style={{ width: `${actualW}%` }}
                        title={`Actual: ${formatCurrency(pt.actual)}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department-Wise Budget Analysis Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
                <span>Department-Wise Budget Analysis</span>
              </h2>
              <p className="text-xs text-slate-500">
                Click any row to filter the project expenditure ledger below
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Department</th>
                  <th className="py-2.5 px-2 text-right">Approved</th>
                  <th className="py-2.5 px-2 text-right">Actual</th>
                  <th className="py-2.5 px-2 text-right">Remaining</th>
                  <th className="py-2.5 px-2 text-right">Variance</th>
                  <th className="py-2.5 pl-2 text-right">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {kpis.departmentPerformance.map((dept) => {
                  const isOver = dept.variance > 0;
                  return (
                    <tr
                      key={dept.department}
                      onClick={() =>
                        setDepartmentFilter(
                          departmentFilter === dept.department ? 'All' : dept.department
                        )
                      }
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 pr-3 font-semibold text-slate-900">
                        {dept.department} ({dept.projectCount})
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-800">
                        {formatCurrency(dept.allocatedBudget)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(dept.actualSpend)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(dept.remainingBudget)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-mono tabular-nums font-bold ${
                          isOver ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}
                      >
                        {formatCurrency(dept.variance, true)}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            isOver ? 'text-[#DC2626]' : 'text-slate-900'
                          }`}
                        >
                          {dept.utilizationPercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project-Level Expenditure & Variance Ledger */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-700" />
              <span>
                Project-Level Expenditure & Variance Ledger ({filteredProjects.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by budget variance descending to surface budget overruns immediately
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Budget Ledger by Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as Department | 'All')}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOverBudgetOnly(!overBudgetOnly)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
                overBudgetOnly
                  ? 'bg-red-50 border-red-300 text-[#DC2626] font-semibold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Exceeding Budget Only ({kpis.overBudgetProjectsCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-2.5 pr-3">Code & Project Name</th>
                <th className="py-2.5 px-2">Department · Owner</th>
                <th className="py-2.5 px-2 text-right">Approved Budget</th>
                <th className="py-2.5 px-2 text-right">Actual Spend</th>
                <th className="py-2.5 px-2 text-right">Remaining</th>
                <th className="py-2.5 px-2 text-right">Variance ($)</th>
                <th className="py-2.5 px-2 text-right">Utilization (%)</th>
                <th className="py-2.5 px-2">Financial Status</th>
                <th className="py-2.5 pl-2 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProjects.map((p) => {
                const bm = calculateBudgetMetrics(p.allocatedBudget, p.actualSpend, p.plannedSpend);
                const isDemoFocus =
                  guidedStepNumber === 5 && p.code === 'PRJ-102';

                return (
                  <tr
                    key={p.id}
                    onClick={() => onInspectProject(p)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isDemoFocus ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-600' : ''
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <div className="font-mono font-bold text-slate-900">{p.code}</div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      <div className="font-medium text-slate-800">{p.department}</div>
                      <div>{p.owner}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(p.allocatedBudget)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(p.actualSpend)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(bm.remainingBudget)}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono tabular-nums font-bold ${
                        bm.isOverBudget ? 'text-[#DC2626]' : 'text-[#16A34A]'
                      }`}
                    >
                      {formatCurrency(bm.variance, true)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums">
                      <div
                        className={`font-bold ${
                          bm.isOverBudget ? 'text-[#DC2626]' : 'text-slate-900'
                        }`}
                      >
                        {bm.utilizationPercent}%
                      </div>
                      <div className="w-16 ml-auto h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                        <div
                          style={{ width: `${Math.min(100, bm.utilizationPercent)}%` }}
                          className={`h-full ${
                            bm.isOverBudget ? 'bg-[#DC2626]' : 'bg-[#1E3A8A]'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono">
                      {bm.isOverBudget ? (
                        <span className="text-[#DC2626] font-bold inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Exceeds Budget (+{bm.variancePercent}%)
                        </span>
                      ) : (
                        <span className="text-[#16A34A] font-semibold">
                          Within Allocation ({bm.variancePercent}%)
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 pl-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenBudgetModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Update Spend
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Budget Modal */}
      {editingBudgetProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Adjust Financial Telemetry · {editingBudgetProject.code}
              </h2>
              <button
                type="button"
                onClick={() => setEditingBudgetProject(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div className="text-xs font-semibold text-slate-800">
                {editingBudgetProject.name} ({editingBudgetProject.department})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Budget (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={editAlloc}
                  onChange={(e) => setEditAlloc(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Expenditure (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={editActual}
                  onChange={(e) => setEditActual(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Preview Remaining:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(editAlloc - editActual)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preview Variance:</span>
                  <span
                    className={`font-bold ${
                      editActual > editAlloc ? 'text-[#DC2626]' : 'text-[#16A34A]'
                    }`}
                  >
                    {formatCurrency(editActual - editAlloc, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preview Utilization:</span>
                  <span className="font-bold text-slate-900">
                    {editAlloc > 0 ? ((editActual / editAlloc) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBudgetProject(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  Save Financial Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
