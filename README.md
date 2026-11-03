# ProjectPulse AI — Enterprise Project Data Integration, Processing & Portfolio Intelligence Platform

**ProjectPulse AI** (PwC India Advisory Edition · Default Executive Profile: **Sopan Shinde**) is a full-stack Project Portfolio Management (PPM), Data Engineering (ETL), and Business Intelligence platform built with **React 19, TypeScript, Tailwind CSS v4, Express, and SQLite 3 (WAL mode)**.

---

## 1. System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND CLIENT (React 19 + TypeScript)                   │
│  • Executive Dashboard    • Project Portfolio & 8-Tab Details  • Tasks & Kanban   │
│  • Milestones & Gantt     • Risk Matrix & Issues/Dependencies  • Budget & Team    │
│  • Data Pipeline & ETL    • AI Project Assistant & Copilot     • Reports & QA     │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │ REST API (JSON + RBAC `x-user-role`)
┌───────────────────────────────────────▼───────────────────────────────────────────┐
│                     BACKEND DATA & API SERVER (Express + Node.js)                 │
│  • 6-Stage ETL Pipeline Engine (`src/utils/dataEngineering.ts`)                   │
│  • Deterministic KPI & Financial Variance Engine (`src/utils/calculations.ts`)    │
│  • 5-Dimension Data Quality & Foreign-Key Audit Engine                            │
│  • Grounded Gemini 3.8 Flash + Deterministic PMO Copilot (`/api/ai/*`)            │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │ Atomic SQLite Transactions (WAL Mode)
┌───────────────────────────────────────▼───────────────────────────────────────────┐
│                     RELATIONAL DATABASE (`projectpulse.db` / `schema.sql`)        │
│  11 Tables: `projects`, `milestones`, `milestone_history`, `tasks`, `risks`,      │
│  `issues`, `dependencies`, `team_members`, `activity_log`, `executive_reports`,   │
│  `etl_pipeline_runs` + 10 Relational & Analytical Indexes                         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Data Flow Diagram (6-Stage ETL Pipeline)

```
[1. Data Import] (CSV / JSON / REST API Connector)
       │
       ▼
[2. Schema & Relational Validation]
   ├─ Required-Field Check (`code`, `name`/`title`, `projectCode`)
   ├─ Domain Range Check (`progress 0..100`, `allocatedBudget > 0`, `endDate >= startDate`)
   ├─ Duplicate Key Detection (`upsert`, `skip_duplicates`, or `strict_reject_duplicates`)
   └─ Foreign-Key Referential Integrity (`tasks.project_id -> projects.id`)
       │
       ├──► Invalid / Orphaned Rows ──► [Quarantine & Rejected-Record Inspector]
       │
       ▼ Valid Rows
[3. Data Transformation & Normalization]
   ├─ Clamp progress [0..100] & normalize status / priority enums
   ├─ Compute `budgetVariance = actualSpend - allocatedBudget`
   ├─ Compute `utilizationPercent = (actualSpend / allocatedBudget) * 100`
   └─ Bind relational foreign keys (`projectId`, `assigneeId`)
       │
       ▼
[4. Relational Database Storage (SQLite 3 WAL)]
   └─ Atomic transaction upserting `projects`, `tasks`, `etl_pipeline_runs`, and `activity_log`
       │
       ▼
[5. Live KPI & Data Quality Recalculation]
   └─ Recompute portfolio health (G/A/R), team capacity utilization, and 5-dimension Data Quality score
       │
       ▼
[6. Analytical Reporting & Grounded AI Assistant]
   └─ Evidence-cited executive reports, RFC-4180 CSV exports, and AI Copilot Q&A
```

---

## 3. Relational Database ER Diagram (`schema.sql`)

```
[team_members] (PK: id) 1 ────────── * [tasks] (PK: id, UK: code, FK: project_id, assignee_id)
                                          │
[projects] (PK: id, UK: code) 1 ──────────┼──── * [milestones] (PK: id, UK: code, FK: project_id)
   │                                      │            │
   ├──── * [risks] (FK: project_id)       │            └──── * [milestone_history] (FK: milestone_id)
   ├──── * [issues] (FK: project_id)      │
   ├──── * [dependencies] (FK: project_id, blocking_task_id, blocked_task_id)
   └──── * [activity_log] (FK: project_id)

[executive_reports] (PK: id)             [etl_pipeline_runs] (PK: id, UK: run_code)
```

---

## 4. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolio` | Retrieves complete relational portfolio state across all 11 SQLite tables. |
| `POST` | `/api/portfolio/sync` | Synchronizes portfolio mutations in an atomic SQLite transaction (enforces RBAC via `x-user-role`). |
| `POST` | `/api/portfolio/reset` | Resets SQLite database to the baseline 12 PwC India engagements, 27 milestones, 20 tasks, and 10 risks. |
| `GET` | `/api/projects` | Retrieves projects with computed budget variance, utilization %, health, and optional `department`/`status` filters. |
| `GET` | `/api/tasks` | Retrieves tasks with joined parent project metadata and overdue status against `referenceDate`. |
| `GET` | `/api/analytics/kpis` | Returns live calculated portfolio KPIs, 5-dimension Data Quality scorecard, and 7 FK integrity checks. |
| `GET` | `/api/etl/history` | Returns all historical and user-triggered ETL pipeline runs (`etl_pipeline_runs`). |
| `POST` | `/api/etl/validate` | Dry-run ETL validation returning preview rows, validation diagnostics, and transformation summary without mutating SQLite. |
| `POST` | `/api/etl/ingest` | Executes the full 6-stage ETL pipeline and commits valid inserts/upserts and run logs to SQLite. |
| `POST` | `/api/ai/executive-report` | Generates evidence-cited management reports across 6 AI operation modes. |
| `POST` | `/api/ai/chat` | Interactive PwC AI Copilot grounded strictly in validated SQLite project, task, milestone, and risk records. |

---

## 5. KPI & Transformation Formula Definitions

| KPI / Metric | Mathematical & SQL Transformation Formula | Source Tables |
|---|---|---|
| **Portfolio Completion (%)** | `ROUND(AVG(projects.progress), 1)` | `projects` |
| **Task Completion Rate (%)** | `ROUND((COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0) / COUNT(*), 1)` | `tasks` |
| **Overdue Tasks** | `COUNT(*) WHERE status != 'Completed' AND due_date < :referenceDate` | `tasks` |
| **Overdue Milestones** | `COUNT(*) WHERE status != 'Completed' AND completion_percent < 100 AND planned_date < :referenceDate` | `milestones` |
| **Budget Variance ($)** | `SUM(actual_spend) - SUM(allocated_budget)` (positive = budget overrun) | `projects` |
| **Budget Utilization (%)** | `ROUND((SUM(actual_spend) / SUM(allocated_budget)) * 100, 1)` | `projects` |
| **Resource Utilization (%)** | `ROUND((SUM(active_task_weekly_hours) / team_members.weekly_capacity_hours) * 100, 1)` | `tasks`, `team_members` |
| **Risk Score (1–25)** | `probability (1..5) * impact (1..5)` (`>=16` Critical, `10..15` High, `5..9` Medium, `1..4` Low) | `risks` |
| **Project Health (RAG)** | `Red` if `status='Delayed'` or `util>105%` or `overdue_ms>=2` or `crit_risk>=1`; `Amber` if `status='At Risk'` or `util>98%` or `overdue_ms=1`; else `Green` | `projects`, `milestones`, `risks`, `tasks` |

---

## 6. Setup & Testing Instructions

```bash
# 1. Start the full-stack Express + SQLite + Vite development server on port 3000
npm run dev

# 2. Run the 11-Suite Automated QA, Data Engineering & Relational Integrity Verification Suite
npm test

# 3. Run TypeScript static type validation
npm run lint

# 4. Build production bundle
npm run build
```
