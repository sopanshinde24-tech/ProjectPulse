import React, { useState } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
} from 'lucide-react';
import {
  DashboardKPIs,
  Department,
  ExecutiveReport,
  PortfolioState,
  ReportCategoryType,
  ReportPeriodType,
} from '../types/portfolio';
import {
  buildEvidenceReportFromState,
  DEPARTMENTS,
  formatCurrency,
} from '../utils/calculations';
import { downloadTextFile, generateExecutiveReportCSV } from '../utils/csvExport';

interface ManagementReportingViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  onSaveReport: (report: ExecutiveReport) => void;
}

const REPORT_CATEGORIES: ReportCategoryType[] = [
  'Portfolio Status Report',
  'Project Progress Report',
  'Milestone Report',
  'Risk Register Report',
  'Budget Variance Report',
  'Task Completion Report',
  'Department Performance Report',
  'Weekly Executive Summary',
];

export const ManagementReportingView: React.FC<ManagementReportingViewProps> = ({
  state,
  kpis,
  onSaveReport,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(
    state.reports[0]?.id || ''
  );
  const [periodTypeFilter, setPeriodTypeFilter] = useState<'All' | ReportPeriodType>('All');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategoryType>(
    'Portfolio Status Report'
  );
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');

  const filteredReports = state.reports.filter(
    (r) => periodTypeFilter === 'All' || r.periodType === periodTypeFilter
  );

  const activeReport =
    state.reports.find((r) => r.id === selectedReportId) ||
    filteredReports[0] ||
    state.reports[0];

  const handleGenerateStandardReport = (
    period: ReportPeriodType,
    category: ReportCategoryType = selectedCategory
  ) => {
    const scopeLabel = deptFilter === 'All' ? 'All Practices' : `${deptFilter} Practice`;
    const newReport = buildEvidenceReportFromState(
      state,
      period,
      `${category} — ${scopeLabel} (${state.referenceDate})`,
      category === 'Risk Register Report'
        ? 'risk_explanation'
        : category === 'Project Progress Report' || category === 'Task Completion Report'
        ? 'status_summary'
        : 'executive_summary',
      category
    );
    const approvedReport: ExecutiveReport = {
      ...newReport,
      reportCategory: category,
      reviewStatus: 'Reviewed & Approved',
      reviewerNotes: `Generated ${category} (${scopeLabel}) from live relational portfolio snapshot (${kpis.totalProjects} projects, ${formatCurrency(kpis.totalAllocatedBudget)} allocated).`,
    };
    onSaveReport(approvedReport);
    setSelectedReportId(approvedReport.id);
  };

  const handlePrintPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & 8-Category Report Generator Bar */}
      <div className="no-print bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Intelligence · Executive Reporting & Governance Archive
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Reports & Analytics ({state.reports.length} Saved Packets)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Generate any of the 8 enterprise report types with practice filtering, and export to CSV or print-ready PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ReportCategoryType)}
            className="px-3 py-2 border border-slate-300 rounded bg-white font-semibold text-slate-900"
          >
            {REPORT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as Department | 'All')}
            className="px-2.5 py-2 border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="All">All Practices</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleGenerateStandardReport('Weekly', selectedCategory)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white rounded cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Weekly Packet
          </button>
          <button
            type="button"
            onClick={() => handleGenerateStandardReport('Monthly', selectedCategory)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Monthly Packet
          </button>
        </div>
      </div>

      {/* Main Split: Report Selector Sidebar (4 cols) + Full Report Document (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="no-print lg:col-span-4 bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Saved Reports ({filteredReports.length})
            </h2>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded text-xs">
              {(['All', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPeriodTypeFilter(tab)}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                    periodTypeFilter === tab
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredReports.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
                    <span>{rep.reportCategory || `${rep.periodType} Report`}</span>
                    <span>{rep.generatedAt.slice(0, 10)}</span>
                  </div>
                  <div className="text-xs font-bold mt-1 line-clamp-2">{rep.title}</div>
                  <div className="text-[11px] mt-1.5 flex items-center justify-between opacity-85 font-mono">
                    <span>{rep.reviewStatus}</span>
                    <span>{rep.recommendations.length} actions</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Report Document View */}
        {activeReport ? (
          <div className="print-only-full lg:col-span-8 bg-white border border-slate-200 rounded p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="font-semibold text-[#1E3A8A]">
                    {activeReport.reportCategory || `${activeReport.periodType} Governance Packet`}
                  </span>
                  <span>·</span>
                  <span>Generated: {activeReport.generatedAt.slice(0, 10)}</span>
                  <span>·</span>
                  <span>Synthetic Demonstration Data</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1 font-display">
                  {activeReport.title}
                </h2>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span className="font-semibold text-slate-800">
                    {activeReport.reviewStatus}
                  </span>
                  <span>·</span>
                  <span>Author: {activeReport.author}</span>
                </div>
              </div>

              <div className="no-print flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      `${activeReport.periodType.toLowerCase()}_pmo_report_${activeReport.id}.csv`,
                      generateExecutiveReportCSV(activeReport)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Export / Print PDF
                </button>
              </div>
            </div>

            {/* 1. Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                1. Executive Portfolio Summary
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded p-4">
                {activeReport.executiveSummary}
              </p>
            </div>

            {/* 2. KPI Snapshot Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                2. Verified Portfolio Telemetry Snapshot
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Portfolio Initiatives</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {activeReport.kpiSnapshot.totalProjects} Total
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {activeReport.kpiSnapshot.activeProjects} Active ·{' '}
                    {activeReport.kpiSnapshot.delayedProjects} Delayed
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Health Distribution</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    G:{activeReport.kpiSnapshot.healthCounts?.Green ?? 6} · A:
                    {activeReport.kpiSnapshot.healthCounts?.Amber ?? 3} · R:
                    {activeReport.kpiSnapshot.healthCounts?.Red ?? 3}
                  </div>
                  <div className="text-[11px] text-slate-500">Green / Amber / Red</div>
                </div>

                <div className="border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Budget Utilization</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {activeReport.kpiSnapshot.budgetUtilizationPercent}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Variance: {formatCurrency(activeReport.kpiSnapshot.budgetVariance, true)}
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Milestones & Risks</div>
                  <div className="text-base font-bold font-mono text-[#DC2626] mt-0.5">
                    {activeReport.kpiSnapshot.overdueMilestonesCount} Overdue
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {activeReport.kpiSnapshot.criticalUnresolvedRisksCount} Critical Risks
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delayed & Attention-Required Projects */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                3. Delayed Projects, Overdue Milestones & Budget Variances
              </h3>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-500">
                      <th className="py-2 px-3">Project</th>
                      <th className="py-2 px-3">Dept · Owner</th>
                      <th className="py-2 px-3">Schedule & Milestone Slippage</th>
                      <th className="py-2 px-3 text-right">Budget Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeReport.delayedHighlights.map((d) => (
                      <tr key={d.projectCode}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {d.projectCode}
                          <div className="font-sans font-semibold text-slate-800">
                            {d.projectName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div className="font-medium text-slate-800">{d.department}</div>
                          <div>{d.owner}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{d.scheduleSlippageNote}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-semibold">
                          {d.budgetVarianceFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Unresolved Major Risks */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                4. Unresolved Major Risks
              </h3>
              <div className="border border-slate-200 rounded divide-y divide-slate-200 text-xs">
                {activeReport.majorRisks.map((r) => (
                  <div key={r.riskCode} className="p-3 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-mono text-[11px] text-slate-500">
                        <span className="font-bold text-slate-900">{r.riskCode}</span> · Project{' '}
                        {r.projectCode} · Status: {r.status} ({r.mitigationProgress}% mitigated)
                      </div>
                      <div className="text-slate-800 font-medium">{r.description}</div>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <div className="font-bold text-[#DC2626]">Score {r.riskScore}/25</div>
                      <div className="text-[11px] text-slate-500">{r.severity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Evidence-Backed Recommendations */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                5. Evidence-Based Follow-Up Actions
              </h3>
              <div className="space-y-3">
                {activeReport.recommendations.map((rec) => (
                  <div key={rec.id} className="border border-slate-200 rounded p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-[#1E3A8A]">
                        Priority: {rec.priority} · Target: {rec.targetProjectCode}
                      </span>
                      <span className="text-slate-600">
                        Action Owner: {rec.recommendedOwner}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{rec.action}</div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Expected Impact: </span>
                      {rec.expectedImpact}
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">
                        Supporting Portfolio Data Evidence:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {rec.supportingEvidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded p-10 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">Select or generate a Weekly or Monthly report to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
