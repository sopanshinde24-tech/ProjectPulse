/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Database,
  DollarSign,
  FileSpreadsheet,
  FolderKanban,
  GanttChart,
  Layers,
  ListTodo,
  Menu,
  Pin,
  PinOff,
  Play,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ActivityLogView } from './components/ActivityLogView';
import { AIChatbotWidget } from './components/AIChatbotWidget';
import { AIExecutiveAssistantView } from './components/AIExecutiveAssistantView';
import { BudgetMonitoringView } from './components/BudgetMonitoringView';
import { DataEngineeringView } from './components/DataEngineeringView';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { GUIDED_DEMO_STEPS, GuidedDemoBar } from './components/GuidedDemoBar';
import { IssuesDependenciesView } from './components/IssuesDependenciesView';
import { ManagementReportingView } from './components/ManagementReportingView';
import { MilestoneTrackingView } from './components/MilestoneTrackingView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { ProjectInspectorModal } from './components/ProjectInspectorModal';
import { ProjectPortfolioView } from './components/ProjectPortfolioView';
import { QAVideoPackageView } from './components/QAVideoPackageView';
import { RiskManagementView } from './components/RiskManagementView';
import { SettingsView } from './components/SettingsView';
import { TasksDeliverablesView } from './components/TasksDeliverablesView';
import { TeamMembersView } from './components/TeamMembersView';
import { TimelineGanttView } from './components/TimelineGanttView';
import { createInitialSeedState, SOPAN_SHINDE_AVATAR_URL } from './data/seedData';
import {
  ActiveModuleId,
  ActivityLogEntry,
  Department,
  ETLPipelineRun,
  ExecutiveReport,
  HealthStatus,
  IssueItem,
  IssueStatus,
  Milestone,
  MilestoneHistoryEntry,
  MilestoneStatus,
  PortfolioState,
  Project,
  RiskItem,
  RiskStatus,
  TaskDependency,
  TaskItem,
  TaskStatus,
  TeamMember,
  UserAppRole,
} from './types/portfolio';
import { calculateRiskScore, computeDashboardKPIs } from './utils/calculations';

const LOCAL_STORAGE_KEY = 'projectpulse_pwc_india_state_v4';

interface SidebarGroup {
  groupLabel: string;
  items: {
    id: ActiveModuleId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeTone?: 'danger' | 'warning' | 'neutral';
  }[];
}

export default function App() {
  const [state, setState] = useState<PortfolioState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PortfolioState;
        if (
          parsed &&
          Array.isArray(parsed.projects) &&
          parsed.projects.length > 0 &&
          Array.isArray(parsed.tasks) &&
          parsed.tasks.length > 0
        ) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed state
    }
    return createInitialSeedState();
  });

  const [activeModule, setActiveModule] = useState<ActiveModuleId>('dashboard');
  const [selectedProjectIdForDetails, setSelectedProjectIdForDetails] =
    useState<string>('prj-102');
  const [inspectedProjectId, setInspectedProjectId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDrawerPinned, setIsDrawerPinned] = useState<boolean>(false);

  // RBAC User Role & Active Persona State
  const [currentUserRole, setCurrentUserRole] = useState<UserAppRole>('Administrator');
  const [currentUserName, setCurrentUserName] = useState<string>('Sopan Shinde');

  // Global Search & Notifications Popovers
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  const [portfolioFilterJump, setPortfolioFilterJump] = useState<{
    department?: Department | 'All';
    status?: string;
    health?: HealthStatus | 'All';
  }>({});

  // Guided Demo State
  const [isGuidedDemoActive, setIsGuidedDemoActive] = useState<boolean>(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0);
  const [isDemoAutoPlaying, setIsDemoAutoPlaying] = useState<boolean>(false);
  const [demoInterventionApplied, setDemoInterventionApplied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  // Load state from SQLite server on mount
  useEffect(() => {
    let mounted = true;
    fetch('/api/portfolio')
      .then((res) => {
        if (!res.ok) throw new Error('Server unavailable');
        return res.json();
      })
      .then((serverState: PortfolioState) => {
        if (mounted && serverState && Array.isArray(serverState.projects)) {
          setState({ ...serverState, storageMode: 'sqlite-server' });
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverState));
        }
      })
      .catch(() => {
        if (mounted) {
          setState((prev) => ({ ...prev, storageMode: 'local-fallback' }));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to check RBAC write permission and commit state + activity log
  const commitPortfolioState = useCallback(
    (
      updater: (prev: PortfolioState) => PortfolioState,
      activityEvent?: Omit<ActivityLogEntry, 'id' | 'userName' | 'userRole' | 'timestamp'>,
      requireManagerOrAdmin = false
    ) => {
      if (currentUserRole === 'Executive / Viewer') {
        showToast(
          `RBAC Notice: ${currentUserName} (${currentUserRole}) has Read-Only access. Switch to Project Manager or Administrator to make changes.`
        );
        return false;
      }
      if (requireManagerOrAdmin && currentUserRole === 'Team Member') {
        showToast(
          `RBAC Notice: Team Members can update Tasks, Milestones & Issues, but only Project Managers or Administrators can modify Portfolio Budgets or delete Projects.`
        );
        return false;
      }

      setState((prev) => {
        const updated = updater(prev);
        const nextActivityLog = activityEvent
          ? [
              {
                id: `act-${Date.now()}`,
                userName: currentUserName,
                userRole: currentUserRole,
                timestamp: new Date().toISOString(),
                ...activityEvent,
              },
              ...(updated.activityLog || []),
            ]
          : updated.activityLog || [];

        const next: PortfolioState = {
          ...updated,
          activityLog: nextActivityLog,
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota errors
        }

        fetch('/api/portfolio/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUserRole,
          },
          body: JSON.stringify(next),
        }).catch(() => {
          // Resilient local fallback already saved
        });

        return next;
      });
      return true;
    },
    [currentUserName, currentUserRole, showToast]
  );

  const kpis = useMemo(() => computeDashboardKPIs(state), [state]);

  const inspectedProject = useMemo(
    () => state.projects.find((p) => p.id === inspectedProjectId) || null,
    [state.projects, inspectedProjectId]
  );

  // Global Search Results across Projects, Tasks, Milestones, Risks, Issues, and Team
  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.toLowerCase().trim();
    if (!q) return null;

    const projects = state.projects
      .filter((p) =>
        `${p.code} ${p.name} ${p.owner} ${p.department}`.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const tasks = (state.tasks || [])
      .filter((t) => `${t.code} ${t.title} ${t.assigneeName}`.toLowerCase().includes(q))
      .slice(0, 4);
    const milestones = state.milestones
      .filter((m) => `${m.code} ${m.title} ${m.owner}`.toLowerCase().includes(q))
      .slice(0, 3);
    const risks = state.risks
      .filter((r) => `${r.code} ${r.description} ${r.owner}`.toLowerCase().includes(q))
      .slice(0, 3);
    const team = (state.teamMembers || [])
      .filter((tm) => `${tm.name} ${tm.designation} ${tm.location}`.toLowerCase().includes(q))
      .slice(0, 3);

    return { projects, tasks, milestones, risks, team };
  }, [globalSearchQuery, state]);

  // Portfolio CRUD handlers
  const handleSaveProject = useCallback(
    (project: Project, isNew: boolean) => {
      const ok = commitPortfolioState(
        (prev) => {
          const nextProjects = isNew
            ? [project, ...prev.projects]
            : prev.projects.map((p) => (p.id === project.id ? project : p));
          return { ...prev, projects: nextProjects };
        },
        {
          action: isNew ? 'Created' : 'Updated',
          entityType: 'Project',
          entityCode: project.code,
          projectId: project.id,
          description: `${isNew ? 'Created' : 'Updated'} project ${project.code} (${project.name}).`,
        },
        true
      );
      if (ok) {
        showToast(
          isNew
            ? `Created engagement ${project.code} (${project.name}).`
            : `Updated engagement ${project.code} (${project.name}).`
        );
      }
    },
    [commitPortfolioState, showToast]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      const target = state.projects.find((p) => p.id === projectId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== projectId),
          milestones: prev.milestones.filter((m) => m.projectId !== projectId),
          milestoneHistory: prev.milestoneHistory.filter((h) => h.projectId !== projectId),
          risks: prev.risks.filter((r) => r.projectId !== projectId),
          tasks: (prev.tasks || []).filter((t) => t.projectId !== projectId),
          issues: (prev.issues || []).filter((i) => i.projectId !== projectId),
        }),
        {
          action: 'Deleted',
          entityType: 'Project',
          entityCode: target?.code || projectId,
          projectId,
          description: `Deleted engagement ${target?.code || projectId} and linked records.`,
        },
        true
      );
      if (ok) {
        if (inspectedProjectId === projectId) setInspectedProjectId(null);
        if (target) showToast(`Deleted engagement ${target.code} and linked records.`);
      }
    },
    [commitPortfolioState, inspectedProjectId, showToast, state.projects]
  );

  const handleUpdateProjectDates = useCallback(
    (projectId: string, startDate: string, endDate: string) => {
      const target = state.projects.find((p) => p.id === projectId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === projectId
              ? { ...p, startDate, endDate, updatedAt: new Date().toISOString() }
              : p
          ),
        }),
        {
          action: 'Updated',
          entityType: 'Project',
          entityCode: target?.code || projectId,
          projectId,
          description: `Adjusted Gantt schedule dates for ${target?.code || projectId} to ${startDate} → ${endDate}.`,
        }
      );
      if (ok) showToast(`Updated schedule dates for ${target?.code || projectId}.`);
    },
    [commitPortfolioState, showToast, state.projects]
  );

  const handleImportProjects = useCallback(
    (imported: Partial<Project>[]) => {
      const ok = commitPortfolioState(
        (prev) => {
          const added: Project[] = imported.map((item, idx) => ({
            id: `prj-imp-${Date.now()}-${idx}`,
            code: item.code || `PRJ-${prev.projects.length + 101 + idx}`,
            name: item.name || `Imported Engagement ${idx + 1}`,
            department: item.department || 'Technology',
            owner: item.owner || 'Aarav Mehta',
            ownerRole: item.ownerRole || 'Partner, Advisory (PwC India)',
            startDate: item.startDate || '2026-06-01',
            endDate: item.endDate || '2026-12-31',
            allocatedBudget: item.allocatedBudget ?? 600000,
            actualSpend: item.actualSpend ?? 350000,
            status: item.status || 'Active',
            priority: 'High',
            progress: item.progress ?? 50,
            description: item.description || 'Imported synthetic demonstration project record.',
            strategicObjective: item.strategicObjective || 'Imported via CSV portfolio batch.',
            isSynthetic: true,
            updatedAt: new Date().toISOString(),
          }));
          return { ...prev, projects: [...prev.projects, ...added] };
        },
        {
          action: 'Created',
          entityType: 'Project',
          entityCode: 'CSV-BATCH',
          description: `Imported ${imported.length} project record(s) from CSV.`,
        },
        true
      );
      if (ok) showToast(`Imported ${imported.length} engagement record(s) from CSV.`);
    },
    [commitPortfolioState, showToast]
  );

  // Task handlers
  const handleAddTask = useCallback(
    (task: TaskItem) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          tasks: [task, ...(prev.tasks || [])],
        }),
        {
          action: 'Created',
          entityType: 'Task',
          entityCode: task.code,
          projectId: task.projectId,
          description: `Created deliverable task ${task.code} ("${task.title}") assigned to ${task.assigneeName}.`,
        }
      );
      if (ok) showToast(`Created task ${task.code} (${task.title}).`);
    },
    [commitPortfolioState, showToast]
  );

  const handleUpdateTask = useCallback(
    (updatedTask: TaskItem) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          tasks: (prev.tasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        }),
        {
          action: updatedTask.status === 'Completed' ? 'Completed' : 'Updated',
          entityType: 'Task',
          entityCode: updatedTask.code,
          projectId: updatedTask.projectId,
          description: `Updated task ${updatedTask.code} ("${updatedTask.title}") status to ${updatedTask.status}.`,
        }
      );
      if (ok) showToast(`Updated task ${updatedTask.code} to ${updatedTask.status}.`);
    },
    [commitPortfolioState, showToast]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      const target = (state.tasks || []).find((t) => t.id === taskId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          tasks: (prev.tasks || []).filter((t) => t.id !== taskId),
        }),
        {
          action: 'Deleted',
          entityType: 'Task',
          entityCode: target?.code || taskId,
          projectId: target?.projectId,
          description: `Deleted deliverable task ${target?.code || taskId}.`,
        }
      );
      if (ok) showToast(`Deleted task ${target?.code || taskId}.`);
    },
    [commitPortfolioState, showToast, state.tasks]
  );

  // Milestone handlers
  const handleAddMilestone = useCallback(
    (milestone: Milestone, historyNote: string) => {
      const ok = commitPortfolioState(
        (prev) => {
          const historyEntry: MilestoneHistoryEntry = {
            id: `mh-${Date.now()}`,
            milestoneId: milestone.id,
            projectId: milestone.projectId,
            timestamp: new Date().toISOString(),
            author: milestone.owner,
            previousPercent: 0,
            newPercent: milestone.completionPercent,
            previousStatus: 'Upcoming',
            newStatus: milestone.status,
            note: historyNote,
          };
          return {
            ...prev,
            milestones: [...prev.milestones, milestone],
            milestoneHistory: [historyEntry, ...prev.milestoneHistory],
          };
        },
        {
          action: 'Created',
          entityType: 'Milestone',
          entityCode: milestone.code,
          projectId: milestone.projectId,
          description: `Added milestone ${milestone.code} (${milestone.title}).`,
        }
      );
      if (ok) showToast(`Added milestone ${milestone.code} (${milestone.title}).`);
    },
    [commitPortfolioState, showToast]
  );

  const handleUpdateMilestone = useCallback(
    (
      milestoneId: string,
      newStatus: MilestoneStatus,
      newPercent: number,
      actualDate: string | null,
      note: string
    ) => {
      const targetMs = state.milestones.find((m) => m.id === milestoneId);
      const ok = commitPortfolioState(
        (prev) => {
          const target = prev.milestones.find((m) => m.id === milestoneId);
          if (!target) return prev;

          const updatedMs: Milestone = {
            ...target,
            status: newStatus,
            completionPercent: newPercent,
            actualDate,
            updatedAt: new Date().toISOString(),
          };

          const historyEntry: MilestoneHistoryEntry = {
            id: `mh-${Date.now()}`,
            milestoneId: target.id,
            projectId: target.projectId,
            timestamp: new Date().toISOString(),
            author: target.owner,
            previousPercent: target.completionPercent,
            newPercent,
            previousStatus: target.status,
            newStatus,
            note,
          };

          const nextMilestones = prev.milestones.map((m) =>
            m.id === milestoneId ? updatedMs : m
          );

          const siblingMilestones = nextMilestones.filter(
            (m) => m.projectId === target.projectId
          );
          const avgProgress =
            siblingMilestones.length > 0
              ? Math.round(
                  siblingMilestones.reduce((s, m) => s + m.completionPercent, 0) /
                    siblingMilestones.length
                )
              : 50;

          const nextProjects = prev.projects.map((p) =>
            p.id === target.projectId
              ? {
                  ...p,
                  progress: avgProgress,
                  status: avgProgress === 100 ? ('Completed' as const) : p.status,
                  updatedAt: new Date().toISOString(),
                }
              : p
          );

          return {
            ...prev,
            projects: nextProjects,
            milestones: nextMilestones,
            milestoneHistory: [historyEntry, ...prev.milestoneHistory],
          };
        },
        {
          action: newStatus === 'Completed' ? 'Completed' : 'Updated',
          entityType: 'Milestone',
          entityCode: targetMs?.code || milestoneId,
          projectId: targetMs?.projectId,
          description: `Updated milestone ${targetMs?.code || milestoneId} to ${newPercent}% (${newStatus}).`,
        }
      );
      if (ok) showToast(`Milestone updated and progress history logged.`);
    },
    [commitPortfolioState, showToast, state.milestones]
  );

  // Risk handlers
  const handleAddRisk = useCallback(
    (risk: RiskItem) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          risks: [risk, ...prev.risks],
        }),
        {
          action: 'Created',
          entityType: 'Risk',
          entityCode: risk.code,
          projectId: risk.projectId,
          description: `Logged risk ${risk.code} (Score ${risk.riskScore}/25): ${risk.description}`,
        }
      );
      if (ok) showToast(`Logged risk ${risk.code} (Score ${risk.riskScore}/25).`);
    },
    [commitPortfolioState, showToast]
  );

  const handleUpdateRisk = useCallback(
    (
      riskId: string,
      mitigationProgress: number,
      status: RiskStatus,
      probability?: number,
      impact?: number
    ) => {
      const targetRisk = state.risks.find((r) => r.id === riskId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          risks: prev.risks.map((r) => {
            if (r.id !== riskId) return r;
            const nextProb = probability ?? r.probability;
            const nextImp = impact ?? r.impact;
            return {
              ...r,
              probability: nextProb,
              impact: nextImp,
              riskScore: calculateRiskScore(nextProb, nextImp),
              mitigationProgress,
              status,
              updatedAt: new Date().toISOString(),
            };
          }),
        }),
        {
          action: 'Updated',
          entityType: 'Risk',
          entityCode: targetRisk?.code || riskId,
          projectId: targetRisk?.projectId,
          description: `Updated risk ${targetRisk?.code || riskId} mitigation progress to ${mitigationProgress}% (${status}).`,
        }
      );
      if (ok) showToast(`Updated risk mitigation progress (${mitigationProgress}%).`);
    },
    [commitPortfolioState, showToast, state.risks]
  );

  // Issue & Dependency handlers
  const handleAddIssue = useCallback(
    (issue: IssueItem) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          issues: [issue, ...(prev.issues || [])],
        }),
        {
          action: 'Created',
          entityType: 'Issue',
          entityCode: issue.code,
          projectId: issue.projectId,
          description: `Logged blocker/issue ${issue.code} ("${issue.title}").`,
        }
      );
      if (ok) showToast(`Logged issue ${issue.code} (${issue.title}).`);
    },
    [commitPortfolioState, showToast]
  );

  const handleUpdateIssueStatus = useCallback(
    (issueId: string, status: IssueStatus, resolutionNotes?: string) => {
      const target = (state.issues || []).find((i) => i.id === issueId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          issues: (prev.issues || []).map((iss) =>
            iss.id === issueId
              ? {
                  ...iss,
                  status,
                  resolutionNotes: resolutionNotes ?? iss.resolutionNotes,
                  updatedAt: new Date().toISOString(),
                }
              : iss
          ),
        }),
        {
          action: status === 'Escalated' ? 'Escalated' : status === 'Resolved' ? 'Completed' : 'Updated',
          entityType: 'Issue',
          entityCode: target?.code || issueId,
          projectId: target?.projectId,
          description: `Updated issue ${target?.code || issueId} status to ${status}.`,
        }
      );
      if (ok) showToast(`Updated issue ${target?.code || issueId} status to ${status}.`);
    },
    [commitPortfolioState, showToast, state.issues]
  );

  const handleAddDependency = useCallback(
    (dep: TaskDependency) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          dependencies: [...(prev.dependencies || []), dep],
        }),
        {
          action: 'Created',
          entityType: 'Task',
          entityCode: dep.id.toUpperCase(),
          projectId: dep.projectId,
          description: `Linked ${dep.dependencyType} dependency (${dep.notes}).`,
        }
      );
      if (ok) showToast(`Linked ${dep.dependencyType} task dependency.`);
    },
    [commitPortfolioState, showToast]
  );

  // Team Member handlers
  const handleAddTeamMember = useCallback(
    (member: TeamMember) => {
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          teamMembers: [...(prev.teamMembers || []), member],
        }),
        {
          action: 'Created',
          entityType: 'System',
          entityCode: member.avatarInitials,
          description: `Added team member ${member.name} (${member.designation}, ${member.weeklyCapacityHours}h/wk).`,
        },
        true
      );
      if (ok) showToast(`Added ${member.name} to advisory team directory.`);
    },
    [commitPortfolioState, showToast]
  );

  const handleUpdateMemberCapacity = useCallback(
    (memberId: string, capacityHours: number, appRole: UserAppRole) => {
      const target = (state.teamMembers || []).find((m) => m.id === memberId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          teamMembers: (prev.teamMembers || []).map((m) =>
            m.id === memberId
              ? { ...m, weeklyCapacityHours: capacityHours, appRole }
              : m
          ),
        }),
        {
          action: 'Updated',
          entityType: 'System',
          entityCode: target?.avatarInitials || 'TEAM',
          description: `Updated ${target?.name || memberId} weekly capacity to ${capacityHours}h/wk.`,
        }
      );
      if (ok) showToast(`Updated ${target?.name || 'member'} capacity to ${capacityHours}h/wk.`);
    },
    [commitPortfolioState, showToast, state.teamMembers]
  );

  // Budget handler
  const handleUpdateProjectBudget = useCallback(
    (projectId: string, allocatedBudget: number, actualSpend: number) => {
      const target = state.projects.find((p) => p.id === projectId);
      const ok = commitPortfolioState(
        (prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  allocatedBudget,
                  actualSpend,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }),
        {
          action: 'Updated',
          entityType: 'Budget',
          entityCode: target?.code || projectId,
          projectId,
          description: `Updated budget telemetry for ${target?.code || projectId}: Approved $${allocatedBudget.toLocaleString()}, Actual $${actualSpend.toLocaleString()}.`,
        },
        true
      );
      if (ok) showToast(`Updated engagement budget allocation and actual expenditure.`);
    },
    [commitPortfolioState, showToast, state.projects]
  );

  // Report handler
  const handleSaveReport = useCallback(
    (report: ExecutiveReport) => {
      const ok = commitPortfolioState(
        (prev) => {
          const exists = prev.reports.some((r) => r.id === report.id);
          const nextReports = exists
            ? prev.reports.map((r) => (r.id === report.id ? report : r))
            : [report, ...prev.reports];
          return { ...prev, reports: nextReports };
        },
        {
          action: 'Approved',
          entityType: 'Report',
          entityCode: report.periodType.toUpperCase(),
          description: `Saved and approved report "${report.title}".`,
        }
      );
      if (ok) showToast(`Saved executive report "${report.title}".`);
    },
    [commitPortfolioState, showToast]
  );

  // Quick Intervention helper (shared by Guided Demo Step 7, Dashboard button, and AI Chatbot)
  const executeQuickInterventionPRJ102 = useCallback(() => {
    commitPortfolioState(
      (prev) => {
        const targetMs = prev.milestones.find((m) => m.code === 'MS-102-2');
        const nextMilestones = prev.milestones.map((m) =>
          m.code === 'MS-102-2'
            ? {
                ...m,
                status: 'Completed' as const,
                completionPercent: 100,
                actualDate: prev.referenceDate,
                updatedAt: new Date().toISOString(),
              }
            : m
        );

        const nextHistory: MilestoneHistoryEntry[] = targetMs
          ? [
              {
                id: `mh-demo-${Date.now()}`,
                milestoneId: targetMs.id,
                projectId: targetMs.projectId,
                timestamp: new Date().toISOString(),
                author: 'Ananya Iyer (Executive Director, PwC Mumbai)',
                previousPercent: targetMs.completionPercent,
                newPercent: 100,
                previousStatus: targetMs.status,
                newStatus: 'Completed',
                note: 'Deployed async CDC log reader; Mainframe Dual-Write Cutover verified 100% complete across RTGS/NEFT windows.',
              },
              ...prev.milestoneHistory,
            ]
          : prev.milestoneHistory;

        const nextRisks = prev.risks.map((r) =>
          r.code === 'RSK-102-A'
            ? {
                ...r,
                mitigationProgress: 85,
                status: 'Mitigating' as const,
                updatedAt: new Date().toISOString(),
              }
            : r
        );

        const nextTasks = (prev.tasks || []).map((t) =>
          t.code === 'TSK-105'
            ? {
                ...t,
                status: 'Completed' as const,
                actualHours: t.estimatedHours,
                completedDate: prev.referenceDate,
                updatedAt: new Date().toISOString(),
              }
            : t
        );

        const nextProjects = prev.projects.map((p) =>
          p.code === 'PRJ-102'
            ? {
                ...p,
                progress: 74,
                updatedAt: new Date().toISOString(),
              }
            : p
        );

        return {
          ...prev,
          projects: nextProjects,
          milestones: nextMilestones,
          milestoneHistory: nextHistory,
          risks: nextRisks,
          tasks: nextTasks,
        };
      },
      {
        action: 'Intervention',
        entityType: 'Milestone',
        entityCode: 'MS-102-2',
        projectId: 'prj-102',
        description:
          'Executed PRJ-102 Recovery Sprint: Completed MS-102-2 (100%), unblocked TSK-105, and advanced RSK-102-A mitigation to 85%.',
      }
    );
    setDemoInterventionApplied(true);
    showToast(
      'Intervention Applied: Ananya Iyer completed MS-102-2 (100%), unblocked TSK-105 & advanced RSK-102-A mitigation to 85%.'
    );
  }, [commitPortfolioState, showToast]);

  // Reset Demo Data
  const handleResetDemoData = useCallback(async () => {
    const fresh = createInitialSeedState();
    setState(fresh);
    setDemoInterventionApplied(false);
    setInspectedProjectId(null);
    setGuidedStepIndex(0);
    setIsDemoAutoPlaying(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    try {
      await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { 'x-user-role': 'Administrator' },
      });
    } catch {
      // Local reset already complete
    }
    showToast('Reset synthetic demonstration dataset to PwC India baseline (12 engagements).');
  }, [showToast]);

  // Guided Demo Step Transitions
  const applyGuidedStepEffects = useCallback(
    (stepIdx: number) => {
      const step = GUIDED_DEMO_STEPS[stepIdx];
      if (!step) return;

      setActiveModule(step.module);

      if (step.stepNumber === 1 || step.stepNumber === 2) {
        setInspectedProjectId(null);
      } else if (step.stepNumber === 3) {
        const prj102 = state.projects.find((p) => p.code === 'PRJ-102');
        if (prj102) {
          setInspectedProjectId(prj102.id);
        }
      } else if (step.stepNumber === 4 || step.stepNumber === 5 || step.stepNumber === 6) {
        setInspectedProjectId(null);
      } else if (step.stepNumber === 7) {
        setInspectedProjectId(null);
        executeQuickInterventionPRJ102();
      } else if (step.stepNumber === 8 || step.stepNumber === 9) {
        setInspectedProjectId(null);
      }
    },
    [executeQuickInterventionPRJ102, state.projects]
  );

  const handleStartGuidedDemo = () => {
    setIsGuidedDemoActive(true);
    setGuidedStepIndex(0);
    setIsDemoAutoPlaying(true);
    applyGuidedStepEffects(0);
  };

  const handleNextDemoStep = useCallback(() => {
    if (guidedStepIndex < GUIDED_DEMO_STEPS.length - 1) {
      const nextIdx = guidedStepIndex + 1;
      setGuidedStepIndex(nextIdx);
      applyGuidedStepEffects(nextIdx);
    } else {
      setIsDemoAutoPlaying(false);
      setIsGuidedDemoActive(false);
      showToast('PwC Partner Guided Demo completed. Explore all 15 PPM modules anytime!');
    }
  }, [applyGuidedStepEffects, guidedStepIndex, showToast]);

  const handlePrevDemoStep = () => {
    if (guidedStepIndex > 0) {
      const prevIdx = guidedStepIndex - 1;
      setGuidedStepIndex(prevIdx);
      applyGuidedStepEffects(prevIdx);
    }
  };

  const handleJumpToDemoStep = (idx: number) => {
    setGuidedStepIndex(idx);
    applyGuidedStepEffects(idx);
  };

  useEffect(() => {
    if (!isGuidedDemoActive || !isDemoAutoPlaying) return;
    const timer = setTimeout(() => {
      handleNextDemoStep();
    }, 4800);
    return () => clearTimeout(timer);
  }, [isGuidedDemoActive, isDemoAutoPlaying, guidedStepIndex, handleNextDemoStep]);

  const activeGuidedStepNumber = isGuidedDemoActive
    ? GUIDED_DEMO_STEPS[guidedStepIndex]?.stepNumber ?? null
    : null;

  // 5-Group Enterprise Sidebar Navigation
  const sidebarGroups: SidebarGroup[] = useMemo(
    () => [
      {
        groupLabel: 'WORKSPACE',
        items: [
          {
            id: 'dashboard',
            label: 'Executive Overview',
            icon: BarChart3,
          },
          {
            id: 'portfolio',
            label: 'Project Portfolio',
            icon: FolderKanban,
            badge: String(kpis.totalProjects),
            badgeTone: 'neutral',
          },
          {
            id: 'my-projects',
            label: 'My Projects',
            icon: UserCheck,
          },
        ],
      },
      {
        groupLabel: 'PROJECT DELIVERY',
        items: [
          {
            id: 'project-details',
            label: 'Project Details (8-Tab)',
            icon: Layers,
          },
          {
            id: 'tasks',
            label: 'Tasks & Deliverables',
            icon: ListTodo,
            badge: kpis.blockedTasks > 0 ? `${kpis.blockedTasks} blk` : String(kpis.totalTasks),
            badgeTone: kpis.blockedTasks > 0 ? 'danger' : 'neutral',
          },
          {
            id: 'milestones',
            label: 'Milestones',
            icon: CalendarCheck2,
            badge: kpis.overdueMilestones > 0 ? `${kpis.overdueMilestones} late` : undefined,
            badgeTone: 'danger',
          },
          {
            id: 'gantt',
            label: 'Timeline / Gantt',
            icon: GanttChart,
          },
        ],
      },
      {
        groupLabel: 'GOVERNANCE',
        items: [
          {
            id: 'risks',
            label: 'Risk Register',
            icon: AlertTriangle,
            badge: `${kpis.criticalUnresolvedRisks} crit`,
            badgeTone: 'danger',
          },
          {
            id: 'issues',
            label: 'Issues & Dependencies',
            icon: AlertOctagon,
            badge: String(kpis.openIssues),
            badgeTone: kpis.criticalIssues > 0 ? 'warning' : 'neutral',
          },
          {
            id: 'budget',
            label: 'Budget & Resources',
            icon: DollarSign,
          },
        ],
      },
      {
        groupLabel: 'INTELLIGENCE',
        items: [
          {
            id: 'data-pipeline',
            label: 'Data Pipeline & ETL',
            icon: Database,
            badge: `${(state.etlRuns || []).length || 2} Runs`,
            badgeTone: 'neutral',
          },
          {
            id: 'ai-assistant',
            label: 'AI Project Assistant',
            icon: Sparkles,
            badge: '6 Ops',
            badgeTone: 'neutral',
          },
          {
            id: 'reports',
            label: 'Reports & Analytics',
            icon: FileSpreadsheet,
            badge: String(state.reports.length),
            badgeTone: 'neutral',
          },
        ],
      },
      {
        groupLabel: 'ADMINISTRATION',
        items: [
          {
            id: 'team',
            label: 'Team & Members',
            icon: Users,
            badge: String((state.teamMembers || []).length),
            badgeTone: 'neutral',
          },
          {
            id: 'activity-log',
            label: 'Activity Log',
            icon: Activity,
          },
          {
            id: 'settings',
            label: 'Executive Profile & Settings',
            icon: Settings,
            badge: 'Sopan',
            badgeTone: 'neutral',
          },
          {
            id: 'qa-video',
            label: 'QA & Video Suite',
            icon: ShieldCheck,
            badge: '11/11',
            badgeTone: 'neutral',
          },
        ],
      },
    ],
    [kpis, state.etlRuns, state.reports.length, state.teamMembers]
  );

  // Active Breadcrumb computation
  const activeBreadcrumb = useMemo(() => {
    for (const grp of sidebarGroups) {
      const found = grp.items.find((i) => i.id === activeModule);
      if (found) {
        return { group: grp.groupLabel, page: found.label };
      }
    }
    return { group: 'WORKSPACE', page: 'Executive Overview' };
  }, [activeModule, sidebarGroups]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Global Enterprise Top Navigation Bar */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: 3-Line Slide-In Menu Trigger + Brand Wordmark + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="Open Navigation Menu"
            title="Click to slide in navigation menu and explore all modules"
            className="inline-flex items-center justify-center w-9 h-9 rounded border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('dashboard');
            }}
            className="text-base font-extrabold tracking-tight text-[#0F172A] font-display whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded bg-[#D04A02] text-white font-mono text-xs font-bold flex items-center justify-center">
              P
            </span>
            <span>ProjectPulse AI</span>
          </a>

          <span className="hidden md:inline text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            title="Click to switch module"
            className="hidden md:flex items-center gap-1.5 text-xs truncate px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="font-mono uppercase text-[10px] tracking-wider text-slate-400">
              {activeBreadcrumb.group}
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800 truncate">
              {activeBreadcrumb.page}
            </span>
          </button>
        </div>

        {/* Center: Global Search Input Across Projects, Tasks, Milestones, Team & Risks */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Global search projects, tasks (TSK), milestones (MS), risks, team..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
          />
          {globalSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setGlobalSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Global Search Results Dropdown */}
          {isSearchOpen && globalSearchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded shadow-xl p-3 z-50 max-h-96 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-mono text-[10px] uppercase text-slate-500 font-bold">
                  Live Cross-Entity Search Results
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {globalSearchResults.projects.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#D04A02] font-bold mb-1">
                    Projects ({globalSearchResults.projects.length})
                  </div>
                  {globalSearchResults.projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectIdForDetails(p.id);
                        setActiveModule('project-details');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        <strong className="font-mono">{p.code}</strong> — {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{p.owner}</span>
                    </button>
                  ))}
                </div>
              )}

              {globalSearchResults.tasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#1E3A8A] font-bold mb-1">
                    Tasks & Deliverables ({globalSearchResults.tasks.length})
                  </div>
                  {globalSearchResults.tasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveModule('tasks');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        <strong className="font-mono">{t.code}</strong> — {t.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{t.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {globalSearchResults.milestones.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold mb-1">
                    Milestones ({globalSearchResults.milestones.length})
                  </div>
                  {globalSearchResults.milestones.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setActiveModule('milestones');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        <strong className="font-mono">{m.code}</strong> — {m.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {m.plannedDate}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {globalSearchResults.risks.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-red-700 font-bold mb-1">
                    Risks ({globalSearchResults.risks.length})
                  </div>
                  {globalSearchResults.risks.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setActiveModule('risks');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">
                        <strong className="font-mono">{r.code}</strong> — {r.description}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-red-700 ml-2">
                        {r.riskScore}/25
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {globalSearchResults.team.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Team Members ({globalSearchResults.team.length})
                  </div>
                  {globalSearchResults.team.map((tm) => (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => {
                        setActiveModule('team');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        <strong>{tm.name}</strong> ({tm.designation})
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{tm.appRole}</span>
                    </button>
                  ))}
                </div>
              )}

              {globalSearchResults.projects.length === 0 &&
                globalSearchResults.tasks.length === 0 &&
                globalSearchResults.milestones.length === 0 &&
                globalSearchResults.risks.length === 0 &&
                globalSearchResults.team.length === 0 && (
                  <div className="text-slate-500 py-2 text-center">
                    No matching records for "{globalSearchQuery}".
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Right: RBAC Role Switcher + Notification Centre + Guided Demo Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Instant RBAC Role Switcher */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="text-slate-500 text-[11px]">Role:</span>
            <select
              aria-label="Active User RBAC Role"
              value={currentUserRole}
              onChange={(e) => {
                const nextRole = e.target.value as UserAppRole;
                setCurrentUserRole(nextRole);
                const matchingMember = (state.teamMembers || []).find(
                  (tm) => tm.appRole === nextRole
                );
                if (matchingMember) setCurrentUserName(matchingMember.name);
                showToast(`Switched active RBAC role to ${nextRole}.`);
              }}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="Administrator">Administrator (Sopan Shinde)</option>
              <option value="Project Manager">Project Manager (Ananya Iyer)</option>
              <option value="Team Member">Team Member (Siddharth Verma)</option>
              <option value="Executive / Viewer">Executive / Viewer (Read-Only)</option>
            </select>
          </div>

          {/* Active User Profile Pill (Sopan Shinde) */}
          <button
            type="button"
            onClick={() => setActiveModule('settings')}
            title="Open Sopan Shinde Executive Partner Dossier & Governance Settings"
            className={`hidden sm:inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
              activeModule === 'settings'
                ? 'border-[#D04A02] bg-orange-50/60 text-slate-900 shadow-xs ring-1 ring-[#D04A02]/30'
                : 'border-slate-200/95 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            {currentUserName.toLowerCase() === 'sopan shinde' ? (
              <img
                src={SOPAN_SHINDE_AVATAR_URL}
                alt={currentUserName}
                className="w-7 h-7 rounded-md object-cover object-top shrink-0 border border-slate-300 shadow-2xs bg-white"
              />
            ) : (
              <span className="w-7 h-7 rounded-md bg-[#0F172A] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-700">
                {currentUserName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-slate-900">{currentUserName}</div>
              <div className="text-[10px] font-mono text-[#D04A02] font-semibold">
                {currentUserRole} · PWC-IN-88412
              </div>
            </div>
          </button>

          {/* Real Data-Driven Notification Centre */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              aria-label="Open Notification Centre"
              className="relative p-2 rounded-md border border-slate-200/95 bg-white hover:bg-slate-50 shadow-2xs text-slate-700 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {kpis.notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold">
                  {kpis.notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 fin-card p-4 z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      Governance Alerts ({kpis.notifications.length})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Real-time anomalies computed from portfolio telemetry
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {kpis.notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(n.targetModule);
                        setIsNotifOpen(false);
                      }}
                      className="w-full text-left py-2.5 hover:bg-slate-50 px-1.5 rounded transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            n.severity === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {n.severity} · {n.category}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-700">
                          {n.projectCode}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 mt-1">{n.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {n.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button: Start Guided Demo */}
          <button
            type="button"
            onClick={handleStartGuidedDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#D04A02] hover:bg-[#b53f02] rounded-md shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Guided Demo</span>
          </button>
        </div>
      </header>

      {/* Guided Recruiter Demo Controller & Synthetic Data Notice Bar */}
      <GuidedDemoBar
        isActive={isGuidedDemoActive}
        currentStepIndex={guidedStepIndex}
        isAutoPlaying={isDemoAutoPlaying}
        demoInterventionApplied={demoInterventionApplied}
        onStartDemo={handleStartGuidedDemo}
        onToggleAutoPlay={() => setIsDemoAutoPlaying((prev) => !prev)}
        onPrevStep={handlePrevDemoStep}
        onNextStep={handleNextDemoStep}
        onJumpToStep={handleJumpToDemoStep}
        onExitDemo={() => {
          setIsGuidedDemoActive(false);
          setIsDemoAutoPlaying(false);
        }}
        onResetData={handleResetDemoData}
      />

      {/* Slide-In Left Navigation Drawer Backdrop (when not pinned) */}
      {isDrawerOpen && !isDrawerPinned && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="no-print fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Slide-In Left Navigation Drawer (Opens from Left on 3-Lines Click) */}
      <aside
        aria-label="Slide-In Module Explorer"
        className={`no-print fixed top-0 left-0 bottom-0 z-50 w-[316px] bg-white border-r border-slate-200/95 shadow-[0_12px_36px_-4px_rgba(15,23,42,0.22)] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isDrawerOpen || isDrawerPinned ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Drawer Header: Brand + Institutional Sopan Shinde Partner Card + Pin/Close */}
        <div className="p-4 border-b border-slate-200/95 bg-slate-50/85 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#D04A02] text-white font-mono text-xs font-bold flex items-center justify-center shadow-2xs">
                P
              </span>
              <div>
                <div className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
                  ProjectPulse AI
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-0.5">
                  PwC India PMO Suite
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerPinned((prev) => !prev);
                  if (!isDrawerPinned) setIsDrawerOpen(true);
                }}
                title={isDrawerPinned ? 'Unpin Drawer (Slide-Over Mode)' : 'Pin Drawer Open'}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  isDrawerPinned
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200/95 hover:bg-slate-100'
                }`}
              >
                {isDrawerPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsDrawerPinned(false);
                }}
                aria-label="Close Navigation Drawer"
                className="p-1.5 rounded-md border border-slate-200/95 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Institutional Partner Card with Professional Summary inside Slide-In Menu */}
          <div
            onClick={() => {
              setActiveModule('settings');
              if (!isDrawerPinned) setIsDrawerOpen(false);
            }}
            className="fin-card-dark text-white p-3.5 cursor-pointer hover:border-slate-600 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUserName.toLowerCase() === 'sopan shinde' ? (
                  <img
                    src={SOPAN_SHINDE_AVATAR_URL}
                    alt={currentUserName}
                    className="w-10 h-10 rounded-md object-cover object-top shrink-0 border border-orange-300/50 shadow-xs bg-white"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-md bg-[#D04A02] text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0 border border-orange-300/30 shadow-xs">
                    {currentUserName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUserName}
                  </div>
                  <div className="text-[10px] font-mono text-[#FDBA74] truncate">
                    {currentUserRole} · PWC-IN-88412
                  </div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold uppercase shrink-0">
                Verified
              </span>
            </div>

            {/* Sidebar Professional Summary Snippet */}
            <div className="pt-2 border-t border-slate-800/90 space-y-1.5">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Executive Professional Summary
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Partner, Cyber &amp; Cloud Transformation leading RBI/SEBI cyber resilience,
                zero-trust cloud &amp; enterprise portfolio governance.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">MANAGED</span>
                  <span className="text-white font-bold">$3.10M USD</span>
                </div>
                <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">SIGN-OFF</span>
                  <span className="text-emerald-400 font-bold">$25.0M USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/90 text-[10px] font-mono text-slate-300">
              <span>Mumbai (BKC) · Technology</span>
              <span className="text-[#FDBA74] font-semibold underline">
                Open Dossier →
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable 5-Group Module Explorer — Enterprise Financial Dashboard Density */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {sidebarGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-2.5 py-1 flex items-center justify-between border-b border-slate-100">
                <span className="inline-flex items-center self-center text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 leading-none">
                  {group.groupLabel}
                </span>
                <span className="self-center inline-flex items-center justify-center text-[9px] font-mono tabular-nums text-slate-400 leading-none">
                  {group.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        if (!isDrawerPinned) {
                          setIsDrawerOpen(false);
                        }
                      }}
                      className={`group w-full flex items-center justify-between gap-3 px-2.5 py-1 rounded-md text-xs leading-none border-l-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F172A] text-white font-semibold border-l-[#D04A02] shadow-xs'
                          : 'border-l-transparent text-slate-700 font-medium hover:bg-slate-100/90 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 self-center">
                        <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 self-center">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isSelected
                                ? 'text-[#FDBA74]'
                                : 'text-slate-500 group-hover:text-slate-900'
                            }`}
                          />
                        </span>
                        <span className="inline-flex items-center self-center truncate leading-none tracking-[-0.01em] text-left">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`self-center inline-flex items-center justify-center min-w-[40px] h-5 px-1.5 rounded font-mono tabular-nums text-[10px] leading-none tracking-tight border shrink-0 ${
                            isSelected
                              ? 'bg-slate-800 border-slate-700 text-[#FDBA74] font-bold'
                              : item.badgeTone === 'danger'
                              ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                              : item.badgeTone === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                              : 'bg-slate-100 border-slate-200/90 text-slate-600 font-semibold'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Floating Copilot Trigger inside Drawer */}
          <button
            type="button"
            onClick={() => {
              setIsChatbotOpen(true);
              if (!isDrawerPinned) setIsDrawerOpen(false);
            }}
            className="w-full mt-2 flex items-center justify-between gap-3 px-2.5 py-1 rounded-md text-xs font-semibold leading-none bg-orange-50/90 hover:bg-orange-100 text-[#D04A02] border border-orange-200 border-l-2 border-l-[#D04A02] shadow-2xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 self-center">
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 self-center">
                <Bot className="w-4 h-4 shrink-0" />
              </span>
              <span className="inline-flex items-center self-center truncate leading-none text-left">
                Ask PwC AI Copilot
              </span>
            </div>
            <span className="self-center inline-flex items-center justify-center min-w-[40px] h-5 px-1.5 rounded bg-orange-100 border border-orange-300/80 font-mono text-[10px] font-bold leading-none shrink-0">
              LIVE
            </span>
          </button>
        </div>

        {/* Bottom Drawer Data Governance Summary */}
        <div className="p-3.5 border-t border-slate-200/95 bg-slate-50/90 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Portfolio Telemetry</span>
            <span className="font-mono text-[10px] text-emerald-700 font-bold">
              SQLite WAL · 100% Quality
            </span>
          </div>
          <div className="space-y-1 font-mono tabular-nums text-[11px]">
            <div className="flex justify-between">
              <span>Health (G/A/R):</span>
              <span className="text-slate-900 font-semibold">
                {kpis.healthDistribution.Green} / {kpis.healthDistribution.Amber} /{' '}
                {kpis.healthDistribution.Red}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tasks Completed:</span>
              <span className="text-slate-900 font-semibold">
                {kpis.completedTasks}/{kpis.totalTasks} ({kpis.taskCompletionRate}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overdue Milestones:</span>
              <span className="text-[#DC2626] font-semibold">
                {kpis.overdueMilestones}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Application Shell */}
      <div
        className={`flex-1 flex flex-col max-w-[1680px] w-full mx-auto transition-all duration-300 ${
          isDrawerPinned ? 'lg:pl-[316px]' : ''
        }`}
      >
        {/* Quick Explore Bar for Instant Tab Switching or Opening the 3-Line Drawer */}
        <div className="no-print bg-white border-b border-slate-200 px-4 lg:px-6 py-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="h-7 inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-slate-900 text-white hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
              <Menu className="w-3.5 h-3.5 text-[#FDBA74]" />
            </span>
            <span>All 16 Modules</span>
          </button>
          <span className="text-slate-300 px-0.5">|</span>
          {sidebarGroups
            .flatMap((g) => g.items)
            .map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={`h-7 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs leading-none whitespace-nowrap transition-colors shrink-0 cursor-pointer border ${
                    active
                      ? 'bg-orange-50 text-[#D04A02] border-orange-200 font-semibold shadow-2xs'
                      : 'border-transparent text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-0.5 px-1.5 h-4 inline-flex items-center justify-center rounded font-mono tabular-nums text-[9px] leading-none border ${
                        active
                          ? 'bg-white border-orange-200 text-[#D04A02] font-bold'
                          : item.badgeTone === 'danger'
                          ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                          : item.badgeTone === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                          : 'bg-slate-100 border-slate-200/80 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Primary Module Viewport */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden pb-24">
          {toastMessage && (
            <div className="no-print mb-4 bg-slate-900 text-white px-4 py-2.5 rounded text-xs font-medium flex items-center justify-between">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-300 hover:text-white ml-4 text-[11px] underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeModule === 'dashboard' && (
            <ExecutiveDashboard
              state={state}
              kpis={kpis}
              guidedStepNumber={activeGuidedStepNumber}
              onInspectProject={(project) => setInspectedProjectId(project.id)}
              onOpenProjectDetails={(project) => {
                setSelectedProjectIdForDetails(project.id);
                setActiveModule('project-details');
              }}
              onNavigateWithFilter={(mod, opts) => {
                if (opts) setPortfolioFilterJump(opts);
                setActiveModule(mod);
              }}
              onOpenAIChat={() => setIsChatbotOpen(true)}
              onQuickResolveOverdueDemo={executeQuickInterventionPRJ102}
            />
          )}

          {(activeModule === 'portfolio' || activeModule === 'my-projects') && (
            <ProjectPortfolioView
              state={state}
              kpis={kpis}
              initialDepartmentFilter={portfolioFilterJump.department}
              initialStatusFilter={portfolioFilterJump.status}
              initialHealthFilter={portfolioFilterJump.health}
              onlyMyProjects={activeModule === 'my-projects'}
              currentUserName={currentUserName}
              guidedStepNumber={activeGuidedStepNumber}
              onInspectProject={(project) => setInspectedProjectId(project.id)}
              onOpenProjectDetails={(project) => {
                setSelectedProjectIdForDetails(project.id);
                setActiveModule('project-details');
              }}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onImportProjects={handleImportProjects}
            />
          )}

          {activeModule === 'project-details' && (
            <ProjectDetailsView
              state={state}
              kpis={kpis}
              selectedProjectId={selectedProjectIdForDetails}
              onSelectProjectId={setSelectedProjectIdForDetails}
              onBackToPortfolio={() => setActiveModule('portfolio')}
              onUpdateMilestoneStatus={(msId, status, pct, note) =>
                handleUpdateMilestone(
                  msId,
                  status,
                  pct,
                  status === 'Completed' ? state.referenceDate : null,
                  note
                )
              }
              onUpdateTaskStatus={(taskId, newStatus) => {
                const found = (state.tasks || []).find((t) => t.id === taskId);
                if (found) {
                  handleUpdateTask({
                    ...found,
                    status: newStatus,
                    completedDate: newStatus === 'Completed' ? state.referenceDate : null,
                    actualHours:
                      newStatus === 'Completed' ? found.estimatedHours : found.actualHours,
                    updatedAt: new Date().toISOString(),
                  });
                }
              }}
              onUpdateRiskMitigation={(rId, prog, st) => handleUpdateRisk(rId, prog, st)}
              onUpdateProjectBudget={handleUpdateProjectBudget}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'tasks' && (
            <TasksDeliverablesView
              state={state}
              kpis={kpis}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeModule === 'milestones' && (
            <MilestoneTrackingView
              state={state}
              kpis={kpis}
              guidedStepNumber={activeGuidedStepNumber}
              onAddMilestone={handleAddMilestone}
              onUpdateMilestone={handleUpdateMilestone}
            />
          )}

          {activeModule === 'gantt' && (
            <TimelineGanttView
              state={state}
              kpis={kpis}
              onOpenProjectDetails={(project) => {
                setSelectedProjectIdForDetails(project.id);
                setActiveModule('project-details');
              }}
              onUpdateProjectDates={handleUpdateProjectDates}
            />
          )}

          {activeModule === 'risks' && (
            <RiskManagementView
              state={state}
              kpis={kpis}
              guidedStepNumber={activeGuidedStepNumber}
              onAddRisk={handleAddRisk}
              onUpdateRisk={handleUpdateRisk}
            />
          )}

          {activeModule === 'issues' && (
            <IssuesDependenciesView
              state={state}
              kpis={kpis}
              onAddIssue={handleAddIssue}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              onAddDependency={handleAddDependency}
            />
          )}

          {activeModule === 'budget' && (
            <BudgetMonitoringView
              state={state}
              kpis={kpis}
              guidedStepNumber={activeGuidedStepNumber}
              onInspectProject={(project) => setInspectedProjectId(project.id)}
              onUpdateProjectBudget={handleUpdateProjectBudget}
            />
          )}

          {activeModule === 'reports' && (
            <ManagementReportingView
              state={state}
              kpis={kpis}
              onSaveReport={handleSaveReport}
            />
          )}

          {activeModule === 'data-pipeline' && (
            <DataEngineeringView
              state={state}
              kpis={kpis}
              currentUserName={currentUserName}
              onExecuteETLPipeline={(nextState: PortfolioState, run: ETLPipelineRun) => {
                const ok = commitPortfolioState(
                  () => nextState,
                  {
                    action: 'Updated',
                    entityType: 'Project',
                    entityCode: run.runCode,
                    description: `Executed ETL pipeline "${run.batchName}": ${run.insertedRecords} inserted, ${run.updatedRecords} upserted, ${run.rejectedRecords} quarantined (Quality ${run.qualityScore}%).`,
                  }
                );
                if (ok) {
                  showToast(
                    `ETL Run ${run.runCode} committed to SQLite (${run.insertedRecords} inserted, ${run.updatedRecords} upserted, ${run.rejectedRecords} quarantined).`
                  );
                }
              }}
            />
          )}

          {activeModule === 'ai-assistant' && (
            <AIExecutiveAssistantView
              state={state}
              kpis={kpis}
              guidedStepNumber={activeGuidedStepNumber}
              onSaveApprovedReport={handleSaveReport}
            />
          )}

          {activeModule === 'team' && (
            <TeamMembersView
              state={state}
              kpis={kpis}
              currentRole={currentUserRole}
              onSwitchRole={(role, name) => {
                setCurrentUserRole(role);
                setCurrentUserName(name);
                showToast(`Switched active persona to ${name} (${role}).`);
              }}
              onAddTeamMember={handleAddTeamMember}
              onUpdateMemberCapacity={handleUpdateMemberCapacity}
            />
          )}

          {activeModule === 'activity-log' && <ActivityLogView state={state} />}

          {activeModule === 'settings' && (
            <SettingsView
              state={state}
              kpis={kpis}
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              onSwitchUserRole={(role, name) => {
                setCurrentUserRole(role);
                setCurrentUserName(name);
                showToast(`Switched active persona to ${name} (${role}).`);
              }}
              onUpdateReferenceDate={(newRefDate) => {
                commitPortfolioState((prev) => ({
                  ...prev,
                  referenceDate: newRefDate,
                }));
                showToast(`Updated portfolio simulation reference date to ${newRefDate}.`);
              }}
              onResetDemoData={handleResetDemoData}
              onOpenQAVideoPackage={() => setActiveModule('qa-video')}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'qa-video' && <QAVideoPackageView state={state} />}
        </main>
      </div>

      {/* Detailed Project Inspector Drawer */}
      <ProjectInspectorModal
        project={inspectedProject}
        metrics={inspectedProject ? kpis.projectMetricsMap[inspectedProject.id] : null}
        milestones={state.milestones}
        milestoneHistory={state.milestoneHistory}
        risks={state.risks}
        referenceDate={state.referenceDate}
        onClose={() => setInspectedProjectId(null)}
        onUpdateMilestoneStatus={(msId, status, pct, note) =>
          handleUpdateMilestone(
            msId,
            status,
            pct,
            status === 'Completed' ? state.referenceDate : null,
            note
          )
        }
        onUpdateRiskMitigation={(rId, prog, st) => handleUpdateRisk(rId, prog, st)}
        onNavigateModule={(mod) => setActiveModule(mod)}
      />

      {/* Interactive PwC ProjectPulse AI Copilot Chatbot */}
      <AIChatbotWidget
        isOpen={isChatbotOpen}
        onToggleOpen={() => setIsChatbotOpen((prev) => !prev)}
        state={state}
        kpis={kpis}
        onInspectProjectByCode={(code) => {
          const found = state.projects.find((p) => p.code === code);
          if (found) setInspectedProjectId(found.id);
        }}
        onQuickCompleteOverdueMilestone={executeQuickInterventionPRJ102}
      />
    </div>
  );
}
