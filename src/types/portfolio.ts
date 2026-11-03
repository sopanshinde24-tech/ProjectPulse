export type Department = 'Technology' | 'Finance' | 'Operations' | 'Marketing';

export type ProjectStatus = 'Active' | 'Completed' | 'Delayed' | 'At Risk';

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type HealthStatus = 'Green' | 'Amber' | 'Red';

export type MilestoneStatus = 'Completed' | 'In Progress' | 'Overdue' | 'Upcoming';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';

export type RiskCategory =
  | 'Schedule'
  | 'Budget'
  | 'Financial'
  | 'Technical'
  | 'Operational'
  | 'Vendor'
  | 'External'
  | 'Compliance'
  | 'Resource';

export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type RiskStatus = 'Open' | 'Mitigating' | 'Resolved' | 'Escalated';

export type IssueStatus = 'Open' | 'Investigating' | 'Resolved' | 'Escalated';

export type DependencyType = 'Finish-to-Start' | 'Start-to-Start' | 'Finish-to-Finish';

export type DependencyStatus = 'Active' | 'Fulfilled' | 'At Risk' | 'Blocked';

export type UserAppRole =
  | 'Administrator'
  | 'Project Manager'
  | 'Team Member'
  | 'Executive / Viewer';

export type ReportPeriodType = 'Weekly' | 'Monthly';

export type ReportCategoryType =
  | 'Portfolio Status Report'
  | 'Project Progress Report'
  | 'Milestone Report'
  | 'Risk Register Report'
  | 'Budget Variance Report'
  | 'Task Completion Report'
  | 'Department Performance Report'
  | 'Weekly Executive Summary';

export type AIOperationType =
  | 'status_summary'
  | 'risk_explanation'
  | 'weekly_report'
  | 'delay_analysis'
  | 'executive_summary'
  | 'recommended_actions';

export type ReportReviewStatus = 'Draft — Pending Human Review' | 'Reviewed & Approved';

export interface MonthlySpendPoint {
  month: string; // e.g., 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
  planned: number;
  actual: number;
  plannedProgress: number;
  actualProgress: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  department: Department;
  owner: string;
  ownerRole: string;
  startDate: string;
  endDate: string;
  allocatedBudget: number;
  actualSpend: number;
  plannedSpend?: number;
  status: ProjectStatus;
  priority?: ProjectPriority;
  category?: string;
  progress: number; // 0..100
  plannedProgress?: number; // 0..100
  description: string;
  strategicObjective: string;
  teamMemberIds?: string[];
  monthlySpend?: MonthlySpendPoint[];
  isSynthetic: boolean;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  code: string;
  title: string;
  owner: string;
  plannedDate: string;
  actualDate: string | null;
  status: MilestoneStatus;
  completionPercent: number; // 0..100
  deliverableNotes: string;
  dependencyIds?: string[];
  isSynthetic: boolean;
  updatedAt: string;
}

export interface MilestoneHistoryEntry {
  id: string;
  milestoneId: string;
  projectId: string;
  timestamp: string;
  author: string;
  previousPercent: number;
  newPercent: number;
  previousStatus: MilestoneStatus;
  newStatus: MilestoneStatus;
  note: string;
}

export interface RiskItem {
  id: string;
  projectId: string;
  code: string;
  description: string;
  category: RiskCategory;
  probability: number; // 1..5
  impact: number; // 1..5
  riskScore: number; // probability * impact (1..25)
  owner: string;
  mitigationPlan: string;
  mitigationProgress: number; // 0..100
  targetResolutionDate?: string;
  status: RiskStatus;
  isSynthetic: boolean;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  assigneeName: string;
  priority: ProjectPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  completedDate: string | null;
  dependencyIds: string[];
  isSynthetic: boolean;
  updatedAt: string;
}

export interface IssueItem {
  id: string;
  code: string;
  title: string;
  description: string;
  projectId: string;
  priority: ProjectPriority;
  owner: string;
  reportedDate: string;
  targetResolutionDate: string;
  status: IssueStatus;
  relatedTaskId?: string | null;
  relatedRiskId?: string | null;
  resolutionNotes?: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  projectId: string;
  blockingTaskId: string;
  blockedTaskId: string;
  dependencyType: DependencyType;
  status: DependencyStatus;
  notes: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  designation: string;
  appRole: UserAppRole;
  department: Department;
  location: string;
  weeklyCapacityHours: number;
  avatarInitials: string;
}

export interface TeamMemberWorkload extends TeamMember {
  assignedProjectsCount: number;
  assignedProjectCodes: string[];
  activeTasksCount: number;
  completedTasksCount: number;
  blockedTasksCount: number;
  overdueTasksCount: number;
  allocatedWeeklyHours: number;
  utilizationPercent: number; // allocatedWeeklyHours / weeklyCapacityHours * 100
  workloadStatus: 'Optimal' | 'Overallocated' | 'Underutilized';
}

export interface ActivityLogEntry {
  id: string;
  userName: string;
  userRole: UserAppRole | string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Completed' | 'Escalated' | 'Generated' | 'Approved' | 'Intervention';
  entityType: 'Project' | 'Task' | 'Milestone' | 'Risk' | 'Issue' | 'Budget' | 'Report' | 'System';
  entityCode: string;
  projectId?: string;
  timestamp: string;
  description: string;
}

export interface PortfolioNotification {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  category: 'Milestone' | 'Risk' | 'Task' | 'Budget' | 'Issue';
  title: string;
  description: string;
  projectCode: string;
  projectId: string;
  targetModule: ActiveModuleId;
  timestamp: string;
}

export interface ReportDelayedHighlight {
  projectCode: string;
  projectName: string;
  department: Department;
  owner: string;
  scheduleSlippageNote: string;
  budgetVarianceFormatted: string;
  overdueMilestoneCount: number;
}

export interface ReportMajorRiskHighlight {
  riskCode: string;
  projectCode: string;
  description: string;
  riskScore: number;
  severity: RiskSeverity;
  mitigationProgress: number;
  status: RiskStatus;
}

export interface ReportRecommendation {
  id: string;
  priority: 'Immediate (24–48h)' | 'High (This Week)' | 'Standard (This Month)';
  targetProjectCode: string;
  action: string;
  recommendedOwner: string;
  expectedImpact: string;
  supportingEvidence: string[];
}

export interface ExecutiveReport {
  id: string;
  title: string;
  periodType: ReportPeriodType;
  reportCategory?: ReportCategoryType;
  generatedAt: string;
  author: string;
  reviewStatus: ReportReviewStatus;
  reviewerNotes: string;
  executiveSummary: string;
  delayedHighlights: ReportDelayedHighlight[];
  majorRisks: ReportMajorRiskHighlight[];
  recommendations: ReportRecommendation[];
  kpiSnapshot: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    atRiskProjects: number;
    totalAllocatedBudget: number;
    totalActualSpend: number;
    budgetVariance: number;
    budgetUtilizationPercent: number;
    overdueMilestonesCount: number;
    criticalUnresolvedRisksCount: number;
    healthCounts: { Green: number; Amber: number; Red: number };
  };
  isAiGenerated: boolean;
}

export interface PortfolioState {
  projects: Project[];
  milestones: Milestone[];
  milestoneHistory: MilestoneHistoryEntry[];
  risks: RiskItem[];
  tasks?: TaskItem[];
  issues?: IssueItem[];
  dependencies?: TaskDependency[];
  teamMembers?: TeamMember[];
  activityLog?: ActivityLogEntry[];
  etlRuns?: ETLPipelineRun[];
  reports: ExecutiveReport[];
  referenceDate: string;
  storageMode?: 'sqlite-server' | 'local-fallback';
}

export type ETLSourceFormat = 'CSV' | 'JSON' | 'REST API';
export type ETLEntityTarget = 'Projects' | 'Tasks' | 'Combined Batch';
export type ETLImportMode = 'upsert' | 'skip_duplicates' | 'strict_reject_duplicates';

export interface ETLValidationIssue {
  id: string;
  rowNumber: number;
  entityType: 'Project' | 'Task' | 'Milestone' | 'Risk' | 'Issue';
  entityCode: string;
  field: string;
  rule:
    | 'REQUIRED_FIELD'
    | 'SCHEMA_TYPE_ERROR'
    | 'DUPLICATE_KEY'
    | 'FOREIGN_KEY_ORPHAN'
    | 'DOMAIN_RANGE_VIOLATION';
  severity: 'Rejected' | 'Duplicate (Upserted)' | 'Duplicate (Skipped)' | 'Normalized Warning';
  message: string;
  rawPayload: string;
}

export interface ETLTransformationItem {
  entityCode: string;
  entityType: 'Project' | 'Task';
  operation: 'INSERT' | 'UPSERT_MERGE' | 'REJECTED' | 'SKIPPED_DUPLICATE';
  fieldsNormalized: string[];
  computedMetricsSummary: string;
}

export interface ETLPipelineRun {
  id: string;
  runCode: string;
  batchName: string;
  sourceFormat: ETLSourceFormat;
  entityTarget: ETLEntityTarget;
  importMode: ETLImportMode;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'Completed' | 'Completed with Warnings' | 'Rejected';
  totalRecords: number;
  validRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  duplicateRecords: number;
  rejectedRecords: number;
  qualityScore: number;
  triggeredBy: string;
  validationIssues: ETLValidationIssue[];
  transformationSummary: ETLTransformationItem[];
  executionLogs: string[];
}

export interface DataQualityDimension {
  dimension:
    | 'Completeness'
    | 'Referential Integrity'
    | 'Uniqueness'
    | 'Domain Validity'
    | 'Timeliness & Freshness';
  score: number;
  passedRecords: number;
  totalChecked: number;
  ruleDescription: string;
  status: 'Optimal' | 'Attention' | 'Critical';
}

export interface RelationalIntegrityCheck {
  relationship: string;
  childTable: string;
  parentTable: string;
  foreignKeyColumn: string;
  totalChildRows: number;
  validLinkedRows: number;
  orphanedRows: number;
  status: 'Verified (0 Orphans)' | 'Orphan Detected';
}

export interface DataQualityAudit {
  overallScore: number;
  totalDatabaseRecords: number;
  dimensions: DataQualityDimension[];
  relationalChecks: RelationalIntegrityCheck[];
  kpiFormulaRegistry: {
    kpiName: string;
    category: 'Schedule' | 'Financial' | 'Governance' | 'Resource' | 'Execution';
    sqlAndMathFormula: string;
    sourceTables: string;
    currentCalculatedValue: string;
  }[];
}

export interface BudgetMetrics {
  allocatedBudget: number;
  actualSpend: number;
  plannedSpend: number;
  remainingBudget: number; // allocatedBudget - actualSpend
  variance: number; // actualSpend - allocatedBudget (positive = overrun)
  variancePercent: number;
  utilizationPercent: number;
  isOverBudget: boolean;
}

export interface ProjectComputedMetrics extends BudgetMetrics {
  projectId: string;
  health: HealthStatus;
  healthReasons: string[];
  requiresAttention: boolean;
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  milestoneCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  openRisksCount: number;
  criticalRisksCount: number;
  maxRiskScore: number;
  openIssuesCount: number;
}

export interface DepartmentPerformance {
  department: Department;
  projectCount: number;
  activeCount: number;
  completedCount: number;
  delayedCount: number;
  atRiskCount: number;
  averageProgress: number;
  allocatedBudget: number;
  actualSpend: number;
  plannedSpend: number;
  remainingBudget: number;
  variance: number;
  utilizationPercent: number;
  overBudgetProjectsCount: number;
  milestoneCompletionRate: number;
  overdueMilestones: number;
  criticalRisks: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  healthCounts: { Green: number; Amber: number; Red: number };
}

export interface DashboardKPIs {
  totalProjects: number;
  onTrackProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  atRiskProjects: number;
  attentionRequiredCount: number;
  totalAllocatedBudget: number;
  totalActualSpend: number;
  totalPlannedSpend: number;
  totalRemainingBudget: number;
  totalBudgetVariance: number;
  budgetUtilizationPercent: number;
  overBudgetProjectsCount: number;
  averagePortfolioProgress: number;
  averagePlannedProgress: number;
  healthDistribution: {
    Green: number;
    Amber: number;
    Red: number;
  };
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  inProgressMilestones: number;
  upcomingMilestones: number;
  milestoneCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  totalRisks: number;
  unresolvedRisks: number;
  criticalUnresolvedRisks: number;
  highUnresolvedRisks: number;
  averageRiskScore: number;
  totalIssues: number;
  openIssues: number;
  criticalIssues: number;
  departmentPerformance: DepartmentPerformance[];
  projectMetricsMap: Record<string, ProjectComputedMetrics>;
  teamWorkloads: TeamMemberWorkload[];
  monthlyPortfolioTrend: MonthlySpendPoint[];
  notifications: PortfolioNotification[];
}

export type ActiveModuleId =
  | 'dashboard'
  | 'portfolio'
  | 'my-projects'
  | 'project-details'
  | 'tasks'
  | 'milestones'
  | 'gantt'
  | 'risks'
  | 'issues'
  | 'budget'
  | 'data-pipeline'
  | 'ai-assistant'
  | 'reports'
  | 'team'
  | 'activity-log'
  | 'settings'
  | 'qa-video';

export interface GuidedDemoStep {
  stepNumber: number;
  title: string;
  module: ActiveModuleId;
  description: string;
  evidenceCallout: string;
  actionLabel: string;
}

