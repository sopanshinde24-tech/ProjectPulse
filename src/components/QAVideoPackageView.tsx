import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Film,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { VIDEO_ASSET_FILES } from '../data/videoAssetsData';
import { PortfolioState } from '../types/portfolio';
import { downloadTextFile } from '../utils/csvExport';
import { runAllQAVerificationSuites } from '../utils/qaSuite';

interface QAVideoPackageViewProps {
  state: PortfolioState;
}

export const QAVideoPackageView: React.FC<QAVideoPackageViewProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'qa' | 'video' | 'schema'>('qa');
  const [selectedVideoAssetIndex, setSelectedVideoAssetIndex] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const qaResults = useMemo(() => runAllQAVerificationSuites(state), [state]);
  const allPassed = qaResults.every((r) => r.passed);

  const activeVideoFile =
    VIDEO_ASSET_FILES[selectedVideoAssetIndex] || VIDEO_ASSET_FILES[0];

  const handleCopyContent = (filename: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const sqlSchemaString = `-- ProjectPulse AI — SQL Relational Schema (/schema.sql)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('Technology', 'Finance', 'Operations', 'Marketing')),
  owner TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  allocated_budget REAL NOT NULL CHECK (allocated_budget >= 0),
  actual_spend REAL NOT NULL CHECK (actual_spend >= 0),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Completed', 'Delayed', 'At Risk')),
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  description TEXT NOT NULL,
  strategic_objective TEXT NOT NULL,
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
  status TEXT NOT NULL CHECK (status IN ('Completed', 'In Progress', 'Overdue', 'Upcoming')),
  completion_percent INTEGER NOT NULL CHECK (completion_percent >= 0 AND completion_percent <= 100),
  deliverable_notes TEXT NOT NULL,
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
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
  note TEXT NOT NULL,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Schedule', 'Budget', 'Technical', 'Vendor', 'Compliance', 'Resource')),
  probability INTEGER NOT NULL CHECK (probability >= 1 AND probability <= 5),
  impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
  risk_score INTEGER NOT NULL,
  owner TEXT NOT NULL,
  mitigation_plan TEXT NOT NULL,
  mitigation_progress INTEGER NOT NULL CHECK (mitigation_progress >= 0 AND mitigation_progress <= 100),
  status TEXT NOT NULL CHECK (status IN ('Open', 'Mitigating', 'Resolved')),
  is_synthetic INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS executive_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('Weekly', 'Monthly')),
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
);`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-mono text-slate-500">
            08 · Quality Assurance Test Runner, SQL Schema & Video Production Package
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Verification Suite, Relational Schema & Video Assets
          </h1>
        </div>

        {/* Sub-module Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded">
          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>QA Test Suite (8/8)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'video'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>/video-assets Package (6 Files)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SQL Schema (/schema.sql)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QA Verification Suite */}
      {activeTab === 'qa' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {allPassed
                    ? 'All 8 Automated QA & Data Integrity Test Suites Passing (100%)'
                    : 'QA Verification Results'}
                </div>
                <div className="text-xs text-slate-500">
                  Verified live against current application state and deterministic calculation engine (`npm test` / `tsx tests/portfolio.test.ts`).
                </div>
              </div>
            </div>
            <div className="font-mono text-xs text-slate-600">
              Persistence Engine: <strong className="text-slate-900">{state.storageMode || 'sqlite-server'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qaResults.map((check) => (
              <div
                key={check.id}
                className="bg-white border border-slate-200 rounded p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900">{check.suite}</span>
                  <span
                    className={`font-bold ${
                      check.passed ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {check.passed ? 'PASS · VERIFIED' : 'FAIL'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{check.title}</div>
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] font-mono space-y-1 text-slate-700">
                  <div>
                    <span className="text-slate-500">Expected: </span>
                    {check.expected}
                  </div>
                  <div>
                    <span className="text-slate-500">Actual:   </span>
                    <span className="font-semibold text-slate-900">{check.actual}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600">{check.evidenceNote}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: /video-assets Production Package */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 font-display">
                /video-assets Directory Files
              </h2>
              <p className="text-xs text-slate-500">
                Complete scripts, storyboard, voiceover, SRT captions, and shot timings for Video A (45–60s) & Video B (60–90s).
              </p>
            </div>

            <div className="space-y-2">
              {VIDEO_ASSET_FILES.map((file, idx) => (
                <button
                  key={file.filename}
                  type="button"
                  onClick={() => setSelectedVideoAssetIndex(idx)}
                  className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
                    selectedVideoAssetIndex === idx
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
                    <span>{file.path}</span>
                    <span>{file.category}</span>
                  </div>
                  <div className="text-xs font-bold mt-1">{file.title}</div>
                  <div className="text-[11px] mt-1 opacity-80 line-clamp-2">
                    {file.summary}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-mono text-[#1E3A8A] font-semibold">
                  {activeVideoFile.path}
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {activeVideoFile.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyContent(activeVideoFile.filename, activeVideoFile.content)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedFile === activeVideoFile.filename ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      activeVideoFile.filename,
                      activeVideoFile.content,
                      'text/plain;charset=utf-8;'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {activeVideoFile.filename}
                </button>
              </div>
            </div>

            <pre className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto">
              {activeVideoFile.content}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: SQL Schema */}
      {activeTab === 'schema' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                SQL-Compatible Relational Database Schema (`/schema.sql`)
              </h2>
              <p className="text-xs text-slate-500">
                Executed automatically by the embedded SQLite server (`projectpulse.db`) with foreign key cascades and domain check constraints.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadTextFile('schema.sql', sqlSchemaString, 'text/plain;charset=utf-8;')
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download schema.sql
            </button>
          </div>

          <pre className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {sqlSchemaString}
          </pre>
        </div>
      )}
    </div>
  );
};
