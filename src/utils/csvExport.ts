import {
  Department,
  ExecutiveReport,
  Milestone,
  PortfolioState,
  Project,
  ProjectStatus,
  RiskItem,
} from '../types/portfolio';
import { calculateBudgetMetrics, calculateRiskScore, formatCurrency, getRiskSeverity } from './calculations';

/**
 * Escapes a value for standard RFC-4180 CSV output.
 */
function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a text file (CSV, Markdown, SQL, SRT).
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a CSV string for the Project Portfolio.
 */
export function generateProjectsCSV(state: PortfolioState): string {
  const headers = [
    'Code',
    'Project Name',
    'Department',
    'Owner',
    'Owner Role',
    'Start Date',
    'End Date',
    'Allocated Budget (USD)',
    'Actual Spend (USD)',
    'Budget Variance (USD)',
    'Utilization (%)',
    'Status',
    'Progress (%)',
    'Strategic Objective',
    'Synthetic Data',
  ];

  const rows = state.projects.map((p) => {
    const bm = calculateBudgetMetrics(p.allocatedBudget, p.actualSpend);
    return [
      p.code,
      p.name,
      p.department,
      p.owner,
      p.ownerRole,
      p.startDate,
      p.endDate,
      p.allocatedBudget,
      p.actualSpend,
      bm.variance,
      bm.utilizationPercent,
      p.status,
      p.progress,
      p.strategicObjective,
      p.isSynthetic ? 'Yes (Synthetic Demo)' : 'No',
    ].map(escapeCSVField).join(',');
  });

  return [headers.map(escapeCSVField).join(','), ...rows].join('\n');
}

/**
 * Generates a CSV string for Milestones.
 */
export function generateMilestonesCSV(milestones: Milestone[], projects: Project[]): string {
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const headers = [
    'Milestone Code',
    'Project Code',
    'Project Name',
    'Milestone Title',
    'Owner',
    'Planned Date',
    'Actual Date',
    'Status',
    'Completion (%)',
    'Deliverable Notes',
  ];

  const rows = milestones.map((m) => {
    const p = projMap.get(m.projectId);
    return [
      m.code,
      p?.code || m.projectId,
      p?.name || '',
      m.title,
      m.owner,
      m.plannedDate,
      m.actualDate || 'Pending',
      m.status,
      m.completionPercent,
      m.deliverableNotes,
    ].map(escapeCSVField).join(',');
  });

  return [headers.map(escapeCSVField).join(','), ...rows].join('\n');
}

/**
 * Generates a CSV string for the Risk Register.
 */
export function generateRisksCSV(risks: RiskItem[], projects: Project[]): string {
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const headers = [
    'Risk Code',
    'Project Code',
    'Category',
    'Description',
    'Probability (1-5)',
    'Impact (1-5)',
    'Risk Score (1-25)',
    'Severity',
    'Owner',
    'Status',
    'Mitigation Progress (%)',
    'Mitigation Plan',
  ];

  const rows = risks.map((r) => {
    const p = projMap.get(r.projectId);
    const score = calculateRiskScore(r.probability, r.impact);
    return [
      r.code,
      p?.code || r.projectId,
      r.category,
      r.description,
      r.probability,
      r.impact,
      score,
      getRiskSeverity(score),
      r.owner,
      r.status,
      r.mitigationProgress,
      r.mitigationPlan,
    ].map(escapeCSVField).join(',');
  });

  return [headers.map(escapeCSVField).join(','), ...rows].join('\n');
}

/**
 * Generates a comprehensive CSV export for an Executive Report.
 */
export function generateExecutiveReportCSV(report: ExecutiveReport): string {
  const lines: string[] = [];
  lines.push(`"Report Title",${escapeCSVField(report.title)}`);
  lines.push(`"Period Type",${escapeCSVField(report.periodType)}`);
  lines.push(`"Generated At",${escapeCSVField(report.generatedAt)}`);
  lines.push(`"Author",${escapeCSVField(report.author)}`);
  lines.push(`"Review Status",${escapeCSVField(report.reviewStatus)}`);
  lines.push(`"Reviewer Notes",${escapeCSVField(report.reviewerNotes)}`);
  lines.push(`"Executive Summary",${escapeCSVField(report.executiveSummary)}`);
  lines.push('');

  lines.push('"--- PORTFOLIO KPI SNAPSHOT ---"');
  lines.push('"Metric","Value"');
  lines.push(`"Total Projects",${report.kpiSnapshot.totalProjects}`);
  lines.push(`"Active Projects",${report.kpiSnapshot.activeProjects}`);
  lines.push(`"Completed Projects",${report.kpiSnapshot.completedProjects}`);
  lines.push(`"Delayed Projects",${report.kpiSnapshot.delayedProjects}`);
  lines.push(`"At Risk Projects",${report.kpiSnapshot.atRiskProjects}`);
  lines.push(`"Total Allocated Budget",${escapeCSVField(formatCurrency(report.kpiSnapshot.totalAllocatedBudget))}`);
  lines.push(`"Total Actual Spend",${escapeCSVField(formatCurrency(report.kpiSnapshot.totalActualSpend))}`);
  lines.push(`"Net Budget Variance",${escapeCSVField(formatCurrency(report.kpiSnapshot.budgetVariance, true))}`);
  lines.push(`"Budget Utilization (%)",${report.kpiSnapshot.budgetUtilizationPercent}%`);
  lines.push(`"Overdue Milestones",${report.kpiSnapshot.overdueMilestonesCount}`);
  lines.push(`"Critical Unresolved Risks",${report.kpiSnapshot.criticalUnresolvedRisksCount}`);
  lines.push(
    `"Health Distribution","Green: ${report.kpiSnapshot.healthCounts.Green} | Amber: ${report.kpiSnapshot.healthCounts.Amber} | Red: ${report.kpiSnapshot.healthCounts.Red}"`
  );
  lines.push('');

  lines.push('"--- DELAYED & ATTENTION-REQUIRED INITIATIVES ---"');
  lines.push('"Project Code","Project Name","Department","Owner","Schedule Slippage","Budget Variance","Overdue Milestones"');
  for (const d of report.delayedHighlights) {
    lines.push(
      [
        d.projectCode,
        d.projectName,
        d.department,
        d.owner,
        d.scheduleSlippageNote,
        d.budgetVarianceFormatted,
        d.overdueMilestoneCount,
      ]
        .map(escapeCSVField)
        .join(',')
    );
  }
  lines.push('');

  lines.push('"--- MAJOR PORTFOLIO RISKS ---"');
  lines.push('"Risk Code","Project Code","Severity","Risk Score","Status","Mitigation (%)","Description"');
  for (const r of report.majorRisks) {
    lines.push(
      [
        r.riskCode,
        r.projectCode,
        r.severity,
        r.riskScore,
        r.status,
        `${r.mitigationProgress}%`,
        r.description,
      ]
        .map(escapeCSVField)
        .join(',')
    );
  }
  lines.push('');

  lines.push('"--- EVIDENCE-BASED RECOMMENDATIONS ---"');
  lines.push('"Priority","Target Project","Owner","Recommended Action","Expected Impact","Supporting Evidence"');
  for (const rec of report.recommendations) {
    lines.push(
      [
        rec.priority,
        rec.targetProjectCode,
        rec.recommendedOwner,
        rec.action,
        rec.expectedImpact,
        rec.supportingEvidence.join(' | '),
      ]
        .map(escapeCSVField)
        .join(',')
    );
  }

  return lines.join('\n');
}

/**
 * Parses a CSV string into Project objects for CSV Import.
 */
export function parseProjectsFromCSV(csvText: string): Partial<Project>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const validDepts: Department[] = ['Technology', 'Finance', 'Operations', 'Marketing'];
  const validStatuses: ProjectStatus[] = ['Active', 'Completed', 'Delayed', 'At Risk'];

  const imported: Partial<Project>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 3) continue;

    const getCol = (keywords: string[], fallbackIdx: number): string => {
      const idx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
      return idx >= 0 ? cols[idx] || '' : cols[fallbackIdx] || '';
    };

    const rawDept = getCol(['department', 'dept'], 2);
    const department: Department = validDepts.find(
      (d) => d.toLowerCase() === rawDept.toLowerCase()
    ) || 'Technology';

    const rawStatus = getCol(['status'], 11);
    const status: ProjectStatus = validStatuses.find(
      (s) => s.toLowerCase() === rawStatus.toLowerCase()
    ) || 'Active';

    const allocatedBudget = Number(getCol(['allocated', 'budget'], 7).replace(/[^0-9.-]/g, '')) || 500000;
    const actualSpend = Number(getCol(['actual', 'spend'], 8).replace(/[^0-9.-]/g, '')) || 250000;
    const progress = Math.min(100, Math.max(0, Number(getCol(['progress'], 12).replace(/[^0-9]/g, '')) || 50));

    imported.push({
      code: getCol(['code'], 0) || `PRJ-${200 + i}`,
      name: getCol(['name', 'title'], 1) || `Imported Initiative ${i}`,
      department,
      owner: getCol(['owner'], 3) || 'Alex Morgan',
      ownerRole: getCol(['role'], 4) || 'Program Lead',
      startDate: getCol(['start'], 5) || '2026-06-01',
      endDate: getCol(['end'], 6) || '2026-12-31',
      allocatedBudget,
      actualSpend,
      status,
      progress,
      strategicObjective: getCol(['objective', 'strategic'], 13) || 'Imported via CSV portfolio batch.',
      description: 'Imported synthetic demonstration project record.',
      isSynthetic: true,
    });
  }

  return imported;
}

/**
 * Exports a filtered list of Project records to RFC-4180 CSV format.
 */
export function exportProjectsToCSV(projects: Project[], _metricsMap?: unknown): string {
  const headers = [
    'Code',
    'Project Name',
    'Department',
    'Owner',
    'Owner Role',
    'Start Date',
    'End Date',
    'Allocated Budget (USD)',
    'Actual Spend (USD)',
    'Budget Variance (USD)',
    'Utilization (%)',
    'Status',
    'Progress (%)',
    'Strategic Objective',
    'Synthetic Data',
  ];

  const rows = projects.map((p) => {
    const bm = calculateBudgetMetrics(p.allocatedBudget, p.actualSpend);
    return [
      p.code,
      p.name,
      p.department,
      p.owner,
      p.ownerRole,
      p.startDate,
      p.endDate,
      p.allocatedBudget,
      p.actualSpend,
      bm.variance,
      bm.utilizationPercent,
      p.status,
      p.progress,
      p.strategicObjective,
      p.isSynthetic ? 'Yes (Synthetic Demo)' : 'No',
    ]
      .map(escapeCSVField)
      .join(',');
  });

  return [headers.map(escapeCSVField).join(','), ...rows].join('\n');
}

/**
 * Alias for downloadTextFile for CSV exports.
 */
export function triggerCSVDownload(filename: string, content: string): void {
  downloadTextFile(filename, content, 'text/csv;charset=utf-8;');
}

/**
 * Alias for parseProjectsFromCSV.
 */
export function parseProjectsCSV(csvText: string): Partial<Project>[] {
  return parseProjectsFromCSV(csvText);
}

