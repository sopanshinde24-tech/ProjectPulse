-- ProjectPulse AI — Relational SQLite Schema (PwC India Enterprise Edition)

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  owner TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  allocated_budget REAL NOT NULL,
  actual_spend REAL NOT NULL,
  planned_spend REAL DEFAULT 0,
  status TEXT NOT NULL,
  priority TEXT DEFAULT 'High',
  category TEXT DEFAULT 'Digital Transformation',
  progress INTEGER NOT NULL,
  planned_progress INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  strategic_objective TEXT NOT NULL,
  team_member_ids_json TEXT DEFAULT '[]',
  monthly_spend_json TEXT DEFAULT '[]',
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  actual_date TEXT,
  status TEXT NOT NULL,
  completion_percent INTEGER NOT NULL,
  deliverable_notes TEXT NOT NULL,
  dependency_ids_json TEXT DEFAULT '[]',
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestone_history (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  author TEXT NOT NULL,
  previous_percent INTEGER NOT NULL,
  new_percent INTEGER NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  probability INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  owner TEXT NOT NULL,
  mitigation_plan TEXT NOT NULL,
  mitigation_progress INTEGER NOT NULL,
  target_resolution_date TEXT DEFAULT '2026-11-30',
  status TEXT NOT NULL,
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id TEXT NOT NULL,
  assignee_id TEXT NOT NULL,
  assignee_name TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  estimated_hours REAL NOT NULL,
  actual_hours REAL NOT NULL,
  completed_date TEXT,
  dependency_ids_json TEXT DEFAULT '[]',
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id TEXT NOT NULL,
  priority TEXT NOT NULL,
  owner TEXT NOT NULL,
  reported_date TEXT NOT NULL,
  target_resolution_date TEXT NOT NULL,
  status TEXT NOT NULL,
  related_task_id TEXT,
  related_risk_id TEXT,
  resolution_notes TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dependencies (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  blocking_task_id TEXT NOT NULL,
  blocked_task_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  designation TEXT NOT NULL,
  app_role TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  weekly_capacity_hours REAL NOT NULL,
  avatar_initials TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  project_id TEXT,
  timestamp TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS executive_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  period_type TEXT NOT NULL,
  report_category TEXT DEFAULT 'Weekly Executive Summary',
  generated_at TEXT NOT NULL,
  author TEXT NOT NULL,
  review_status TEXT NOT NULL,
  reviewer_notes TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  delayed_highlights_json TEXT NOT NULL,
  major_risks_json TEXT NOT NULL,
  recommendations_json TEXT NOT NULL,
  kpi_snapshot_json TEXT NOT NULL,
  is_ai_generated INTEGER NOT NULL DEFAULT 1
);
