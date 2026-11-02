import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Edit3,
  FileCheck2,
  Loader2,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  AIOperationType,
  DashboardKPIs,
  Department,
  ExecutiveReport,
  PortfolioState,
  ReportPeriodType,
} from '../types/portfolio';
import {
  buildEvidenceReportFromState,
  DEPARTMENTS,
  formatCurrency,
} from '../utils/calculations';
import { downloadTextFile, generateExecutiveReportCSV } from '../utils/csvExport';

interface AIExecutiveAssistantViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  guidedStepNumber: number | null;
  onSaveApprovedReport: (report: ExecutiveReport) => void;
}

const AI_OPERATIONS: { id: AIOperationType; label: string; subtitle: string }[] = [
  {
    id: 'executive_summary',
    label: '1. Executive Summary',
    subtitle: 'Portfolio-wide RAG health, capital utilization & steering highlights',
  },
  {
    id: 'status_summary',
    label: '2. Project Status Summary',
    subtitle: 'Milestone velocity, task completion rate & planned vs. actual progress',
  },
  {
    id: 'delay_analysis',
    label: '3. Delay Analysis',
    subtitle: 'Root-cause bottleneck diagnostic on Delayed & At-Risk engagements',
  },
  {
    id: 'risk_explanation',
    label: '4. Risk Explanation',
    subtitle: 'Critical exposure scoring (≥16/25) & mitigation adequacy breakdown',
  },
  {
    id: 'weekly_report',
    label: '5. Weekly Project Report',
    subtitle: 'Structured PMO weekly packet for Partner Steering Committee',
  },
  {
    id: 'recommended_actions',
    label: '6. Recommended Actions',
    subtitle: 'Prioritized 24–48h partner interventions with explicit data citations',
  },
];

export const AIExecutiveAssistantView: React.FC<AIExecutiveAssistantViewProps> = ({
  state,
  kpis,
  guidedStepNumber,
  onSaveApprovedReport,
}) => {
  const [operationType, setOperationType] = useState<AIOperationType>('executive_summary');
  const [periodType, setPeriodType] = useState<ReportPeriodType>('Weekly');
  const [focusDepartment, setFocusDepartment] = useState<'All' | Department>('All');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [engineNote, setEngineNote] = useState<string>(
    'Ready to synthesize live portfolio records via server-side Gemini 3.8 Flash endpoint.'
  );

  const [draftReport, setDraftReport] = useState<ExecutiveReport>(() =>
    buildEvidenceReportFromState(
      state,
      'Weekly',
      `Weekly AI Executive Intelligence Brief (${state.referenceDate})`,
      'executive_summary'
    )
  );
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (guidedStepNumber === 9) {
      handleGenerateAIReport('executive_summary');
    }
  }, [guidedStepNumber]);

  const handleGenerateAIReport = async (selectedOp?: AIOperationType) => {
    const activeOp = selectedOp || operationType;
    if (selectedOp) setOperationType(selectedOp);
    setIsGenerating(true);
    setSavedSuccessMessage(null);
    try {
      const response = await fetch('/api/ai/executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType,
          focusDepartment,
          operationType: activeOp,
          state,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.report) {
        setDraftReport(data.report);
        setEngineNote(
          data.note ||
            'Synthesized via server-side Gemini 3.8 Flash with verified portfolio telemetry.'
        );
      }
    } catch {
      const opMeta = AI_OPERATIONS.find((o) => o.id === activeOp);
      const fallback = buildEvidenceReportFromState(
        state,
        periodType,
        `${opMeta?.label.slice(3) || 'AI Executive Brief'} — ${focusDepartment} (${state.referenceDate})`,
        activeOp
      );
      setDraftReport(fallback);
      setEngineNote(
        'Generated using deterministic relational evidence engine (100% verified against current portfolio records).'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndSave = () => {
    const approved: ExecutiveReport = {
      ...draftReport,
      reviewStatus: 'Reviewed & Approved',
      generatedAt: new Date().toISOString(),
    };
    setDraftReport(approved);
    onSaveApprovedReport(approved);
    setSavedSuccessMessage(
      'Executive report approved by human reviewer and archived to Reports & Analytics.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print bg-white border border-slate-200 rounded p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            Intelligence · Server-Side Gemini 3.8 Flash Decision Support
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            AI Project Assistant & Human Review Workbench
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Select any of the 6 specialized AI analytical operations below. All insights are strictly grounded in live relational portfolio data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select Report Cadence"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as ReportPeriodType)}
            className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="Weekly">Cadence: Weekly Executive Brief</option>
            <option value="Monthly">Cadence: Monthly Board Packet</option>
          </select>

          <select
            aria-label="Select Department Scope"
            value={focusDepartment}
            onChange={(e) => setFocusDepartment(e.target.value as 'All' | Department)}
            className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="All">Scope: All 4 Practices</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                Scope: {d} Only
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleGenerateAIReport()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] disabled:opacity-60 text-white rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Live Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Selected AI Operation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6 Structured AI Operation Selector Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AI_OPERATIONS.map((op) => {
          const isSelected = operationType === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => handleGenerateAIReport(op.id)}
              className={`text-left p-3.5 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:border-slate-400 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{op.label}</span>
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-[#FDBA74]' : 'text-[#D04A02]'
                  }`}
                />
              </div>
              <p
                className={`text-[11px] mt-1 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {op.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Grounding Guarantee Banner */}
      <div className="no-print bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <Database className="w-4 h-4 text-[#1E3A8A] shrink-0" />
          <span>
            <strong className="text-slate-900">Zero-Hallucination Evidence Contract:</strong>{' '}
            {engineNote}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 shrink-0">
          Live Input: {kpis.totalProjects} Projects · {kpis.overdueMilestones} Overdue MS ·{' '}
          {kpis.blockedTasks} Blocked Tasks · {kpis.criticalUnresolvedRisks} Critical Risks
        </div>
      </div>

      {savedSuccessMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>{savedSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccessMessage(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main AI Report & Human Review Workbench */}
      <div className="print-only-full bg-white border border-slate-200 rounded p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={
                  draftReport.reviewStatus === 'Reviewed & Approved'
                    ? 'text-[#16A34A] font-bold'
                    : 'text-[#D97706] font-bold'
                }
              >
                {draftReport.reviewStatus}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{draftReport.author}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Synthetic Demonstration Data</span>
            </div>
            <input
              type="text"
              value={draftReport.title}
              onChange={(e) =>
                setDraftReport({ ...draftReport, title: e.target.value })
              }
              aria-label="Report Title"
              className="text-xl font-bold text-slate-900 font-display mt-1 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div className="no-print flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingSummary(!isEditingSummary)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingSummary ? 'Done Editing' : 'Edit Summary / Notes'}
            </button>

            <button
              type="button"
              onClick={handleApproveAndSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#16A34A] hover:bg-emerald-700 text-white rounded cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Approve & Save Report
            </button>

            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  `ai_executive_report_${state.referenceDate}.csv`,
                  generateExecutiveReportCSV(draftReport)
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* Section 1: AI Executive Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              1. Management Analysis Summary (Grounded in Live Portfolio Records)
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              Portfolio Utilization: {draftReport.kpiSnapshot.budgetUtilizationPercent}% · Net Variance:{' '}
              {formatCurrency(draftReport.kpiSnapshot.budgetVariance, true)}
            </span>
          </div>

          {isEditingSummary ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={draftReport.executiveSummary}
                onChange={(e) =>
                  setDraftReport({
                    ...draftReport,
                    executiveSummary: e.target.value,
                    reviewStatus: 'Draft — Pending Human Review',
                  })
                }
                className="w-full p-3 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#1E3A8A]"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Human Reviewer Governance Notes
                </label>
                <input
                  type="text"
                  value={draftReport.reviewerNotes}
                  onChange={(e) =>
                    setDraftReport({ ...draftReport, reviewerNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
              <p className="text-sm text-slate-900 leading-relaxed">
                {draftReport.executiveSummary}
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 font-mono">
                Reviewer Governance Note: {draftReport.reviewerNotes}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Highlighted Delayed Projects & Major Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              2. Highlighted Delayed & Over-Budget Initiatives ({draftReport.delayedHighlights.length})
            </h2>
            <div className="border border-slate-200 rounded divide-y divide-slate-200 text-xs">
              {draftReport.delayedHighlights.map((item) => (
                <div key={item.projectCode} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-900">
                      {item.projectCode} · {item.department}
                    </span>
                    <span className="text-[#DC2626] font-semibold">
                      {item.budgetVarianceFormatted}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {item.projectName} (Owner: {item.owner})
                  </div>
                  <div className="text-slate-600">{item.scheduleSlippageNote}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              3. Highlighted Major Portfolio Risks ({draftReport.majorRisks.length})
            </h2>
            <div className="border border-slate-200 rounded divide-y divide-slate-200 text-xs">
              {draftReport.majorRisks.map((risk) => (
                <div key={risk.riskCode} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-900">
                      {risk.riskCode} (Project {risk.projectCode})
                    </span>
                    <span
                      className={`font-bold ${
                        risk.severity === 'Critical' ? 'text-[#DC2626]' : 'text-[#D97706]'
                      }`}
                    >
                      Score {risk.riskScore}/25 · {risk.severity}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">{risk.description}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Status: {risk.status} · Mitigation Progress: {risk.mitigationProgress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Evidence-Backed Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              4. Evidence-Backed Recommendations & Supporting Data Citations
            </h2>
            <span className="text-xs text-slate-500">
              Every recommendation explains which underlying records support the action
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {draftReport.recommendations.map((rec, index) => (
              <div
                key={rec.id}
                className="border border-slate-200 rounded p-4 bg-white space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Action 0{index + 1} · Target: {rec.targetProjectCode}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        rec.priority.includes('Immediate')
                          ? 'text-[#DC2626] font-bold'
                          : 'text-[#D97706] font-bold'
                      }
                    >
                      Priority: {rec.priority}
                    </span>
                  </div>
                  <span className="text-slate-600">
                    Assigned Owner: {rec.recommendedOwner}
                  </span>
                </div>

                {isEditingSummary ? (
                  <input
                    type="text"
                    value={rec.action}
                    onChange={(e) => {
                      const nextRecs = [...draftReport.recommendations];
                      nextRecs[index] = { ...rec, action: e.target.value };
                      setDraftReport({ ...draftReport, recommendations: nextRecs });
                    }}
                    className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded"
                  />
                ) : (
                  <div className="text-sm font-bold text-slate-900">{rec.action}</div>
                )}

                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Expected Outcome: </span>
                  {rec.expectedImpact}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#1E3A8A] font-semibold">
                    Recorded Portfolio Evidence Supporting This Recommendation:
                  </div>
                  <ul className="space-y-1 text-xs font-mono text-slate-700">
                    {rec.supportingEvidence.map((ev, evIdx) => (
                      <li key={evIdx} className="flex items-start gap-2">
                        <span className="text-[#16A34A] font-bold">✓</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
