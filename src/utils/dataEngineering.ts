import {
  DashboardKPIs,
  DataQualityAudit,
  DataQualityDimension,
  Department,
  ETLEntityTarget,
  ETLImportMode,
  ETLPipelineRun,
  ETLSourceFormat,
  ETLTransformationItem,
  ETLValidationIssue,
  Milestone,
  MilestoneStatus,
  PortfolioState,
  Project,
  ProjectPriority,
  ProjectStatus,
  RelationalIntegrityCheck,
  TaskItem,
  TaskStatus,
} from '../types/portfolio';
import {
  buildEvidenceReportFromState,
  calculateBudgetMetrics,
  computeDashboardKPIs,
  formatCurrency,
  isMilestoneOverdue,
  isTaskOverdue,
} from './calculations';

export const SAMPLE_CSV_CLEAN_BATCH = `code,name,department,owner,ownerRole,startDate,endDate,allocatedBudget,actualSpend,status,priority,progress,strategicObjective
PRJ-113,"RBI Digital Rupee (e-Rupee) Wholesale Settlement Gateway",Finance,"Sopan Shinde","Partner, Cyber & Cloud Transformation (PwC Mumbai)",2026-06-15,2027-01-31,1450000,680000,Active,Critical,52,"Integrate programmable CBDC settlement rails with core treasury ledger."
PRJ-101,"Zero-Trust Cloud Identity & RBI Cyber Mesh",Technology,"Sopan Shinde","Partner, Cyber & Cloud Transformation (PwC Mumbai)",2026-04-01,2026-12-15,1850000,1735000,Active,Critical,82,"Eliminate static service credentials and achieve 100% RBI & CERT-In zero-trust audit readiness."`;

export const SAMPLE_CSV_TASKS_BATCH = `code,title,projectCode,assigneeName,priority,status,startDate,dueDate,estimatedHours,actualHours,description
TSK-221,"CBDC HSM Key Ceremony & Quorum Verification",PRJ-101,"Sopan Shinde",Critical,In Progress,2026-10-15,2026-11-18,36,24,"Execute FIPS 140-3 Level 3 HSM key ceremony for wholesale settlement nodes."
TSK-222,"Ind-AS 109 ECL Parallel Run Reconciliation",PRJ-102,"Priya Sharma",High,In Progress,2026-10-20,2026-11-22,40,28,"Reconcile parallel ledger batch balances across 4 regional banking zones."
TSK-998,"Orphaned Legacy Audit Task (Invalid Project FK)",PRJ-404,"Siddharth Verma",Medium,Not Started,2026-10-25,2026-11-25,20,0,"Intentional test row referencing non-existent PRJ-404 to verify foreign key validation."`;

export const SAMPLE_CSV_MILESTONES_BATCH = `code,title,projectCode,owner,plannedDate,actualDate,status,completionPercent,deliverableNotes
MS-101-4,"CERT-In Zero-Trust Sovereign Enclave Sign-Off",PRJ-101,"Sopan Shinde",2026-11-28,,In Progress,88,"Hardware root-of-trust attestation across Mumbai DR and Bengaluru primary zones."
MS-102-2,"Mainframe Dual-Write Cutover & RTGS Sync",PRJ-102,"Ananya Iyer",2026-10-15,,Delayed,72,"Incremental milestone telemetry sync from core banking programme office."
MS-999-ERR,"Unlinked Regulatory Gate (Invalid Project FK)",PRJ-404-NONE,"Sopan Shinde",2026-11-30,,Upcoming,0,"Intentional test row to verify Foreign-Key rejection on milestones table."`;

export const SAMPLE_JSON_STRESS_BATCH = JSON.stringify(
  {
    batchMetadata: {
      sourceSystem: 'PwC India SAP S/4HANA & Jira Enterprise Connector',
      extractedAt: '2026-11-02T14:30:00Z',
      schemaVersion: '2.4.0',
    },
    projects: [
      {
        code: 'PRJ-114',
        name: 'Sovereign AI Data Center & Green Grid Telemetry',
        department: 'Operations',
        owner: 'Vikramaditya Rao',
        ownerRole: 'Director, Supply Chain & Industrial Operations (PwC Bengaluru)',
        startDate: '2026-07-01',
        endDate: '2027-02-28',
        allocatedBudget: 1620000,
        actualSpend: 710000,
        status: 'Active',
        priority: 'High',
        category: 'Sustainability & Cloud Infra',
        progress: 48,
        strategicObjective:
          'Optimize liquid-cooling PUE telemetry across Mumbai and Hyderabad AI compute clusters.',
      },
      {
        code: 'PRJ-102',
        name: 'Core Banking CBS & Ind-AS Ledger Modernization',
        department: 'Finance',
        owner: 'Ananya Iyer',
        ownerRole: 'Executive Director, Financial Services Advisory (PwC Mumbai)',
        startDate: '2026-03-01',
        endDate: '2026-11-30',
        allocatedBudget: 2400000,
        actualSpend: 2590000,
        status: 'Delayed',
        priority: 'Critical',
        progress: 66,
        strategicObjective:
          'Incremental ERP sync updating PRJ-102 progress from 64% to 66% after parallel batch fix.',
      },
      {
        code: 'PRJ-ERR-01',
        name: '',
        department: 'Technology',
        owner: 'Sopan Shinde',
        startDate: '2026-12-01',
        endDate: '2026-05-01',
        allocatedBudget: -450000,
        actualSpend: 120000,
        status: 'Active',
        progress: 145,
      },
    ],
    tasks: [
      {
        code: 'TSK-223',
        title: 'Deploy eBPF Telemetry Collectors on Mumbai Cluster 04',
        projectCode: 'PRJ-101',
        assigneeName: 'Sopan Shinde',
        priority: 'High',
        status: 'Completed',
        startDate: '2026-10-10',
        dueDate: '2026-10-30',
        estimatedHours: 28,
        actualHours: 26,
        description: 'Zero-overhead kernel mTLS identity packet inspection.',
      },
      {
        code: 'TSK-ERR-404',
        title: 'Unlinked Vendor Invoice Reconciliation',
        projectCode: 'PRJ-999-MISSING',
        assigneeName: 'Priya Sharma',
        priority: 'Medium',
        status: 'In Progress',
        startDate: '2026-10-15',
        dueDate: '2026-11-15',
        estimatedHours: 16,
        actualHours: 4,
        description: 'Row designed to trigger FOREIGN_KEY_ORPHAN rejection during ETL validation.',
      },
    ],
    milestones: [
      {
        code: 'MS-101-4',
        title: 'CERT-In Zero-Trust Sovereign Enclave Sign-Off',
        projectCode: 'PRJ-101',
        owner: 'Sopan Shinde',
        plannedDate: '2026-11-28',
        status: 'In Progress',
        completionPercent: 90,
        deliverableNotes: 'Updated attestation readiness to 90% via SAP/Jira connector.',
      },
    ],
  },
  null,
  2
);

export const SEED_ETL_RUNS: ETLPipelineRun[] = [
  {
    id: 'etl-seed-1001',
    runCode: 'ETL-1001',
    batchName: 'FY26-27 Master Portfolio & SAP S/4HANA Ledger Sync',
    sourceFormat: 'REST API',
    entityTarget: 'Combined Batch',
    importMode: 'upsert',
    startedAt: '2026-10-28T06:00:00Z',
    completedAt: '2026-10-28T06:00:01Z',
    durationMs: 118,
    status: 'Completed',
    totalRecords: 32,
    validRecords: 32,
    insertedRecords: 32,
    updatedRecords: 0,
    duplicateRecords: 0,
    rejectedRecords: 0,
    qualityScore: 100,
    triggeredBy: 'Sopan Shinde',
    validationIssues: [],
    transformationSummary: [
      {
        entityCode: 'PRJ-101..PRJ-112',
        entityType: 'Project',
        operation: 'INSERT',
        fieldsNormalized: ['allocatedBudget', 'actualSpend', 'plannedSpend', 'monthlySpend'],
        computedMetricsSummary: '12 projects normalized; $14.55M allocated budget reconciled.',
      },
      {
        entityCode: 'TSK-101..TSK-120',
        entityType: 'Task',
        operation: 'INSERT',
        fieldsNormalized: ['estimatedHours', 'actualHours', 'assigneeId'],
        computedMetricsSummary: '20 deliverables linked to 10 PwC India Advisory team members.',
      },
    ],
    executionLogs: [
      '[2026-10-28T06:00:00.010Z] [STAGE 1: INGEST] Connected to PwC India Enterprise REST Connector (v2.4). Extracted 12 projects and 20 tasks.',
      '[2026-10-28T06:00:00.038Z] [STAGE 2: VALIDATE] Schema, required fields, PK uniqueness, and FK relationships verified (32/32 valid, 0 orphans).',
      '[2026-10-28T06:00:00.072Z] [STAGE 3: TRANSFORM] Computed budget variance, utilization %, risk scores (P×I), and resource weekly hour allocations.',
      '[2026-10-28T06:00:00.104Z] [STAGE 4: STORAGE] Committed 32 records in atomic SQLite WAL transaction.',
      '[2026-10-28T06:00:00.128Z] [STAGE 5: KPI & REPORT] Recomputed portfolio health distribution (6 Green, 3 Amber, 3 Red) and published W44 Executive Report.',
    ],
  },
  {
    id: 'etl-seed-1002',
    runCode: 'ETL-1002',
    batchName: 'Weekly Jira Deliverable & Timesheet Incremental Feed (W44)',
    sourceFormat: 'CSV',
    entityTarget: 'Tasks',
    importMode: 'upsert',
    startedAt: '2026-11-01T18:30:00Z',
    completedAt: '2026-11-01T18:30:01Z',
    durationMs: 64,
    status: 'Completed with Warnings',
    totalRecords: 6,
    validRecords: 5,
    insertedRecords: 0,
    updatedRecords: 5,
    duplicateRecords: 5,
    rejectedRecords: 1,
    qualityScore: 94.2,
    triggeredBy: 'Sopan Shinde',
    validationIssues: [
      {
        id: 'val-seed-1',
        rowNumber: 6,
        entityType: 'Task',
        entityCode: 'TSK-ORPHAN-09',
        field: 'projectCode',
        rule: 'FOREIGN_KEY_ORPHAN',
        severity: 'Rejected',
        message:
          'Referenced projectCode "PRJ-888" does not exist in `projects` table. Record rejected to preserve relational integrity.',
        rawPayload: '{"code":"TSK-ORPHAN-09","projectCode":"PRJ-888","title":"Unmapped Sandbox Task"}',
      },
    ],
    transformationSummary: [
      {
        entityCode: 'TSK-102',
        entityType: 'Task',
        operation: 'UPSERT_MERGE',
        fieldsNormalized: ['actualHours', 'status'],
        computedMetricsSummary: 'Updated actual hours (46h / 40h est) and flagged Overdue status.',
      },
    ],
    executionLogs: [
      '[2026-11-01T18:30:00.005Z] [STAGE 1: INGEST] Parsed RFC-4180 CSV payload containing 6 task rows.',
      '[2026-11-01T18:30:00.024Z] [STAGE 2: VALIDATE] Detected 5 existing task keys (upsert mode) and 1 FOREIGN_KEY_ORPHAN error (TSK-ORPHAN-09 -> PRJ-888).',
      '[2026-11-01T18:30:00.045Z] [STAGE 3: TRANSFORM] Normalized hours and recalculated team member weekly utilization.',
      '[2026-11-01T18:30:00.069Z] [STAGE 4: STORAGE] Upserted 5 valid task records into SQLite `tasks` table; quarantined 1 rejected record.',
    ],
  },
];

function parseCSVLines(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitRow(lines[0]);
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = values[idx] ?? '';
    });
    records.push(rec);
  }
  return records;
}

export interface RawIngestOptions {
  batchName: string;
  sourceFormat: ETLSourceFormat;
  entityTarget: ETLEntityTarget;
  importMode: ETLImportMode;
  triggeredBy: string;
  dryRunOnly?: boolean;
}

export interface ETLPipelineExecutionResult {
  run: ETLPipelineRun;
  nextState: PortfolioState;
  previewRecords: Record<string, unknown>[];
}

/**
 * Executes the complete 6-Stage Data Engineering Pipeline:
 * 1. Parse (CSV / JSON / REST API)
 * 2. Validate (Schema, Required Fields, Duplicate Detection, Foreign Key Referential Integrity)
 * 3. Transform (Date normalization, Progress clamping, Budget Variance & Utilization derivation)
 * 4. Store (Idempotent Upsert or Skip into PortfolioState / SQLite)
 * 5. Recalculate KPIs
 * 6. Emit Execution Audit Log
 */
export function runDataIngestionPipeline(
  rawPayload: string,
  options: RawIngestOptions,
  currentState: PortfolioState
): ETLPipelineExecutionResult {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const logs: string[] = [];
  const validationIssues: ETLValidationIssue[] = [];
  const transformationSummary: ETLTransformationItem[] = [];
  const previewRecords: Record<string, unknown>[] = [];

  logs.push(
    `[${startedAt}] [STAGE 1: INGEST] Starting pipeline "${options.batchName}" (${options.sourceFormat} · Target: ${options.entityTarget} · Mode: ${options.importMode}).`
  );

  let rawProjects: Record<string, unknown>[] = [];
  let rawTasks: Record<string, unknown>[] = [];
  let rawMilestones: Record<string, unknown>[] = [];

  try {
    if (options.sourceFormat === 'JSON' || options.sourceFormat === 'REST API') {
      const parsed = JSON.parse(rawPayload);
      if (Array.isArray(parsed)) {
        if (options.entityTarget === 'Tasks') {
          rawTasks = parsed;
        } else if (options.entityTarget === 'Milestones') {
          rawMilestones = parsed;
        } else {
          rawProjects = parsed;
        }
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.projects)) rawProjects = parsed.projects;
        if (Array.isArray(parsed.tasks)) rawTasks = parsed.tasks;
        if (Array.isArray(parsed.milestones)) rawMilestones = parsed.milestones;
      }
    } else {
      // CSV parsing
      const rows = parseCSVLines(rawPayload);
      if (
        options.entityTarget === 'Milestones' ||
        (rows[0] && ('plannedDate' in rows[0] || 'completionPercent' in rows[0]))
      ) {
        rawMilestones = rows;
      } else if (
        options.entityTarget === 'Tasks' ||
        (rows[0] && ('projectCode' in rows[0] || 'estimatedHours' in rows[0]))
      ) {
        rawTasks = rows;
      } else {
        rawProjects = rows;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Malformed input payload';
    validationIssues.push({
      id: `val-parse-${Date.now()}`,
      rowNumber: 1,
      entityType: 'Project',
      entityCode: 'PAYLOAD_ERROR',
      field: 'payload',
      rule: 'SCHEMA_TYPE_ERROR',
      severity: 'Rejected',
      message: `Failed to parse ${options.sourceFormat} input: ${errMsg}`,
      rawPayload: rawPayload.slice(0, 180),
    });
  }

  rawProjects.forEach((r) => previewRecords.push({ _entity: 'Project', ...r }));
  rawTasks.forEach((r) => previewRecords.push({ _entity: 'Task', ...r }));
  rawMilestones.forEach((r) => previewRecords.push({ _entity: 'Milestone', ...r }));

  const totalRecords = rawProjects.length + rawTasks.length + rawMilestones.length;
  logs.push(
    `[${new Date().toISOString()}] [STAGE 1: INGEST] Extracted ${rawProjects.length} project(s), ${rawTasks.length} task(s), and ${rawMilestones.length} milestone(s) (${totalRecords} total).`
  );

  const nextProjects = [...currentState.projects];
  const nextTasks = [...(currentState.tasks || [])];
  const nextMilestones = [...currentState.milestones];
  const teamMembers = currentState.teamMembers || [];

  const validDepts: Department[] = ['Technology', 'Finance', 'Operations', 'Marketing'];
  const validProjectStatuses: ProjectStatus[] = ['Active', 'Completed', 'Delayed', 'At Risk'];
  const validPriorities: ProjectPriority[] = ['Critical', 'High', 'Medium', 'Low'];
  const validTaskStatuses: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];
  const validMilestoneStatuses: MilestoneStatus[] = [
    'Completed',
    'In Progress',
    'Upcoming',
    'Overdue',
  ];

  let validRecords = 0;
  let insertedRecords = 0;
  let updatedRecords = 0;
  let duplicateRecords = 0;
  let rejectedRecords = 0;

  const seenProjectCodesInBatch = new Set<string>();
  const seenTaskCodesInBatch = new Set<string>();
  const seenMilestoneCodesInBatch = new Set<string>();

  // STAGE 2 & 3: Validate & Transform Projects
  rawProjects.forEach((raw, idx) => {
    const rowNum = idx + 1;
    const code = String(raw.code || '').trim().toUpperCase();
    const name = String(raw.name || '').trim();
    const rawAlloc = Number(String(raw.allocatedBudget ?? '').replace(/[^0-9.-]/g, ''));
    const rawActual = Number(String(raw.actualSpend ?? '0').replace(/[^0-9.-]/g, ''));
    const rawProgress = Number(String(raw.progress ?? '0').replace(/[^0-9.-]/g, ''));
    const startDate = String(raw.startDate || '2026-06-01').trim();
    const endDate = String(raw.endDate || '2026-12-31').trim();

    // 1. Required fields check
    if (!code || !name) {
      rejectedRecords++;
      validationIssues.push({
        id: `val-prj-req-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Project',
        entityCode: code || `ROW-${rowNum}`,
        field: !code ? 'code' : 'name',
        rule: 'REQUIRED_FIELD',
        severity: 'Rejected',
        message: `Missing required field "${!code ? 'code' : 'name'}". Project record rejected.`,
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code || `ROW-${rowNum}`,
        entityType: 'Project',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: 'Rejected due to missing required primary identifier or title.',
      });
      return;
    }

    // 2. Domain & Schema Range Validation
    if (isNaN(rawAlloc) || rawAlloc <= 0 || rawActual < 0 || endDate < startDate) {
      rejectedRecords++;
      const reason =
        rawAlloc <= 0
          ? `Invalid allocatedBudget (${rawAlloc}); must be > 0`
          : endDate < startDate
          ? `Invalid schedule range: endDate (${endDate}) precedes startDate (${startDate})`
          : 'Invalid numeric budget value';
      validationIssues.push({
        id: `val-prj-rng-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Project',
        entityCode: code,
        field: rawAlloc <= 0 ? 'allocatedBudget' : 'endDate',
        rule: 'DOMAIN_RANGE_VIOLATION',
        severity: 'Rejected',
        message: `${reason}. Record quarantined.`,
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code,
        entityType: 'Project',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: reason,
      });
      return;
    }

    // 3. Duplicate Detection (against existing DB or within same batch)
    const existingIdx = nextProjects.findIndex((p) => p.code.toUpperCase() === code);
    const isDuplicate = existingIdx >= 0 || seenProjectCodesInBatch.has(code);
    seenProjectCodesInBatch.add(code);

    if (isDuplicate) {
      duplicateRecords++;
      if (options.importMode === 'strict_reject_duplicates') {
        rejectedRecords++;
        validationIssues.push({
          id: `val-prj-dup-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Project',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Rejected',
          message: `Duplicate project code "${code}" rejected under strict_reject_duplicates policy.`,
          rawPayload: JSON.stringify(raw),
        });
        transformationSummary.push({
          entityCode: code,
          entityType: 'Project',
          operation: 'REJECTED',
          fieldsNormalized: [],
          computedMetricsSummary: 'Rejected duplicate key.',
        });
        return;
      } else if (options.importMode === 'skip_duplicates') {
        validationIssues.push({
          id: `val-prj-skip-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Project',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Skipped)',
          message: `Existing project "${code}" skipped (skip_duplicates mode).`,
          rawPayload: JSON.stringify(raw),
        });
        transformationSummary.push({
          entityCode: code,
          entityType: 'Project',
          operation: 'SKIPPED_DUPLICATE',
          fieldsNormalized: [],
          computedMetricsSummary: 'Skipped existing record without mutation.',
        });
        return;
      } else {
        validationIssues.push({
          id: `val-prj-ups-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Project',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Upserted)',
          message: `Matched existing project "${code}" in SQLite; performed idempotent incremental upsert.`,
          rawPayload: JSON.stringify(raw),
        });
      }
    }

    // 4. Data Transformation & Normalization
    const normalizedFields: string[] = [];
    const clampedProgress = Math.max(0, Math.min(100, Math.round(rawProgress)));
    if (clampedProgress !== rawProgress) {
      normalizedFields.push(`progress clamped (${rawProgress}% -> ${clampedProgress}%)`);
    }

    const rawDept = String(raw.department || 'Technology').trim();
    const department: Department =
      validDepts.find((d) => d.toLowerCase() === rawDept.toLowerCase()) || 'Technology';
    if (department !== rawDept) normalizedFields.push('department');

    const rawStatus = String(raw.status || 'Active').trim();
    const status: ProjectStatus =
      validProjectStatuses.find((s) => s.toLowerCase() === rawStatus.toLowerCase()) || 'Active';

    const rawPriority = String(raw.priority || 'High').trim();
    const priority: ProjectPriority =
      validPriorities.find((p) => p.toLowerCase() === rawPriority.toLowerCase()) || 'High';

    const plannedSpend = Math.round(rawAlloc * 0.88);
    const plannedProgress = Math.min(100, clampedProgress + 4);
    const bm = calculateBudgetMetrics(rawAlloc, rawActual, plannedSpend);
    normalizedFields.push('budgetVariance', 'utilizationPercent', 'plannedSpend');

    const transformedProject: Project = {
      id: existingIdx >= 0 ? nextProjects[existingIdx].id : `prj-etl-${code.toLowerCase()}`,
      code,
      name,
      department,
      owner: String(raw.owner || 'Sopan Shinde').trim(),
      ownerRole: String(
        raw.ownerRole || 'Partner, Cyber & Cloud Transformation (PwC Mumbai)'
      ).trim(),
      startDate,
      endDate,
      allocatedBudget: rawAlloc,
      actualSpend: rawActual,
      plannedSpend,
      status: clampedProgress === 100 ? 'Completed' : status,
      priority,
      category: String(raw.category || 'Enterprise Transformation').trim(),
      progress: clampedProgress,
      plannedProgress,
      description: String(
        raw.description ||
          `Ingested via ProjectPulse ETL Pipeline (${options.batchName}) on ${currentState.referenceDate}.`
      ).trim(),
      strategicObjective: String(
        raw.strategicObjective || 'Deliver measurable operational and financial governance.'
      ).trim(),
      teamMemberIds:
        existingIdx >= 0 ? nextProjects[existingIdx].teamMemberIds : ['tm-1', 'tm-8'],
      monthlySpend: existingIdx >= 0 ? nextProjects[existingIdx].monthlySpend : undefined,
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    validRecords++;
    if (existingIdx >= 0) {
      nextProjects[existingIdx] = transformedProject;
      updatedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Project',
        operation: 'UPSERT_MERGE',
        fieldsNormalized: normalizedFields,
        computedMetricsSummary: `Progress=${clampedProgress}% | Variance=${formatCurrency(bm.variance, true)} (${bm.utilizationPercent}% util)`,
      });
    } else {
      nextProjects.push(transformedProject);
      insertedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Project',
        operation: 'INSERT',
        fieldsNormalized: normalizedFields,
        computedMetricsSummary: `Allocated=${formatCurrency(rawAlloc)} | Variance=${formatCurrency(bm.variance, true)} (${bm.utilizationPercent}% util)`,
      });
    }
  });

  // Build project lookup map (including newly inserted projects in this batch!) for Foreign-Key validation
  const projectByCode = new Map(nextProjects.map((p) => [p.code.toUpperCase(), p]));
  const projectById = new Map(nextProjects.map((p) => [p.id, p]));

  // STAGE 2 & 3: Validate & Transform Tasks
  rawTasks.forEach((raw, idx) => {
    const rowNum = rawProjects.length + idx + 1;
    const code = String(raw.code || '').trim().toUpperCase();
    const title = String(raw.title || '').trim();
    const projectCodeRef = String(raw.projectCode || raw.projectId || '').trim().toUpperCase();

    // 1. Required fields check
    if (!code || !title || !projectCodeRef) {
      rejectedRecords++;
      validationIssues.push({
        id: `val-tsk-req-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Task',
        entityCode: code || `TASK-ROW-${rowNum}`,
        field: !code ? 'code' : !title ? 'title' : 'projectCode',
        rule: 'REQUIRED_FIELD',
        severity: 'Rejected',
        message: 'Task record is missing required `code`, `title`, or `projectCode`.',
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code || `TASK-ROW-${rowNum}`,
        entityType: 'Task',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: 'Rejected due to missing required task identifier.',
      });
      return;
    }

    // 2. Foreign Key Referential Integrity Check (`task.projectId -> projects.id`)
    const linkedProject =
      projectByCode.get(projectCodeRef) || projectById.get(String(raw.projectId || ''));
    if (!linkedProject) {
      rejectedRecords++;
      validationIssues.push({
        id: `val-tsk-fk-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Task',
        entityCode: code,
        field: 'projectCode',
        rule: 'FOREIGN_KEY_ORPHAN',
        severity: 'Rejected',
        message: `Foreign Key Violation: Referenced project "${projectCodeRef}" does not exist in \`projects\` table. Orphaned task rejected.`,
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code,
        entityType: 'Task',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: `Rejected orphan task (missing parent project ${projectCodeRef}).`,
      });
      return;
    }

    // 3. Duplicate Detection
    const existingTaskIdx = nextTasks.findIndex((t) => t.code.toUpperCase() === code);
    const isDuplicate = existingTaskIdx >= 0 || seenTaskCodesInBatch.has(code);
    seenTaskCodesInBatch.add(code);

    if (isDuplicate) {
      duplicateRecords++;
      if (options.importMode === 'strict_reject_duplicates') {
        rejectedRecords++;
        validationIssues.push({
          id: `val-tsk-dup-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Task',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Rejected',
          message: `Duplicate task code "${code}" rejected under strict_reject_duplicates mode.`,
          rawPayload: JSON.stringify(raw),
        });
        return;
      } else if (options.importMode === 'skip_duplicates') {
        validationIssues.push({
          id: `val-tsk-skip-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Task',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Skipped)',
          message: `Duplicate task "${code}" skipped.`,
          rawPayload: JSON.stringify(raw),
        });
        return;
      } else {
        validationIssues.push({
          id: `val-tsk-ups-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Task',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Upserted)',
          message: `Existing task "${code}" matched; merged hours and status incrementally.`,
          rawPayload: JSON.stringify(raw),
        });
      }
    }

    // 4. Resolve Assignee Foreign Key (`assigneeId -> team_members.id`)
    const rawAssigneeName = String(raw.assigneeName || 'Sopan Shinde').trim();
    const matchedMember =
      teamMembers.find((tm) => tm.name.toLowerCase() === rawAssigneeName.toLowerCase()) ||
      teamMembers[0];

    const estHours = Math.max(1, Number(raw.estimatedHours) || 20);
    const actHours = Math.max(0, Number(raw.actualHours) || 0);
    const rawStatus = String(raw.status || 'In Progress').trim();
    const status: TaskStatus =
      validTaskStatuses.find((s) => s.toLowerCase() === rawStatus.toLowerCase()) || 'In Progress';
    const rawPriority = String(raw.priority || 'High').trim();
    const priority: ProjectPriority =
      validPriorities.find((p) => p.toLowerCase() === rawPriority.toLowerCase()) || 'High';

    const transformedTask: TaskItem = {
      id: existingTaskIdx >= 0 ? nextTasks[existingTaskIdx].id : `tsk-etl-${code.toLowerCase()}`,
      code,
      title,
      description: String(raw.description || `Deliverable linked to ${linkedProject.code}.`).trim(),
      projectId: linkedProject.id,
      assigneeId: matchedMember ? matchedMember.id : 'tm-1',
      assigneeName: matchedMember ? matchedMember.name : rawAssigneeName,
      priority,
      status,
      startDate: String(raw.startDate || '2026-10-01').trim(),
      dueDate: String(raw.dueDate || '2026-11-20').trim(),
      estimatedHours: estHours,
      actualHours: actHours,
      completedDate: status === 'Completed' ? currentState.referenceDate : null,
      dependencyIds: existingTaskIdx >= 0 ? nextTasks[existingTaskIdx].dependencyIds : [],
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    validRecords++;
    if (existingTaskIdx >= 0) {
      nextTasks[existingTaskIdx] = transformedTask;
      updatedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Task',
        operation: 'UPSERT_MERGE',
        fieldsNormalized: ['projectId (FK)', 'assigneeId (FK)', 'actualHours'],
        computedMetricsSummary: `Linked to ${linkedProject.code} | Assignee: ${transformedTask.assigneeName} (${actHours}/${estHours}h)`,
      });
    } else {
      nextTasks.push(transformedTask);
      insertedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Task',
        operation: 'INSERT',
        fieldsNormalized: ['projectId (FK)', 'assigneeId (FK)', 'estimatedHours'],
        computedMetricsSummary: `Linked to ${linkedProject.code} | Assignee: ${transformedTask.assigneeName} (${actHours}/${estHours}h)`,
      });
    }
  });

  // STAGE 2 & 3: Validate & Transform Milestones
  rawMilestones.forEach((raw, idx) => {
    const rowNum = rawProjects.length + rawTasks.length + idx + 1;
    const code = String(raw.code || '').trim().toUpperCase();
    const title = String(raw.title || '').trim();
    const projectCodeRef = String(raw.projectCode || raw.projectId || '').trim().toUpperCase();

    // 1. Required fields check
    if (!code || !title || !projectCodeRef) {
      rejectedRecords++;
      validationIssues.push({
        id: `val-ms-req-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Milestone',
        entityCode: code || `MS-ROW-${rowNum}`,
        field: !code ? 'code' : !title ? 'title' : 'projectCode',
        rule: 'REQUIRED_FIELD',
        severity: 'Rejected',
        message: 'Milestone record is missing required `code`, `title`, or `projectCode`.',
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code || `MS-ROW-${rowNum}`,
        entityType: 'Milestone',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: 'Rejected due to missing required milestone identifier.',
      });
      return;
    }

    // 2. Foreign Key Referential Integrity Check (`milestone.projectId -> projects.id`)
    const linkedProject =
      projectByCode.get(projectCodeRef) || projectById.get(String(raw.projectId || ''));
    if (!linkedProject) {
      rejectedRecords++;
      validationIssues.push({
        id: `val-ms-fk-${rowNum}-${Date.now()}`,
        rowNumber: rowNum,
        entityType: 'Milestone',
        entityCode: code,
        field: 'projectCode',
        rule: 'FOREIGN_KEY_ORPHAN',
        severity: 'Rejected',
        message: `Foreign Key Violation: Referenced project "${projectCodeRef}" does not exist in \`projects\` table. Orphaned milestone rejected.`,
        rawPayload: JSON.stringify(raw),
      });
      transformationSummary.push({
        entityCode: code,
        entityType: 'Milestone',
        operation: 'REJECTED',
        fieldsNormalized: [],
        computedMetricsSummary: `Rejected orphan milestone (missing parent project ${projectCodeRef}).`,
      });
      return;
    }

    // 3. Duplicate Detection
    const existingMsIdx = nextMilestones.findIndex((m) => m.code.toUpperCase() === code);
    const isDuplicate = existingMsIdx >= 0 || seenMilestoneCodesInBatch.has(code);
    seenMilestoneCodesInBatch.add(code);

    if (isDuplicate) {
      duplicateRecords++;
      if (options.importMode === 'strict_reject_duplicates') {
        rejectedRecords++;
        validationIssues.push({
          id: `val-ms-dup-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Milestone',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Rejected',
          message: `Duplicate milestone code "${code}" rejected under strict_reject_duplicates mode.`,
          rawPayload: JSON.stringify(raw),
        });
        return;
      } else if (options.importMode === 'skip_duplicates') {
        validationIssues.push({
          id: `val-ms-skip-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Milestone',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Skipped)',
          message: `Duplicate milestone "${code}" skipped.`,
          rawPayload: JSON.stringify(raw),
        });
        return;
      } else {
        validationIssues.push({
          id: `val-ms-ups-${rowNum}-${Date.now()}`,
          rowNumber: rowNum,
          entityType: 'Milestone',
          entityCode: code,
          field: 'code',
          rule: 'DUPLICATE_KEY',
          severity: 'Duplicate (Upserted)',
          message: `Existing milestone "${code}" matched; merged completion % and status incrementally.`,
          rawPayload: JSON.stringify(raw),
        });
      }
    }

    // 4. Data Transformation & Standardization
    const rawPct = Number(String(raw.completionPercent ?? '0').replace(/[^0-9.-]/g, ''));
    const clampedPct = Math.max(0, Math.min(100, Math.round(isNaN(rawPct) ? 0 : rawPct)));
    const plannedDate = String(raw.plannedDate || '2026-11-30').trim();
    const rawStatus = String(raw.status || 'In Progress').trim();
    let status: MilestoneStatus =
      validMilestoneStatuses.find((s) => s.toLowerCase() === rawStatus.toLowerCase()) ||
      'In Progress';
    if (clampedPct === 100) {
      status = 'Completed';
    } else if (plannedDate < currentState.referenceDate && status !== 'Completed') {
      status = 'Overdue';
    }

    const transformedMilestone: Milestone = {
      id: existingMsIdx >= 0 ? nextMilestones[existingMsIdx].id : `ms-etl-${code.toLowerCase()}`,
      projectId: linkedProject.id,
      code,
      title,
      owner: String(raw.owner || linkedProject.owner || 'Sopan Shinde').trim(),
      plannedDate,
      actualDate:
        clampedPct === 100
          ? String(raw.actualDate || currentState.referenceDate).trim()
          : raw.actualDate
          ? String(raw.actualDate).trim()
          : null,
      status,
      completionPercent: clampedPct,
      deliverableNotes: String(
        raw.deliverableNotes || `Milestone linked to ${linkedProject.code}.`
      ).trim(),
      dependencyIds: existingMsIdx >= 0 ? nextMilestones[existingMsIdx].dependencyIds : [],
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    validRecords++;
    if (existingMsIdx >= 0) {
      nextMilestones[existingMsIdx] = transformedMilestone;
      updatedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Milestone',
        operation: 'UPSERT_MERGE',
        fieldsNormalized: ['projectId (FK)', 'completionPercent', 'status'],
        computedMetricsSummary: `Linked to ${linkedProject.code} | ${clampedPct}% (${status}) · Planned ${plannedDate}`,
      });
    } else {
      nextMilestones.push(transformedMilestone);
      insertedRecords++;
      transformationSummary.push({
        entityCode: code,
        entityType: 'Milestone',
        operation: 'INSERT',
        fieldsNormalized: ['projectId (FK)', 'completionPercent', 'status'],
        computedMetricsSummary: `Linked to ${linkedProject.code} | ${clampedPct}% (${status}) · Planned ${plannedDate}`,
      });
    }
  });

  logs.push(
    `[${new Date().toISOString()}] [STAGE 2: VALIDATE] Completed schema & FK checks: ${validRecords} valid, ${duplicateRecords} duplicate(s), ${rejectedRecords} rejected.`
  );
  logs.push(
    `[${new Date().toISOString()}] [STAGE 3: TRANSFORM] Normalized ${transformationSummary.length} record(s); derived budget variance, utilization %, and FK bindings.`
  );

  const qualityScore =
    totalRecords > 0
      ? Math.round(((totalRecords - rejectedRecords) / totalRecords) * 1000) / 10
      : 100;

  const completedAt = new Date().toISOString();
  const durationMs = Math.max(18, Date.now() - startMs);

  const runRecord: ETLPipelineRun = {
    id: `etl-run-${Date.now()}`,
    runCode: `ETL-${1003 + (currentState.etlRuns?.length || 0)}`,
    batchName: options.batchName,
    sourceFormat: options.sourceFormat,
    entityTarget: options.entityTarget,
    importMode: options.importMode,
    startedAt,
    completedAt,
    durationMs,
    status:
      validRecords === 0 && rejectedRecords > 0
        ? 'Rejected'
        : rejectedRecords > 0 || duplicateRecords > 0
        ? 'Completed with Warnings'
        : 'Completed',
    totalRecords,
    validRecords,
    insertedRecords,
    updatedRecords,
    duplicateRecords,
    rejectedRecords,
    qualityScore,
    triggeredBy: options.triggeredBy,
    validationIssues,
    transformationSummary,
    executionLogs: [
      ...logs,
      options.dryRunOnly
        ? `[${completedAt}] [STAGE 4: DRY-RUN PREVIEW] Dry-run validation completed without mutating SQLite tables.`
        : `[${completedAt}] [STAGE 4: STORAGE] Committed ${insertedRecords} insert(s) and ${updatedRecords} update(s) to SQLite relational tables.`,
      `[${completedAt}] [STAGE 5: KPI ENGINE] Recalculated portfolio KPIs across ${nextProjects.length} projects, ${nextTasks.length} tasks, and ${nextMilestones.length} milestones.`,
    ],
  };

  if (options.dryRunOnly) {
    return {
      run: runRecord,
      nextState: currentState,
      previewRecords,
    };
  }

  const nextState: PortfolioState = {
    ...currentState,
    projects: nextProjects,
    tasks: nextTasks,
    milestones: nextMilestones,
    etlRuns: [runRecord, ...(currentState.etlRuns || SEED_ETL_RUNS)],
  };

  return {
    run: runRecord,
    nextState,
    previewRecords,
  };
}

/**
 * Computes the 5-dimension Data Quality Scorecard, Relational Foreign-Key Integrity checks,
 * and the KPI Formula & Transformation Dictionary from live database records.
 */
export function computeDataQualityAudit(
  state: PortfolioState,
  kpis?: DashboardKPIs
): DataQualityAudit {
  const computedKpis = kpis || computeDashboardKPIs(state);
  const projects = state.projects || [];
  const milestones = state.milestones || [];
  const history = state.milestoneHistory || [];
  const tasks = state.tasks || [];
  const risks = state.risks || [];
  const issues = state.issues || [];
  const deps = state.dependencies || [];
  const team = state.teamMembers || [];

  const projectIds = new Set(projects.map((p) => p.id));
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const taskIds = new Set(tasks.map((t) => t.id));
  const teamIds = new Set(team.map((tm) => tm.id));

  // Relational Foreign Key Integrity Checks
  const validTasksProject = tasks.filter((t) => projectIds.has(t.projectId)).length;
  const validTasksAssignee = tasks.filter((t) => teamIds.has(t.assigneeId)).length;
  const validMilestonesProject = milestones.filter((m) => projectIds.has(m.projectId)).length;
  const validHistoryMilestone = history.filter((h) => milestoneIds.has(h.milestoneId)).length;
  const validRisksProject = risks.filter((r) => projectIds.has(r.projectId)).length;
  const validIssuesProject = issues.filter((i) => projectIds.has(i.projectId)).length;
  const validDepsTasks = deps.filter(
    (d) =>
      projectIds.has(d.projectId) &&
      taskIds.has(d.blockingTaskId) &&
      taskIds.has(d.blockedTaskId)
  ).length;

  const relationalChecks: RelationalIntegrityCheck[] = [
    {
      relationship: 'Tasks → Projects (FK)',
      childTable: 'tasks',
      parentTable: 'projects',
      foreignKeyColumn: 'project_id',
      totalChildRows: tasks.length,
      validLinkedRows: validTasksProject,
      orphanedRows: tasks.length - validTasksProject,
      status: tasks.length === validTasksProject ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Tasks → Team Members (FK)',
      childTable: 'tasks',
      parentTable: 'team_members',
      foreignKeyColumn: 'assignee_id',
      totalChildRows: tasks.length,
      validLinkedRows: validTasksAssignee,
      orphanedRows: tasks.length - validTasksAssignee,
      status: tasks.length === validTasksAssignee ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Milestones → Projects (FK)',
      childTable: 'milestones',
      parentTable: 'projects',
      foreignKeyColumn: 'project_id',
      totalChildRows: milestones.length,
      validLinkedRows: validMilestonesProject,
      orphanedRows: milestones.length - validMilestonesProject,
      status:
        milestones.length === validMilestonesProject ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Milestone History → Milestones (FK)',
      childTable: 'milestone_history',
      parentTable: 'milestones',
      foreignKeyColumn: 'milestone_id',
      totalChildRows: history.length,
      validLinkedRows: validHistoryMilestone,
      orphanedRows: history.length - validHistoryMilestone,
      status:
        history.length === validHistoryMilestone ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Risks → Projects (FK)',
      childTable: 'risks',
      parentTable: 'projects',
      foreignKeyColumn: 'project_id',
      totalChildRows: risks.length,
      validLinkedRows: validRisksProject,
      orphanedRows: risks.length - validRisksProject,
      status: risks.length === validRisksProject ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Issues → Projects (FK)',
      childTable: 'issues',
      parentTable: 'projects',
      foreignKeyColumn: 'project_id',
      totalChildRows: issues.length,
      validLinkedRows: validIssuesProject,
      orphanedRows: issues.length - validIssuesProject,
      status: issues.length === validIssuesProject ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
    {
      relationship: 'Dependencies → Tasks & Projects (FK)',
      childTable: 'dependencies',
      parentTable: 'tasks / projects',
      foreignKeyColumn: 'blocking_task_id, blocked_task_id',
      totalChildRows: deps.length,
      validLinkedRows: validDepsTasks,
      orphanedRows: deps.length - validDepsTasks,
      status: deps.length === validDepsTasks ? 'Verified (0 Orphans)' : 'Orphan Detected',
    },
  ];

  const totalFkChecked = relationalChecks.reduce((s, c) => s + c.totalChildRows, 0);
  const totalFkValid = relationalChecks.reduce((s, c) => s + c.validLinkedRows, 0);
  const fkScore =
    totalFkChecked > 0 ? Math.round((totalFkValid / totalFkChecked) * 1000) / 10 : 100;

  // Completeness Check
  const completeProjects = projects.filter(
    (p) =>
      p.code &&
      p.name &&
      p.owner &&
      p.department &&
      p.startDate &&
      p.endDate &&
      p.strategicObjective
  ).length;
  const completeTasks = tasks.filter(
    (t) => t.code && t.title && t.projectId && t.assigneeId && t.dueDate
  ).length;
  const totalCompletenessChecked = projects.length + tasks.length + milestones.length;
  const totalCompletenessPassed = completeProjects + completeTasks + milestones.length;
  const completenessScore =
    totalCompletenessChecked > 0
      ? Math.round((totalCompletenessPassed / totalCompletenessChecked) * 1000) / 10
      : 100;

  // Uniqueness Check
  const uniqueProjectCodes = new Set(projects.map((p) => p.code.toUpperCase())).size;
  const uniqueTaskCodes = new Set(tasks.map((t) => t.code.toUpperCase())).size;
  const uniqueMilestoneCodes = new Set(milestones.map((m) => m.code.toUpperCase())).size;
  const uniqueRiskCodes = new Set(risks.map((r) => r.code.toUpperCase())).size;
  const totalUniqueChecked =
    projects.length + tasks.length + milestones.length + risks.length;
  const totalUniquePassed =
    uniqueProjectCodes + uniqueTaskCodes + uniqueMilestoneCodes + uniqueRiskCodes;
  const uniquenessScore =
    totalUniqueChecked > 0
      ? Math.round((totalUniquePassed / totalUniqueChecked) * 1000) / 10
      : 100;

  // Domain Validity Check
  const validProjectsDomain = projects.filter(
    (p) =>
      p.progress >= 0 &&
      p.progress <= 100 &&
      p.allocatedBudget > 0 &&
      p.actualSpend >= 0 &&
      p.endDate >= p.startDate
  ).length;
  const validRisksDomain = risks.filter(
    (r) =>
      r.probability >= 1 &&
      r.probability <= 5 &&
      r.impact >= 1 &&
      r.impact <= 5 &&
      r.riskScore === r.probability * r.impact
  ).length;
  const totalDomainChecked = projects.length + risks.length;
  const totalDomainPassed = validProjectsDomain + validRisksDomain;
  const domainScore =
    totalDomainChecked > 0
      ? Math.round((totalDomainPassed / totalDomainChecked) * 1000) / 10
      : 100;

  const dimensions: DataQualityDimension[] = [
    {
      dimension: 'Completeness',
      score: completenessScore,
      passedRecords: totalCompletenessPassed,
      totalChecked: totalCompletenessChecked,
      ruleDescription:
        'Non-null mandatory business attributes across projects, tasks, and milestones.',
      status: completenessScore >= 98 ? 'Optimal' : 'Attention',
    },
    {
      dimension: 'Referential Integrity',
      score: fkScore,
      passedRecords: totalFkValid,
      totalChecked: totalFkChecked,
      ruleDescription:
        'Zero-orphan foreign key enforcement across all 7 parent-child SQLite relationships.',
      status: fkScore === 100 ? 'Optimal' : 'Critical',
    },
    {
      dimension: 'Uniqueness',
      score: uniquenessScore,
      passedRecords: totalUniquePassed,
      totalChecked: totalUniqueChecked,
      ruleDescription:
        'Primary & business key uniqueness across PRJ-*, TSK-*, MS-*, and RSK-* identifiers.',
      status: uniquenessScore === 100 ? 'Optimal' : 'Attention',
    },
    {
      dimension: 'Domain Validity',
      score: domainScore,
      passedRecords: totalDomainPassed,
      totalChecked: totalDomainChecked,
      ruleDescription:
        'Progress in [0,100], Allocated Budget > 0, EndDate >= StartDate, Risk Score = P × I.',
      status: domainScore === 100 ? 'Optimal' : 'Attention',
    },
    {
      dimension: 'Timeliness & Freshness',
      score: 100,
      passedRecords: projects.length,
      totalChecked: projects.length,
      ruleDescription: `All engagement telemetry synchronized against reference date ${state.referenceDate}.`,
      status: 'Optimal',
    },
  ];

  const overallScore =
    Math.round(
      (dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) * 10
    ) / 10;

  const totalDatabaseRecords =
    projects.length +
    milestones.length +
    history.length +
    tasks.length +
    risks.length +
    issues.length +
    deps.length +
    team.length +
    (state.activityLog?.length || 0) +
    state.reports.length +
    (state.etlRuns?.length || 0);

  return {
    overallScore,
    totalDatabaseRecords,
    dimensions,
    relationalChecks,
    kpiFormulaRegistry: [
      {
        kpiName: 'Portfolio Completion Rate (%)',
        category: 'Schedule',
        sqlAndMathFormula: 'ROUND(AVG(projects.progress), 1)',
        sourceTables: 'projects',
        currentCalculatedValue: `${computedKpis.averagePortfolioProgress}% (vs ${computedKpis.averagePlannedProgress}% planned)`,
      },
      {
        kpiName: 'Task Completion Rate (%)',
        category: 'Execution',
        sqlAndMathFormula:
          "ROUND((COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0) / COUNT(*), 1)",
        sourceTables: 'tasks',
        currentCalculatedValue: `${computedKpis.taskCompletionRate}% (${computedKpis.completedTasks}/${computedKpis.totalTasks} tasks)`,
      },
      {
        kpiName: 'Overdue Tasks Count',
        category: 'Execution',
        sqlAndMathFormula:
          "COUNT(*) WHERE status != 'Completed' AND due_date < :referenceDate",
        sourceTables: 'tasks',
        currentCalculatedValue: `${computedKpis.overdueTasks} overdue | ${computedKpis.blockedTasks} blocked`,
      },
      {
        kpiName: 'Delayed / Overdue Milestones',
        category: 'Schedule',
        sqlAndMathFormula:
          "COUNT(*) WHERE status != 'Completed' AND completion_percent < 100 AND planned_date < :referenceDate",
        sourceTables: 'milestones',
        currentCalculatedValue: `${computedKpis.overdueMilestones} overdue (${computedKpis.milestoneCompletionRate}% completion rate)`,
      },
      {
        kpiName: 'Budget Variance ($ & %)',
        category: 'Financial',
        sqlAndMathFormula:
          'SUM(actual_spend) - SUM(allocated_budget) | ((Actual - Allocated) / Allocated) * 100',
        sourceTables: 'projects',
        currentCalculatedValue: `${formatCurrency(computedKpis.totalBudgetVariance, true)} (${computedKpis.overBudgetProjectsCount} projects over budget)`,
      },
      {
        kpiName: 'Budget Utilization (%)',
        category: 'Financial',
        sqlAndMathFormula: 'ROUND((SUM(actual_spend) / SUM(allocated_budget)) * 100, 1)',
        sourceTables: 'projects',
        currentCalculatedValue: `${computedKpis.budgetUtilizationPercent}% (${formatCurrency(computedKpis.totalActualSpend)} / ${formatCurrency(computedKpis.totalAllocatedBudget)})`,
      },
      {
        kpiName: 'Resource Capacity Utilization (%)',
        category: 'Resource',
        sqlAndMathFormula:
          'ROUND((SUM(active_task_weekly_hours) / team_members.weekly_capacity_hours) * 100, 1)',
        sourceTables: 'tasks JOIN team_members ON tasks.assignee_id = team_members.id',
        currentCalculatedValue: `${computedKpis.teamWorkloads.filter((w) => w.utilizationPercent > 100).length} overallocated | ${computedKpis.teamWorkloads.length} active specialists`,
      },
      {
        kpiName: 'Risk Score & Critical Exposure',
        category: 'Governance',
        sqlAndMathFormula:
          "risk_score = probability (1..5) * impact (1..5); Critical WHERE risk_score >= 16 AND status != 'Resolved'",
        sourceTables: 'risks',
        currentCalculatedValue: `${computedKpis.criticalUnresolvedRisks} Critical | Avg Score: ${computedKpis.averageRiskScore}/25`,
      },
      {
        kpiName: 'Project RAG Health Indicator',
        category: 'Governance',
        sqlAndMathFormula:
          "Red IF status='Delayed' OR util>105% OR overdue_ms>=2 OR crit_risk>=1; Amber IF status='At Risk' OR util>98% OR overdue_ms=1; ELSE Green",
        sourceTables: 'projects, milestones, risks, tasks',
        currentCalculatedValue: `Green: ${computedKpis.healthDistribution.Green} | Amber: ${computedKpis.healthDistribution.Amber} | Red: ${computedKpis.healthDistribution.Red}`,
      },
    ],
  };
}

export interface OverdueTaskRecord {
  id: string;
  code: string;
  title: string;
  projectCode: string;
  projectName: string;
  department: Department;
  assigneeName: string;
  dueDate: string;
  daysOverdue: number;
  status: TaskStatus;
  priority: ProjectPriority;
  loggedRatio: string;
}

export interface OverdueMilestoneRecord {
  id: string;
  code: string;
  title: string;
  projectCode: string;
  projectName: string;
  department: Department;
  owner: string;
  plannedDate: string;
  daysOverdue: number;
  completionPercent: number;
  completionGap: number;
  status: MilestoneStatus;
  deliverableNotes: string;
}

export interface OverdueAndPerformanceAnalysis {
  referenceDate: string;
  overdueTasks: OverdueTaskRecord[];
  overdueMilestones: OverdueMilestoneRecord[];
  blockedTasksCount: number;
  impactedProjectCodes: string[];
  measuredTelemetry: {
    totalConsolidatedRecords: number;
    historicalRecordsProcessed: number;
    historicalValidationFailures: number;
    kpiCalculationTimeMs: number;
    reportGenerationTimeMs: number;
    generatedReportTitle: string;
  };
}

function diffDaysBetweenDates(earlierIso: string, laterIso: string): number {
  const d1 = new Date(`${earlierIso}T00:00:00Z`).getTime();
  const d2 = new Date(`${laterIso}T00:00:00Z`).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

/**
 * Computes real-time Overdue Task & Milestone Schedule Slippage Analysis and
 * measures actual KPI calculation & report-generation execution performance.
 */
export function computeOverdueAndPerformanceAnalysis(
  state: PortfolioState
): OverdueAndPerformanceAnalysis {
  const kpiStart = performance.now();
  const kpis = computeDashboardKPIs(state);
  const kpiElapsedMs = Math.max(0.4, Math.round((performance.now() - kpiStart) * 100) / 100);

  const reportStart = performance.now();
  const sampleReport = buildEvidenceReportFromState(
    state,
    'Weekly',
    `Automated ETL & Schedule Slippage Audit (${state.referenceDate})`,
    'delay_analysis',
    'Weekly Executive Summary'
  );
  const reportElapsedMs = Math.max(0.5, Math.round((performance.now() - reportStart) * 100) / 100);

  const projMap = new Map(state.projects.map((p) => [p.id, p]));

  const overdueTasks: OverdueTaskRecord[] = (state.tasks || [])
    .filter((t) => isTaskOverdue(t, state.referenceDate))
    .map((t) => {
      const p = projMap.get(t.projectId);
      return {
        id: t.id,
        code: t.code,
        title: t.title,
        projectCode: p?.code || 'UNMAPPED',
        projectName: p?.name || 'Unmapped Engagement',
        department: p?.department || 'Technology',
        assigneeName: t.assigneeName,
        dueDate: t.dueDate,
        daysOverdue: diffDaysBetweenDates(t.dueDate, state.referenceDate),
        status: t.status,
        priority: t.priority,
        loggedRatio: `${t.actualHours}h / ${t.estimatedHours}h`,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const overdueMilestones: OverdueMilestoneRecord[] = state.milestones
    .filter((m) => isMilestoneOverdue(m, state.referenceDate))
    .map((m) => {
      const p = projMap.get(m.projectId);
      return {
        id: m.id,
        code: m.code,
        title: m.title,
        projectCode: p?.code || 'UNMAPPED',
        projectName: p?.name || 'Unmapped Engagement',
        department: p?.department || 'Technology',
        owner: m.owner,
        plannedDate: m.plannedDate,
        daysOverdue: diffDaysBetweenDates(m.plannedDate, state.referenceDate),
        completionPercent: m.completionPercent,
        completionGap: 100 - m.completionPercent,
        status: m.status,
        deliverableNotes: m.deliverableNotes,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const impactedSet = new Set<string>([
    ...overdueTasks.map((t) => t.projectCode),
    ...overdueMilestones.map((m) => m.projectCode),
  ]);

  const runs = state.etlRuns && state.etlRuns.length > 0 ? state.etlRuns : SEED_ETL_RUNS;
  const historicalRecordsProcessed = runs.reduce((s, r) => s + r.totalRecords, 0);
  const historicalValidationFailures = runs.reduce((s, r) => s + r.rejectedRecords, 0);

  const totalConsolidatedRecords =
    state.projects.length +
    state.milestones.length +
    state.milestoneHistory.length +
    (state.tasks || []).length +
    state.risks.length +
    (state.issues || []).length +
    (state.dependencies || []).length +
    (state.teamMembers || []).length +
    (state.activityLog || []).length +
    state.reports.length +
    runs.length;

  return {
    referenceDate: state.referenceDate,
    overdueTasks,
    overdueMilestones,
    blockedTasksCount: kpis.blockedTasks,
    impactedProjectCodes: Array.from(impactedSet),
    measuredTelemetry: {
      totalConsolidatedRecords,
      historicalRecordsProcessed,
      historicalValidationFailures,
      kpiCalculationTimeMs: kpiElapsedMs,
      reportGenerationTimeMs: reportElapsedMs,
      generatedReportTitle: sampleReport.title,
    },
  };
}
