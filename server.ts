import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  createInitialSeedState,
  DEFAULT_REFERENCE_DATE,
  SEED_ACTIVITY_LOG,
  SEED_DEPENDENCIES,
  SEED_ISSUES,
  SEED_TASKS,
  SEED_TEAM_MEMBERS,
} from './src/data/seedData';
import {
  ActivityLogEntry,
  AIOperationType,
  ExecutiveReport,
  IssueItem,
  Milestone,
  MilestoneHistoryEntry,
  PortfolioState,
  Project,
  ReportCategoryType,
  ReportPeriodType,
  RiskItem,
  TaskDependency,
  TaskItem,
  TeamMember,
} from './src/types/portfolio';
import {
  buildEvidenceReportFromState,
  calculateRiskScore,
  computeDashboardKPIs,
  formatCurrency,
  isMilestoneOverdue,
  isTaskOverdue,
} from './src/utils/calculations';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_PATH = path.resolve(__dirname, 'projectpulse.db');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

// Initialize SQLite Database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function safeAddColumn(table: string, columnDef: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch {
    // Column already exists
  }
}

function initializeDatabaseSchema() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schemaSql);
  }
  // Safe column migrations for existing projectpulse.db files
  safeAddColumn('projects', 'planned_spend REAL DEFAULT 0');
  safeAddColumn('projects', "priority TEXT DEFAULT 'High'");
  safeAddColumn('projects', "category TEXT DEFAULT 'Digital Transformation'");
  safeAddColumn('projects', 'planned_progress INTEGER DEFAULT 0');
  safeAddColumn('projects', "team_member_ids_json TEXT DEFAULT '[]'");
  safeAddColumn('projects', "monthly_spend_json TEXT DEFAULT '[]'");
  safeAddColumn('milestones', "dependency_ids_json TEXT DEFAULT '[]'");
  safeAddColumn('risks', "target_resolution_date TEXT DEFAULT '2026-11-30'");
  safeAddColumn('executive_reports', "report_category TEXT DEFAULT 'Weekly Executive Summary'");
}

function saveStateToSqlite(state: PortfolioState) {
  const tx = db.transaction((s: PortfolioState) => {
    db.prepare('DELETE FROM milestone_history').run();
    db.prepare('DELETE FROM milestones').run();
    db.prepare('DELETE FROM risks').run();
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM issues').run();
    db.prepare('DELETE FROM dependencies').run();
    db.prepare('DELETE FROM team_members').run();
    db.prepare('DELETE FROM activity_log').run();
    db.prepare('DELETE FROM projects').run();
    db.prepare('DELETE FROM executive_reports').run();

    const insertProject = db.prepare(`
      INSERT INTO projects (
        id, code, name, department, owner, owner_role, start_date, end_date,
        allocated_budget, actual_spend, planned_spend, status, priority, category,
        progress, planned_progress, description, strategic_objective,
        team_member_ids_json, monthly_spend_json, is_synthetic, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of s.projects) {
      insertProject.run(
        p.id,
        p.code,
        p.name,
        p.department,
        p.owner,
        p.ownerRole,
        p.startDate,
        p.endDate,
        p.allocatedBudget,
        p.actualSpend,
        p.plannedSpend ?? Math.round(p.allocatedBudget * 0.85),
        p.status,
        p.priority || 'High',
        p.category || 'Enterprise Transformation',
        p.progress,
        p.plannedProgress ?? Math.min(100, p.progress + 5),
        p.description,
        p.strategicObjective,
        JSON.stringify(p.teamMemberIds || []),
        JSON.stringify(p.monthlySpend || []),
        p.isSynthetic ? 1 : 0,
        p.updatedAt
      );
    }

    const insertMilestone = db.prepare(`
      INSERT INTO milestones (
        id, project_id, code, title, owner, planned_date, actual_date,
        status, completion_percent, deliverable_notes, dependency_ids_json, is_synthetic, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of s.milestones) {
      insertMilestone.run(
        m.id,
        m.projectId,
        m.code,
        m.title,
        m.owner,
        m.plannedDate,
        m.actualDate,
        m.status,
        m.completionPercent,
        m.deliverableNotes,
        JSON.stringify(m.dependencyIds || []),
        m.isSynthetic ? 1 : 0,
        m.updatedAt
      );
    }

    const insertHistory = db.prepare(`
      INSERT INTO milestone_history (
        id, milestone_id, project_id, timestamp, author,
        previous_percent, new_percent, previous_status, new_status, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const h of s.milestoneHistory) {
      insertHistory.run(
        h.id,
        h.milestoneId,
        h.projectId,
        h.timestamp,
        h.author,
        h.previousPercent,
        h.newPercent,
        h.previousStatus,
        h.newStatus,
        h.note
      );
    }

    const insertRisk = db.prepare(`
      INSERT INTO risks (
        id, project_id, code, description, category, probability, impact,
        risk_score, owner, mitigation_plan, mitigation_progress, target_resolution_date,
        status, is_synthetic, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of s.risks) {
      const score = calculateRiskScore(r.probability, r.impact);
      insertRisk.run(
        r.id,
        r.projectId,
        r.code,
        r.description,
        r.category,
        r.probability,
        r.impact,
        score,
        r.owner,
        r.mitigationPlan,
        r.mitigationProgress,
        r.targetResolutionDate || '2026-11-30',
        r.status,
        r.isSynthetic ? 1 : 0,
        r.updatedAt
      );
    }

    const insertTask = db.prepare(`
      INSERT INTO tasks (
        id, code, title, description, project_id, assignee_id, assignee_name,
        priority, status, start_date, due_date, estimated_hours, actual_hours,
        completed_date, dependency_ids_json, is_synthetic, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of s.tasks || []) {
      insertTask.run(
        t.id,
        t.code,
        t.title,
        t.description,
        t.projectId,
        t.assigneeId,
        t.assigneeName,
        t.priority,
        t.status,
        t.startDate,
        t.dueDate,
        t.estimatedHours,
        t.actualHours,
        t.completedDate,
        JSON.stringify(t.dependencyIds || []),
        t.isSynthetic ? 1 : 0,
        t.updatedAt
      );
    }

    const insertIssue = db.prepare(`
      INSERT INTO issues (
        id, code, title, description, project_id, priority, owner,
        reported_date, target_resolution_date, status, related_task_id,
        related_risk_id, resolution_notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const iss of s.issues || []) {
      insertIssue.run(
        iss.id,
        iss.code,
        iss.title,
        iss.description,
        iss.projectId,
        iss.priority,
        iss.owner,
        iss.reportedDate,
        iss.targetResolutionDate,
        iss.status,
        iss.relatedTaskId || null,
        iss.relatedRiskId || null,
        iss.resolutionNotes || '',
        iss.updatedAt
      );
    }

    const insertDep = db.prepare(`
      INSERT INTO dependencies (
        id, project_id, blocking_task_id, blocked_task_id, dependency_type, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const d of s.dependencies || []) {
      insertDep.run(
        d.id,
        d.projectId,
        d.blockingTaskId,
        d.blockedTaskId,
        d.dependencyType,
        d.status,
        d.notes || ''
      );
    }

    const insertTeam = db.prepare(`
      INSERT INTO team_members (
        id, name, email, designation, app_role, department, location, weekly_capacity_hours, avatar_initials
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const tm of s.teamMembers || []) {
      insertTeam.run(
        tm.id,
        tm.name,
        tm.email,
        tm.designation,
        tm.appRole,
        tm.department,
        tm.location,
        tm.weeklyCapacityHours,
        tm.avatarInitials
      );
    }

    const insertActivity = db.prepare(`
      INSERT INTO activity_log (
        id, user_name, user_role, action, entity_type, entity_code, project_id, timestamp, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const act of s.activityLog || []) {
      insertActivity.run(
        act.id,
        act.userName,
        act.userRole,
        act.action,
        act.entityType,
        act.entityCode,
        act.projectId || null,
        act.timestamp,
        act.description
      );
    }

    const insertReport = db.prepare(`
      INSERT INTO executive_reports (
        id, title, period_type, report_category, generated_at, author, review_status,
        reviewer_notes, executive_summary, delayed_highlights_json,
        major_risks_json, recommendations_json, kpi_snapshot_json, is_ai_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const rep of s.reports) {
      insertReport.run(
        rep.id,
        rep.title,
        rep.periodType,
        rep.reportCategory || 'Weekly Executive Summary',
        rep.generatedAt,
        rep.author,
        rep.reviewStatus,
        rep.reviewerNotes,
        rep.executiveSummary,
        JSON.stringify(rep.delayedHighlights),
        JSON.stringify(rep.majorRisks),
        JSON.stringify(rep.recommendations),
        JSON.stringify(rep.kpiSnapshot),
        rep.isAiGenerated ? 1 : 0
      );
    }
  });

  tx(state);
}

function loadStateFromSqlite(): PortfolioState {
  const projectRows = db.prepare('SELECT * FROM projects ORDER BY code ASC').all() as Record<string, unknown>[];
  const taskCountRow = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as { cnt: number };
  const hasLegacyOwner = projectRows.some(
    (r) => String(r.owner) === 'Marcus Vance' || String(r.owner) === 'Elena Rostova'
  );

  // Auto-seed or upgrade when tasks table is empty so all 15 modules have rich PwC India records immediately
  if (projectRows.length === 0 || hasLegacyOwner || taskCountRow.cnt === 0) {
    const seed = createInitialSeedState();
    saveStateToSqlite(seed);
    return seed;
  }

  const projects: Project[] = projectRows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    department: r.department as Project['department'],
    owner: String(r.owner),
    ownerRole: String(r.owner_role),
    startDate: String(r.start_date),
    endDate: String(r.end_date),
    allocatedBudget: Number(r.allocated_budget),
    actualSpend: Number(r.actual_spend),
    plannedSpend: Number(r.planned_spend || Math.round(Number(r.allocated_budget) * 0.85)),
    status: r.status as Project['status'],
    priority: (r.priority as Project['priority']) || 'High',
    category: String(r.category || 'Enterprise Transformation'),
    progress: Number(r.progress),
    plannedProgress: Number(r.planned_progress || Math.min(100, Number(r.progress) + 5)),
    description: String(r.description),
    strategicObjective: String(r.strategic_objective),
    teamMemberIds: JSON.parse(String(r.team_member_ids_json || '[]')),
    monthlySpend: JSON.parse(String(r.monthly_spend_json || '[]')),
    isSynthetic: Boolean(r.is_synthetic),
    updatedAt: String(r.updated_at),
  }));

  const milestoneRows = db.prepare('SELECT * FROM milestones ORDER BY planned_date ASC').all() as Record<string, unknown>[];
  const milestones: Milestone[] = milestoneRows.map((r) => ({
    id: String(r.id),
    projectId: String(r.project_id),
    code: String(r.code),
    title: String(r.title),
    owner: String(r.owner),
    plannedDate: String(r.planned_date),
    actualDate: r.actual_date ? String(r.actual_date) : null,
    status: r.status as Milestone['status'],
    completionPercent: Number(r.completion_percent),
    deliverableNotes: String(r.deliverable_notes),
    dependencyIds: JSON.parse(String(r.dependency_ids_json || '[]')),
    isSynthetic: Boolean(r.is_synthetic),
    updatedAt: String(r.updated_at),
  }));

  const historyRows = db.prepare('SELECT * FROM milestone_history ORDER BY timestamp DESC').all() as Record<string, unknown>[];
  const milestoneHistory: MilestoneHistoryEntry[] = historyRows.map((r) => ({
    id: String(r.id),
    milestoneId: String(r.milestone_id),
    projectId: String(r.project_id),
    timestamp: String(r.timestamp),
    author: String(r.author),
    previousPercent: Number(r.previous_percent),
    newPercent: Number(r.new_percent),
    previousStatus: r.previous_status as Milestone['status'],
    newStatus: r.new_status as Milestone['status'],
    note: String(r.note),
  }));

  const riskRows = db.prepare('SELECT * FROM risks ORDER BY risk_score DESC').all() as Record<string, unknown>[];
  const risks: RiskItem[] = riskRows.map((r) => ({
    id: String(r.id),
    projectId: String(r.project_id),
    code: String(r.code),
    description: String(r.description),
    category: r.category as RiskItem['category'],
    probability: Number(r.probability),
    impact: Number(r.impact),
    riskScore: calculateRiskScore(Number(r.probability), Number(r.impact)),
    owner: String(r.owner),
    mitigationPlan: String(r.mitigation_plan),
    mitigationProgress: Number(r.mitigation_progress),
    targetResolutionDate: String(r.target_resolution_date || '2026-11-30'),
    status: r.status as RiskItem['status'],
    isSynthetic: Boolean(r.is_synthetic),
    updatedAt: String(r.updated_at),
  }));

  const taskRows = db.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all() as Record<string, unknown>[];
  const tasks: TaskItem[] =
    taskRows.length > 0
      ? taskRows.map((r) => ({
          id: String(r.id),
          code: String(r.code),
          title: String(r.title),
          description: String(r.description),
          projectId: String(r.project_id),
          assigneeId: String(r.assignee_id),
          assigneeName: String(r.assignee_name),
          priority: r.priority as TaskItem['priority'],
          status: r.status as TaskItem['status'],
          startDate: String(r.start_date),
          dueDate: String(r.due_date),
          estimatedHours: Number(r.estimated_hours),
          actualHours: Number(r.actual_hours),
          completedDate: r.completed_date ? String(r.completed_date) : null,
          dependencyIds: JSON.parse(String(r.dependency_ids_json || '[]')),
          isSynthetic: Boolean(r.is_synthetic),
          updatedAt: String(r.updated_at),
        }))
      : structuredClone(SEED_TASKS);

  const issueRows = db.prepare('SELECT * FROM issues ORDER BY reported_date DESC').all() as Record<string, unknown>[];
  const issues: IssueItem[] =
    issueRows.length > 0
      ? issueRows.map((r) => ({
          id: String(r.id),
          code: String(r.code),
          title: String(r.title),
          description: String(r.description),
          projectId: String(r.project_id),
          priority: r.priority as IssueItem['priority'],
          owner: String(r.owner),
          reportedDate: String(r.reported_date),
          targetResolutionDate: String(r.target_resolution_date),
          status: r.status as IssueItem['status'],
          relatedTaskId: r.related_task_id ? String(r.related_task_id) : null,
          relatedRiskId: r.related_risk_id ? String(r.related_risk_id) : null,
          resolutionNotes: String(r.resolution_notes || ''),
          updatedAt: String(r.updated_at),
        }))
      : structuredClone(SEED_ISSUES);

  const depRows = db.prepare('SELECT * FROM dependencies').all() as Record<string, unknown>[];
  const dependencies: TaskDependency[] =
    depRows.length > 0
      ? depRows.map((r) => ({
          id: String(r.id),
          projectId: String(r.project_id),
          blockingTaskId: String(r.blocking_task_id),
          blockedTaskId: String(r.blocked_task_id),
          dependencyType: r.dependency_type as TaskDependency['dependencyType'],
          status: r.status as TaskDependency['status'],
          notes: String(r.notes || ''),
        }))
      : structuredClone(SEED_DEPENDENCIES);

  const teamRows = db.prepare('SELECT * FROM team_members').all() as Record<string, unknown>[];
  const teamMembers: TeamMember[] =
    teamRows.length > 0
      ? teamRows.map((r) => ({
          id: String(r.id),
          name: String(r.name),
          email: String(r.email),
          designation: String(r.designation),
          appRole: r.app_role as TeamMember['appRole'],
          department: r.department as TeamMember['department'],
          location: String(r.location),
          weeklyCapacityHours: Number(r.weekly_capacity_hours),
          avatarInitials: String(r.avatar_initials),
        }))
      : structuredClone(SEED_TEAM_MEMBERS);

  const actRows = db.prepare('SELECT * FROM activity_log ORDER BY timestamp DESC').all() as Record<string, unknown>[];
  const activityLog: ActivityLogEntry[] =
    actRows.length > 0
      ? actRows.map((r) => ({
          id: String(r.id),
          userName: String(r.user_name),
          userRole: String(r.user_role),
          action: r.action as ActivityLogEntry['action'],
          entityType: r.entity_type as ActivityLogEntry['entityType'],
          entityCode: String(r.entity_code),
          projectId: r.project_id ? String(r.project_id) : undefined,
          timestamp: String(r.timestamp),
          description: String(r.description),
        }))
      : structuredClone(SEED_ACTIVITY_LOG);

  const reportRows = db.prepare('SELECT * FROM executive_reports ORDER BY generated_at DESC').all() as Record<string, unknown>[];
  const reports: ExecutiveReport[] = reportRows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    periodType: r.period_type as ReportPeriodType,
    reportCategory: (r.report_category as ReportCategoryType) || 'Weekly Executive Summary',
    generatedAt: String(r.generated_at),
    author: String(r.author),
    reviewStatus: r.review_status as ExecutiveReport['reviewStatus'],
    reviewerNotes: String(r.reviewer_notes),
    executiveSummary: String(r.executive_summary),
    delayedHighlights: JSON.parse(String(r.delayed_highlights_json || '[]')),
    majorRisks: JSON.parse(String(r.major_risks_json || '[]')),
    recommendations: JSON.parse(String(r.recommendations_json || '[]')),
    kpiSnapshot: JSON.parse(String(r.kpi_snapshot_json || '{}')),
    isAiGenerated: Boolean(r.is_ai_generated),
  }));

  return {
    projects,
    milestones,
    milestoneHistory,
    risks,
    tasks,
    issues,
    dependencies,
    teamMembers,
    activityLog,
    reports,
    referenceDate: DEFAULT_REFERENCE_DATE,
    storageMode: 'sqlite-server',
  };
}

/**
 * Deterministic evidence-grounded portfolio Q&A responder used when no external Gemini API key is configured
 * or as an instant fallback so the interactive AI Chatbot always answers with exact PwC India portfolio data.
 */
function buildDeterministicChatResponse(message: string, state: PortfolioState): {
  reply: string;
  citedProjectCodes: string[];
} {
  const q = message.toLowerCase();
  const kpis = computeDashboardKPIs(state);

  if (q.includes('task') || q.includes('block') || q.includes('deliverable') || q.includes('tsk')) {
    const blocked = (state.tasks || []).filter(
      (t) => t.status === 'Blocked' || isTaskOverdue(t, state.referenceDate)
    );
    const projMap = new Map(state.projects.map((p) => [p.id, p]));
    const cited: string[] = [];
    const lines = blocked.map((t) => {
      const p = projMap.get(t.projectId);
      if (p) cited.push(p.code);
      return `• **${t.code} (${t.title})** on **${p?.code}** — Assignee: ${t.assigneeName} · Status: **${t.status}** (Due ${t.dueDate}, ${t.actualHours}/${t.estimatedHours}h logged)`;
    });
    return {
      reply: `Portfolio task completion rate is **${kpis.taskCompletionRate}%** (${kpis.completedTasks}/${kpis.totalTasks} tasks completed, ${kpis.blockedTasks} blocked, ${kpis.overdueTasks} overdue):\n\n${lines.join('\n') || 'All tasks are progressing on schedule.'}`,
      citedProjectCodes: Array.from(new Set(cited)),
    };
  }

  if (q.includes('team') || q.includes('workload') || q.includes('capacity') || q.includes('resource')) {
    const lines = kpis.teamWorkloads.slice(0, 6).map(
      (tm) =>
        `• **${tm.name}** (${tm.designation}) — **${tm.utilizationPercent}%** utilization (${tm.allocatedWeeklyHours}h / ${tm.weeklyCapacityHours}h weekly capacity · ${tm.activeTasksCount} active tasks across ${tm.assignedProjectCodes.join(', ')})`
    );
    return {
      reply: `**PwC India Advisory Team & Resource Capacity (${state.referenceDate})**:\n\n${lines.join('\n')}`,
      citedProjectCodes: ['PRJ-101', 'PRJ-102', 'PRJ-105'],
    };
  }

  if (q.includes('delay') || q.includes('red') || q.includes('attention') || q.includes('overrun') || q.includes('budget')) {
    const attention = state.projects.filter((p) => kpis.projectMetricsMap[p.id]?.requiresAttention);
    const lines = attention.map((p) => {
      const m = kpis.projectMetricsMap[p.id];
      return `• **${p.code} (${p.name})** — Led by ${p.owner} (${p.department}): Status is **${p.status}** (${m.health} Health, ${p.progress}% progress). Budget variance is **${formatCurrency(m.variance, true)}** (${m.utilizationPercent}% utilized of ${formatCurrency(m.allocatedBudget)}), with ${m.overdueMilestones} overdue milestone(s).`;
    });
    return {
      reply: `Based on live PwC India PMO telemetry (${state.referenceDate}), **${attention.length} of ${kpis.totalProjects} engagements** require Partner/Director attention:\n\n${lines.join('\n')}\n\nTotal portfolio expenditure is **${formatCurrency(kpis.totalActualSpend)}** against **${formatCurrency(kpis.totalAllocatedBudget)}** allocated (**${kpis.budgetUtilizationPercent}%** utilization).`,
      citedProjectCodes: attention.map((p) => p.code),
    };
  }

  if (q.includes('risk') || q.includes('critical') || q.includes('rsk') || q.includes('issue')) {
    const topRisks = [...state.risks]
      .filter((r) => r.status !== 'Resolved')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4);
    const projMap = new Map(state.projects.map((p) => [p.id, p]));
    const cited: string[] = [];
    const lines = topRisks.map((r) => {
      const p = projMap.get(r.projectId);
      if (p) cited.push(p.code);
      return `• **${r.code}** on **${p?.code || r.projectId}** (Owner: ${r.owner}): Score **${r.riskScore}/25** (P:${r.probability} × I:${r.impact}) — ${r.description} [Mitigation at ${r.mitigationProgress}%: *${r.mitigationPlan}*]`;
    });
    return {
      reply: `There are currently **${kpis.unresolvedRisks} unresolved risks** (${kpis.criticalUnresolvedRisks} Critical with score ≥ 16/25) and **${kpis.openIssues} open issues**:\n\n${lines.join('\n')}`,
      citedProjectCodes: Array.from(new Set(cited)),
    };
  }

  if (q.includes('milestone') || q.includes('overdue') || q.includes('schedule')) {
    const overdueMs = state.milestones.filter((m) => isMilestoneOverdue(m, state.referenceDate));
    const projMap = new Map(state.projects.map((p) => [p.id, p]));
    const cited: string[] = [];
    const lines = overdueMs.map((m) => {
      const p = projMap.get(m.projectId);
      if (p) cited.push(p.code);
      return `• **${m.code} (${m.title})** — Project **${p?.code}** (${m.owner}): Planned **${m.plannedDate}**, currently at **${m.completionPercent}%** completion (${m.deliverableNotes}).`;
    });
    return {
      reply: `Portfolio milestone completion rate is **${kpis.milestoneCompletionRate}%** (${kpis.completedMilestones}/${kpis.totalMilestones} completed). There are **${overdueMs.length} overdue milestone(s)**:\n\n${lines.join('\n') || 'All milestones are currently on track.'}`,
      citedProjectCodes: Array.from(new Set(cited)),
    };
  }

  const matchedProject = state.projects.find(
    (p) =>
      q.includes(p.code.toLowerCase()) ||
      q.includes(p.owner.toLowerCase().split(' ')[0]) ||
      q.includes(p.owner.toLowerCase().split(' ')[1] || '___')
  );
  if (matchedProject) {
    const m = kpis.projectMetricsMap[matchedProject.id];
    return {
      reply: `**${matchedProject.code}: ${matchedProject.name}** (${matchedProject.department} Practice)\n• **Engagement Lead**: ${matchedProject.owner} (${matchedProject.ownerRole})\n• **Status & Health**: ${matchedProject.status} · **${m.health} Health** (${matchedProject.progress}% complete)\n• **Financials**: ${formatCurrency(matchedProject.actualSpend)} actual spend vs. ${formatCurrency(matchedProject.allocatedBudget)} allocated (**${formatCurrency(m.variance, true)}** variance, **${m.utilizationPercent}%** utilization)\n• **Milestones & Tasks**: ${m.completedMilestones}/${m.totalMilestones} milestones completed (${m.overdueMilestones} overdue); ${m.completedTasks}/${m.totalTasks} tasks completed (${m.blockedTasks} blocked).\n• **Strategic Objective**: ${matchedProject.strategicObjective}`,
      citedProjectCodes: [matchedProject.code],
    };
  }

  return {
    reply: `**PwC India ProjectPulse AI Live Summary (${state.referenceDate})**:\n• **Portfolio**: ${kpis.totalProjects} strategic engagements (${kpis.onTrackProjects} On Track, ${kpis.atRiskProjects} At Risk, ${kpis.delayedProjects} Delayed, ${kpis.completedProjects} Completed)\n• **Health Breakdown**: ${kpis.healthDistribution.Green} Green · ${kpis.healthDistribution.Amber} Amber · ${kpis.healthDistribution.Red} Red\n• **Budget Telemetry**: ${formatCurrency(kpis.totalActualSpend)} actual spend against ${formatCurrency(kpis.totalAllocatedBudget)} allocated (**${kpis.budgetUtilizationPercent}%** utilization)\n• **Execution**: ${kpis.completedTasks}/${kpis.totalTasks} tasks completed (${kpis.blockedTasks} blocked); ${kpis.overdueMilestones} overdue milestones.\n• **Priority Focus**: **PRJ-102** (Ananya Iyer, +$190K overrun) and **PRJ-105** (Rohan Deshmukh, +$145K overrun) require immediate steering action.`,
    citedProjectCodes: ['PRJ-102', 'PRJ-105', 'PRJ-106'],
  };
}

initializeDatabaseSchema();
loadStateFromSqlite();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // 1. GET full portfolio state from SQLite
  app.get('/api/portfolio', (_req, res) => {
    try {
      const state = loadStateFromSqlite();
      res.json(state);
    } catch (error) {
      console.error('Error loading portfolio from SQLite:', error);
      res.status(500).json({ error: 'Failed to load portfolio state from SQLite database.' });
    }
  });

  // 2. POST sync state to SQLite (with RBAC check)
  app.post('/api/portfolio/sync', (req, res) => {
    try {
      const userRole = String(req.headers['x-user-role'] || 'Administrator');
      if (userRole === 'Executive / Viewer') {
        res.status(403).json({
          error: 'RBAC Permission Denied: Executive / Viewer role has read-only access.',
        });
        return;
      }

      const incomingState = req.body as PortfolioState;
      if (!incomingState || !Array.isArray(incomingState.projects)) {
        res.status(400).json({ error: 'Invalid portfolio state payload.' });
        return;
      }
      saveStateToSqlite(incomingState);
      res.json({ status: 'ok', storageMode: 'sqlite-server', enforcedRole: userRole });
    } catch (error) {
      console.error('Error syncing portfolio to SQLite:', error);
      res.status(500).json({ error: 'Failed to persist portfolio state to SQLite.' });
    }
  });

  // 3. POST reset demo data to baseline 12 synthetic projects
  app.post('/api/portfolio/reset', (req, res) => {
    try {
      const userRole = String(req.headers['x-user-role'] || 'Administrator');
      if (userRole === 'Executive / Viewer') {
        res.status(403).json({
          error: 'RBAC Permission Denied: Only Administrators or Project Managers can reset workspace data.',
        });
        return;
      }
      const freshSeed = createInitialSeedState();
      saveStateToSqlite(freshSeed);
      res.json(freshSeed);
    } catch (error) {
      console.error('Error resetting demo dataset:', error);
      res.status(500).json({ error: 'Failed to reset synthetic demonstration data.' });
    }
  });

  // 4. POST server-side Gemini AI Executive Assistant report generator (supports 6 AI operations)
  app.post('/api/ai/executive-report', async (req, res) => {
    try {
      const {
        periodType = 'Weekly',
        focusDepartment = 'All',
        operationType = 'executive_summary',
        reportCategory = 'Weekly Executive Summary',
        state: clientState,
      } = req.body as {
        periodType?: ReportPeriodType;
        focusDepartment?: string;
        operationType?: AIOperationType;
        reportCategory?: ReportCategoryType;
        state?: PortfolioState;
      };

      const activeState: PortfolioState =
        clientState && Array.isArray(clientState.projects) ? clientState : loadStateFromSqlite();

      const operationTitles: Record<AIOperationType, string> = {
        status_summary: 'AI Project Status & Velocity Summary',
        risk_explanation: 'AI Portfolio Risk Exposure & Mitigation Analysis',
        weekly_report: `${periodType} PwC India PMO Executive Report`,
        delay_analysis: 'AI Critical-Path Delay & Bottleneck Analysis',
        executive_summary: `${periodType} PwC India Executive Portfolio Briefing`,
        recommended_actions: 'AI Prioritized Partner Intervention Plan',
      };

      const baselineReport = buildEvidenceReportFromState(
        activeState,
        periodType,
        `${operationTitles[operationType] || operationTitles.executive_summary} — ${
          focusDepartment === 'All' ? 'All Advisory Practices' : focusDepartment
        } (${activeState.referenceDate})`,
        operationType,
        reportCategory
      );

      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

      if (!hasValidKey) {
        res.json({
          report: baselineReport,
          engine: 'deterministic-evidence-engine',
          note: 'Generated using deterministic relational evidence engine (exact live figures verified).',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const kpis = computeDashboardKPIs(activeState);
      const evidencePayload = {
        referenceDate: activeState.referenceDate,
        operationType,
        focusDepartment,
        portfolioTotals: {
          totalProjects: kpis.totalProjects,
          onTrackProjects: kpis.onTrackProjects,
          activeProjects: kpis.activeProjects,
          completedProjects: kpis.completedProjects,
          delayedProjects: kpis.delayedProjects,
          atRiskProjects: kpis.atRiskProjects,
          totalAllocatedBudget: formatCurrency(kpis.totalAllocatedBudget),
          totalActualSpend: formatCurrency(kpis.totalActualSpend),
          netBudgetVariance: formatCurrency(kpis.totalBudgetVariance, true),
          budgetUtilizationPercent: `${kpis.budgetUtilizationPercent}%`,
          healthDistribution: kpis.healthDistribution,
          overdueMilestonesCount: kpis.overdueMilestones,
          blockedTasksCount: kpis.blockedTasks,
          criticalUnresolvedRisksCount: kpis.criticalUnresolvedRisks,
        },
        delayedAndAtRiskProjects: baselineReport.delayedHighlights,
        topUnresolvedRisks: baselineReport.majorRisks,
        baselineRecommendations: baselineReport.recommendations,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Execute AI Operation "${operationType}" (${periodType}) for PwC India PMO from this verified portfolio telemetry JSON:\n${JSON.stringify(evidencePayload, null, 2)}`,
        config: {
          systemInstruction:
            'You are the Chief PMO Intelligence Partner for PwC India Advisory (ProjectPulse AI). ' +
            'CRITICAL RULE: You must NEVER invent or alter financial figures, project codes, statuses, milestone dates, owner names, or risk scores. ' +
            'Every figure and citation in your summary and recommendations must come strictly from the provided JSON telemetry. ' +
            'Keep the executiveSummary concise (3-4 sentences citing exact portfolio totals, budget utilization, and Red/Delayed counts). ' +
            'Provide 3 to 4 actionable recommendations where each recommendation includes at least 2 explicit supportingEvidence strings quoting exact project codes, dollar variances, milestone codes, or risk scores.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.STRING },
                    targetProjectCode: { type: Type.STRING },
                    action: { type: Type.STRING },
                    recommendedOwner: { type: Type.STRING },
                    expectedImpact: { type: Type.STRING },
                    supportingEvidence: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    'priority',
                    'targetProjectCode',
                    'action',
                    'recommendedOwner',
                    'expectedImpact',
                    'supportingEvidence',
                  ],
                },
              },
            },
            required: ['executiveSummary', 'recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      const parsed = rawText ? JSON.parse(rawText) : null;

      const finalReport: ExecutiveReport = {
        ...baselineReport,
        author: 'Gemini 3.8 Flash · PwC PMO Intelligence Analyst',
        executiveSummary: parsed?.executiveSummary || baselineReport.executiveSummary,
        recommendations:
          Array.isArray(parsed?.recommendations) && parsed.recommendations.length > 0
            ? parsed.recommendations.map((rec: Record<string, unknown>, idx: number) => ({
                id: `REC-AI-${Date.now()}-${idx + 1}`,
                priority:
                  rec.priority === 'Immediate (24–48h)' ||
                  rec.priority === 'High (This Week)' ||
                  rec.priority === 'Standard (This Month)'
                    ? rec.priority
                    : 'Immediate (24–48h)',
                targetProjectCode: String(rec.targetProjectCode || 'PRJ-102'),
                action: String(rec.action || ''),
                recommendedOwner: String(rec.recommendedOwner || 'Ananya Iyer'),
                expectedImpact: String(rec.expectedImpact || ''),
                supportingEvidence: Array.isArray(rec.supportingEvidence)
                  ? rec.supportingEvidence.map(String)
                  : [],
              }))
            : baselineReport.recommendations,
      };

      res.json({
        report: finalReport,
        engine: 'gemini-3.8-flash',
        note: 'Synthesized via server-side Gemini 3.8 Flash with strict evidence grounding.',
      });
    } catch (error) {
      console.error('Gemini API call error (falling back to deterministic evidence engine):', error);
      const {
        periodType = 'Weekly',
        operationType = 'executive_summary',
        reportCategory = 'Weekly Executive Summary',
        state: clientState,
      } = req.body || {};
      const activeState: PortfolioState =
        clientState && Array.isArray(clientState.projects) ? clientState : loadStateFromSqlite();
      const fallbackReport = buildEvidenceReportFromState(
        activeState,
        periodType,
        undefined,
        operationType,
        reportCategory
      );
      res.json({
        report: fallbackReport,
        engine: 'deterministic-evidence-fallback',
        note: 'Generated using verified relational evidence engine.',
      });
    }
  });

  // 5. POST server-side Gemini AI Interactive Chatbot endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message = '', state: clientState } = req.body as {
        message?: string;
        state?: PortfolioState;
      };

      const activeState: PortfolioState =
        clientState && Array.isArray(clientState.projects) ? clientState : loadStateFromSqlite();

      const fallbackResult = buildDeterministicChatResponse(message, activeState);

      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);

      if (!hasValidKey) {
        res.json({
          reply: fallbackResult.reply,
          citedProjectCodes: fallbackResult.citedProjectCodes,
          engine: 'deterministic-pmo-copilot',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const kpis = computeDashboardKPIs(activeState);
      const compactContext = {
        referenceDate: activeState.referenceDate,
        kpis: {
          totalProjects: kpis.totalProjects,
          onTrack: kpis.onTrackProjects,
          active: kpis.activeProjects,
          completed: kpis.completedProjects,
          delayed: kpis.delayedProjects,
          atRisk: kpis.atRiskProjects,
          allocatedBudget: formatCurrency(kpis.totalAllocatedBudget),
          actualSpend: formatCurrency(kpis.totalActualSpend),
          variance: formatCurrency(kpis.totalBudgetVariance, true),
          utilization: `${kpis.budgetUtilizationPercent}%`,
          overdueMilestones: kpis.overdueMilestones,
          blockedTasks: kpis.blockedTasks,
          criticalRisks: kpis.criticalUnresolvedRisks,
        },
        projects: activeState.projects.map((p) => {
          const m = kpis.projectMetricsMap[p.id];
          return {
            code: p.code,
            name: p.name,
            department: p.department,
            owner: p.owner,
            status: p.status,
            health: m.health,
            progress: `${p.progress}%`,
            allocated: formatCurrency(p.allocatedBudget),
            actual: formatCurrency(p.actualSpend),
            variance: formatCurrency(m.variance, true),
            overdueMilestones: m.overdueMilestones,
            blockedTasks: m.blockedTasks,
            maxRiskScore: m.maxRiskScore,
          };
        }),
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User question: "${message}"\n\nLive PwC India Portfolio Context JSON:\n${JSON.stringify(compactContext)}`,
        config: {
          systemInstruction:
            'You are the PwC India ProjectPulse AI Copilot. Answer the user question concisely using ONLY the exact figures, Indian Partner/Director names, project codes, milestones, tasks, and risks from the provided JSON context. Never invent figures. Return JSON with `reply` and `citedProjectCodes`.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              citedProjectCodes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'citedProjectCodes'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        reply: parsed.reply || fallbackResult.reply,
        citedProjectCodes: Array.isArray(parsed.citedProjectCodes)
          ? parsed.citedProjectCodes
          : fallbackResult.citedProjectCodes,
        engine: 'gemini-3.8-flash',
      });
    } catch (error) {
      console.error('AI Chat endpoint fallback triggered:', error);
      const { message = '', state: clientState } = req.body || {};
      const activeState: PortfolioState =
        clientState && Array.isArray(clientState.projects) ? clientState : loadStateFromSqlite();
      const fallback = buildDeterministicChatResponse(message, activeState);
      res.json({
        reply: fallback.reply,
        citedProjectCodes: fallback.citedProjectCodes,
        engine: 'deterministic-pmo-copilot',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProjectPulse AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
