# Implementation Plan: ProjectPulse AI — Enterprise Project Portfolio Management Platform (PwC India Advisory Edition)

## 1. Repository Technical Audit & Feature Implementation Matrix

### Existing Architecture Summary
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Lucide React (`0.546.0`) running on Vite 8.
- **Backend & Persistence**: Express 4 + `better-sqlite3` (`projectpulse.db`) in `server.ts` on Port 3000 with automatic `localStorage` fallback and seed hydration.
- **AI Intelligence**: Server-side `@google/genai` (`gemini-3.8-flash`) with deterministic fallback in `/api/ai/executive-report` and `/api/ai/chat`.
- **Current Modules**: 8 views (`ExecutiveDashboard`, `ProjectPortfolioView`, `MilestoneTrackingView`, `RiskManagementView`, `BudgetMonitoringView`, `ManagementReportingView`, `AIExecutiveAssistantView`, `QAVideoPackageView`), plus `ProjectInspectorModal`, `GuidedDemoBar`, and `AIChatbotWidget`.

### Feature Implementation Matrix
| Feature | Existing | Incomplete | New / Upgrade Action |
|---|---|---|---|
| **Authentication & RBAC** | Basic workspace header | Missing role enforcement & switcher | Instant Role Switcher (`Administrator`, `Project Manager`, `Team Member`, `Executive / Viewer`) in Top Bar + backend `x-user-role` permission enforcement |
| **Application Shell** | Flat 8-tab sidebar | Missing 5-group hierarchy, Global Search, Notification Centre | Expandable/collapsible 5-group Left Sidebar + Global Search across all entities + real data-driven Notification Centre |
| **Page 1: Executive Overview** | 4 KPI cards, RAG distribution, Department bar | Missing Planned vs. Actual trend, 6-KPI layout, Activity feed | Upgrade to 6 KPI cards, Planned vs. Actual progress curve, Department chart, Upcoming Milestones, Critical Risks, Recent Activity, Executive Attention |
| **Page 2: Project Portfolio & My Projects** | Table view, filters, CRUD modal | Missing Grid/Card view, Timeline view, `My Projects` filter, Priority/Category fields | Add Table, Grid/Card, and Timeline modes, `My Projects` workspace view, Priority (`Low`/`Medium`/`High`/`Critical`), Category, and Team assignment |
| **Page 3: Project Details Workspace** | Modal inspector (`Overview`, `Milestones`, `Risks`, `Financials`) | Missing dedicated full-page 8-tab workspace | Dedicated Project Details view with 8 tabs (`Overview`, `Tasks`, `Milestones`, `Timeline`, `Risks`, `Budget`, `Team`, `Activity`) |
| **Page 4: Tasks & Deliverables** | None | Not implemented | Full Tasks module (`Task ID`, `Title`, `Project`, `Assignee`, `Priority`, `Status`, `Start/Due Date`, `Effort`, `Dependencies`) with Table, Kanban, Calendar, and Project Grouping views + Task Drawer |
| **Page 5: Milestone Management** | Table & history log | Missing Timeline & Project-wise views, Dependency column | Add Table, Timeline, and Project-wise views + Milestone Dependency tracking |
| **Page 6: Timeline / Gantt Chart** | None | Not implemented | Interactive Gantt chart with Project rows, Milestone diamonds, Task bars, Dependency lines, Current Date marker (`2026-11-02`), Week/Month zoom, and inline date editing |
| **Page 7: Risk Register** | 5×5 matrix, CRUD, score calculation | Missing 7 standard categories, Target Resolution Date, Risk Detail drawer | Expand categories (`Technical`, `Operational`, `Financial`, `Resource`, `Schedule`, `Compliance`, `External`), add Target Resolution Date & Risk Detail drawer |
| **Page 8: Issues & Dependencies** | None | Not implemented | Full Issue & Blocker register + Blocking/Blocked Task Dependency tracker |
| **Page 9: Budget & Financial Management** | Project/Department variance table | Missing Monthly Expenditure Trends & Planned Spend comparison | Add Planned Spend vs. Actual Spend, Monthly Expenditure Trends chart, and Remaining Budget tracking |
| **Page 10 & 13: Team & Resource Capacity** | Owner string on projects | No structured Team capacity or workload math | Structured `TeamMember` directory with defined weekly capacity hours, active/overdue task counts, and calculated workload utilization % |
| **Page 11: AI Project Assistant** | Executive briefing & Floating Copilot | Missing 6 distinct AI analytical operations | Upgrade to support all 6 operations (`Project Status Summary`, `Risk Explanation`, `Weekly Project Report`, `Delay Analysis`, `Executive Summary`, `Recommended Actions`) + Floating PwC Copilot |
| **Page 12: Reports & Analytics** | Weekly/Monthly summary, CSV/PDF | Missing 8 specialized report generators with filters | Support all 8 report types (`Portfolio Status`, `Project Progress`, `Milestone`, `Risk Register`, `Budget Variance`, `Task Completion`, `Department Performance`, `Weekly Executive Summary`) |
| **Page 14: Activity Log** | Milestone history only | Missing portfolio-wide chronological audit log | Real-time Activity Log recording Project, Task, Milestone, Risk, Issue, and Budget events |
| **Page 15: Settings** | Reset Demo Data button | Missing comprehensive Settings workspace | Functional Settings view (`Profile`, `Workspace`, `Team`, `Notifications`, `Preferences`, `Data Management & QA`) |

---

## 2. Visual Direction & Domain Design System

- **Aesthetic**: High-Craft Light Mode (`#F8FAFC` app canvas, `#FFFFFF` cards, `#F1F5F9` table headers, `#E2E8F0` hairlines) inspired by Linear, Asana Enterprise, and PwC India Advisory executive workspaces.
- **Color Tokens**:
  - Primary Navy: `#0F172A` | Enterprise Blue: `#1E3A8A` | PwC Advisory Accent: `#D04A02`
  - Semantic Status: On Track `#16A34A` (`#DCFCE7` fill) | At Risk `#D97706` (`#FEF3C7` fill) | Delayed / Critical `#DC2626` (`#FEE2E2` fill) | Completed / Info `#0284C7` (`#E0F2FE` fill)
- **Typography**: `Plus Jakarta Sans` / `Inter` for headings, `Public Sans` for dense UI tables, `JetBrains Mono` with `font-variant-numeric: tabular-nums` for all INR/USD currency values, variance percentages, dates, and risk scores.

---

## 3. System Architecture & Relational Data Model

```
+-----------------------------------------------------------------------------------+
|                        APPLICATION SHELL (React 19 + TS)                          |
|  +---------------------------+  +----------------------------------------------+  |
|  | 5-Group Left Sidebar      |  | Global Top Navigation Bar                    |  |
|  | - WORKSPACE (3)           |  | - Breadcrumb & Context Action                |  |
|  | - PROJECT DELIVERY (4)    |  | - Global Search (Projects/Tasks/Risks/Team)  |  |
|  | - GOVERNANCE (3)          |  | - Real Data Notification Centre              |  |
|  | - INTELLIGENCE (2)        |  | - Instant RBAC Role Switcher                 |  |
|  | - ADMINISTRATION (3)      |  | - Guided Demo Auto-Play Controller           |  |
|  +---------------------------+  +----------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                CENTRAL PORTFOLIO STATE & DETERMINISTIC KPI ENGINE                 |
|  - Real-time Progress, Health (RAG), Budget Variance, Workload Utilization %      |
|  - Automatic Activity Log Recorder on Every Create / Update / Delete              |
+-----------------------------------------------------------------------------------+
                     |                                           |
                     v                                           v
+-----------------------------------------+   +-------------------------------------+
|     EXPRESS + SQLITE BACKEND (:3000)    |   |   GEMINI 3.8 FLASH AI ENGINE        |
|  - /api/portfolio (GET, POST sync/reset)|   |  - /api/ai/executive-report (6 ops) |
|  - RBAC Middleware (x-user-role check)  |   |  - /api/ai/chat (PwC PMO Copilot)   |
|  - Tables: projects, milestones, tasks, |   |  - Evidence-linked citations        |
|    risks, issues, dependencies,         |   +-------------------------------------+
|    team_members, activity_log, reports  |
+-----------------------------------------+
```

### Extended Relational Entities (`/src/types/portfolio.ts` & `/schema.sql`)
1. **Projects (`projects`)**: Extended with `priority` (`Low` | `Medium` | `High` | `Critical`), `category`, `plannedProgress`, `plannedSpend`, `teamMemberIds`, and `monthlySpend` series.
2. **Tasks (`tasks`)**: `id`, `code` (`TSK-101`), `title`, `description`, `projectId`, `assigneeId`, `assigneeName`, `priority`, `status` (`Not Started` | `In Progress` | `Blocked` | `Completed`), `startDate`, `dueDate`, `estimatedHours`, `actualHours`, `completedDate`, `dependencyIds`.
3. **Milestones (`milestones`)**: Extended with `dependencyIds` (`string[]`) and `deliverables`.
4. **Risks (`risks`)**: Extended with 7 categories (`Technical` | `Operational` | `Financial` | `Resource` | `Schedule` | `Compliance` | `External`) and `targetResolutionDate`.
5. **Issues (`issues`) & Dependencies (`dependencies`)**:
   - `IssueItem`: `id`, `code` (`ISS-01`), `title`, `description`, `projectId`, `priority`, `owner`, `reportedDate`, `targetResolutionDate`, `status` (`Open` | `Investigating` | `Resolved` | `Escalated`), `relatedTaskId`, `relatedRiskId`.
   - `TaskDependency`: `id`, `projectId`, `blockingTaskId`, `blockedTaskId`, `type` (`Finish-to-Start` | `Start-to-Start`), `status` (`Active` | `Fulfilled` | `At Risk`).
6. **Team Members (`team_members`)**: 10 PwC India Advisory leaders and consultants (`Aarav Mehta`, `Ananya Iyer`, `Vikramaditya Rao`, `Meera Krishnan`, `Rohan Deshmukh`, `Kavita Nair`, `Aditya Chatterjee`, `Siddharth Verma`, `Priya Sharma`, `Nikhil Menon`) with `appRole` (`Administrator` | `Project Manager` | `Team Member` | `Executive / Viewer`), `department`, `designation`, `weeklyCapacityHours` (e.g., `40h`), and dynamically calculated workload utilization from assigned active tasks.
7. **Activity Log (`activity_log`)**: Chronological audit trail recorded automatically whenever any entity is created, updated, or deleted.

---

## 4. Implementation Phases

### Phase 1: Schema, Types, Seed Data & Calculation Engine
- Update `/schema.sql` and `/src/types/portfolio.ts` to include all new fields and tables (`tasks`, `issues`, `dependencies`, `team_members`, `activity_log`).
- Expand `/src/data/seedData.ts` with 36 realistic PwC India tasks across the 12 projects, 10 issues, 12 task dependencies, 10 PwC India team members with defined capacity hours, monthly expenditure arrays, and initial activity logs.
- Expand `/src/utils/calculations.ts` to compute `On Track` vs. `At Risk` vs. `Delayed` vs. `Completed` counts, overall weighted progress, team member workload utilization (`Assigned Task Effort / Weekly Capacity`), monthly planned vs. actual spend curves, and real-time notifications derived from overdue milestones, critical risks, blocked tasks, and budget overruns.

### Phase 2: Backend Persistence, RBAC & 6-Mode AI Engine (`/server.ts`)
- Upgrade SQLite initialization and `/api/portfolio/sync` to persist all 9 relational tables transactionally.
- Add RBAC role enforcement middleware inspecting `x-user-role` (e.g., `Executive / Viewer` is read-only; `Team Member` can update tasks/milestones/issues; `Project Manager` & `Administrator` have full portfolio/budget CRUD).
- Upgrade `/api/ai/executive-report` to accept an `operationType` (`status_summary`, `risk_explanation`, `weekly_report`, `delay_analysis`, `executive_summary`, `recommended_actions`) and optional `projectId` filter, returning structured evidence-backed analysis.

### Phase 3: Enterprise Shell & All 15 Functional Pages
- Build the collapsible 5-group Sidebar, Global Search Command Modal (`Cmd/Ctrl+K` or top bar input), Real Data Notification Popover, and Instant RBAC Role Switcher in `/src/App.tsx`.
- Implement/upgrade all 15 pages:
  - `ExecutiveDashboard.tsx` (Page 1: 6 KPIs, Health Donut, Planned vs. Actual Trend, Department Delivery, Upcoming Milestones, Critical Risks, Activity Feed, Executive Attention).
  - `ProjectPortfolioView.tsx` (Page 2 & `My Projects`: Table, Card Grid, Timeline modes + multi-criteria filters + Project CRUD modal).
  - `ProjectDetailsView.tsx` (Page 3: Full 8-tab single-project workspace).
  - `TasksDeliverablesView.tsx` (Page 4: Table, Kanban Board, Calendar View, Project Grouping + Task Detail Drawer + CRUD).
  - `MilestoneTrackingView.tsx` (Page 5: Table, Timeline, Project-wise views + dependencies).
  - `TimelineGanttView.tsx` (Page 6: Interactive Gantt chart with Week/Month zoom, task/milestone bars, dependency lines, current date line, and inline date editing).
  - `RiskManagementView.tsx` (Page 7: 7 categories, Target Resolution Date, 5×5 Matrix, Risk Detail Drawer).
  - `IssuesDependenciesView.tsx` (Page 8: Issue Register CRUD + Task Dependency tracker).
  - `BudgetMonitoringView.tsx` (Page 9: Approved, Actual, Remaining, Variance, Planned Spend, Monthly Expenditure Trends).
  - `TeamMembersView.tsx` (Pages 10 & 13: Resource capacity cards, workload utilization bars, task allocation breakdown, member CRUD).
  - `AIExecutiveAssistantView.tsx` (Page 11: 6 AI operations + Evidence verification + Human review).
  - `ManagementReportingView.tsx` (Page 12: 8 specialized report generators with Department/Project/Status filters + CSV/PDF export).
  - `ActivityLogView.tsx` (Page 14: Chronological audit trail with user/entity filters).
  - `SettingsView.tsx` (Page 15: Profile, Workspace, Team RBAC matrix, Notifications, Currency/Theme Preferences, Data Management & QA Suite).

### Phase 4: End-to-End Verification & Automated QA Suite
- Update `/src/utils/qaSuite.ts` and `/tests/portfolio.test.ts` to verify all 15 modules, Task/Issue CRUD, Team workload math, RBAC rules, and zero console/build errors.
