# ProjectPulse AI — Project Management Office & Portfolio Intelligence Dashboard

**ProjectPulse AI** is an enterprise Project Management Office (PMO) and Portfolio Intelligence application built with React 19, TypeScript, Tailwind CSS, Express, SQLite (`better-sqlite3`), and the `@google/genai` SDK (`gemini-3.8-flash`).

Every KPI, chart, filter, milestone overdue count, budget variance, quantitative risk score, and AI executive report is dynamically calculated from the underlying relational dataset. All pre-loaded records are explicitly labeled as **Synthetic Demonstration Data**.

---

## 1. Functional Modules

1. **Executive Dashboard**
   - Dynamically computes Total, Active, Completed, Delayed, and At-Risk project counts.
   - Displays Portfolio Allocated Budget (`$14,550,000`), Actual Spend (`$14,405,000`), Net Variance, and Utilization `%`.
   - Project Health Distribution (`Green`, `Amber`, `Red`) with proportional bar and click-through filtering.
   - Department-wise performance (`Technology`, `Finance`, `Operations`, `Marketing`), milestone completion rates, and an interactive **Management Attention Queue**.
2. **Project Portfolio**
   - Full Create, Read, Update, Delete (CRUD) lifecycle plus detailed **Project Inspector** slide-over drawer.
   - Search and multi-facet filtering by Owner, Department, Status, Health, Risk Tier, and Over-Budget status.
   - RFC-4180 CSV Import and Export.
3. **Milestone Tracking**
   - Add and update milestones with planned versus actual completion dates.
   - Automatic overdue detection relative to the portfolio reference date (`2026-11-02`) with exact days-late calculation.
   - Chronological **Milestone Progress History** audit log recording every completion percentage and status change.
4. **Risk Management**
   - Interactive **5×5 Probability × Impact Matrix** (`Risk Score = Probability × Impact`, scale `1–25`).
   - Quantitative Risk Register with filtering for Critical (`Score >= 16`), High (`12–15`), Medium (`6–10`), Low (`1–5`), and Unresolved statuses.
   - Inline mitigation progress slider (`0–100%`) and status controls (`Open`, `Mitigating`, `Resolved`).
5. **Budget Monitoring**
   - Portfolio and project-level budget versus actual expenditure ledger.
   - Deterministic variance (`Actual Spend - Allocated Budget`) and utilization (`(Actual / Allocated) × 100`) calculations.
   - One-click filter for projects exceeding budget and department-wise financial analysis.
6. **Management Reporting**
   - Generate and archive **Weekly** and **Monthly** governance packets.
   - Includes project health breakdown, overdue milestones, budget variances, unresolved major risks, and evidence-backed follow-up actions.
   - Export reports to **CSV** and print-formatted **PDF**.
7. **AI Executive Assistant**
   - Server-side Gemini integration (`POST /api/ai/executive-report` using `gemini-3.8-flash` with structured JSON `responseSchema`).
   - Synthesizes management summaries strictly from real portfolio records—never inventing figures, statuses, or milestones.
   - Explains which recorded evidence supports each recommendation and provides a **Human Review & Edit Workbench** prior to approval and export.
8. **QA & Video Package Inspector**
   - Runs all 8 automated QA verification suites live in the browser against current records, displays `/schema.sql`, and provides full access to `/video-assets`.

---

## 2. Automatic Recruiter Guided Demo (9-Step Workflow)

Click **Start Guided Demo** in the top navigation bar to run the automated or step-controlled 9-step business workflow:
1. Open the **Executive Dashboard**.
2. Identify delayed and at-risk projects from calculated KPIs.
3. Open delayed project **`PRJ-102 · Core Banking Ledger Modernization`**.
4. Inspect its overdue milestone (**`MS-102-2 · Mainframe Dual-Write Cutover`**).
5. Inspect its budget variance (**`+$190,000`** overrun, **`107.9%`** utilization).
6. Open the **Risk Register** and review high-impact risk **`RSK-102-A`** (`Score 20/25 · Critical`).
7. Execute a live state update: complete **`MS-102-2 (100%)`** and advance **`RSK-102-A`** mitigation to **`85%`**.
8. Return to the **Executive Dashboard** and verify recalculated KPIs (`Overdue Milestones` drops from `4` to `3`; `PRJ-102` progress rises from `58%` to `74%`).
9. Open the **AI Executive Assistant** and generate a weekly executive report from the updated dataset.

Includes **Auto-Play / Pause**, **Previous / Next Step**, **Reset Demo Data**, and **Explore Manually** controls.

---

## 3. Database Schema & Persistence

- **Relational Schema**: Defined in [`/schema.sql`](./schema.sql) with 5 normalized tables: `projects`, `milestones`, `milestone_history`, `risks`, and `executive_reports`.
- **Dual-Layer Persistence**: Stored in an embedded SQLite database (`projectpulse.db`) via Express REST routes (`/api/portfolio`, `/api/portfolio/sync`, `/api/portfolio/reset`) with automatic client-side `localStorage` fallback.

---

## 4. Running & Testing

```bash
# Start full-stack Express + Vite server on port 3000
npm run dev

# Run the automated 8-suite QA & Data Integrity tests
npm test

# Type-check and build for production
npm run lint
npm run build
```

---

## 5. Video & Presentation Package (`/video-assets`)

All production scripts, storyboards, voiceover narration tracks, SRT captions, and shot timings for **Video A (Problem & Solution, 45–60s)** and **Video B (Live Product Demo, 60–90s)** are located in [`/video-assets`](./video-assets):
- `/video-assets/problem_solution_script.md`
- `/video-assets/demo_walkthrough_script.md`
- `/video-assets/storyboard.md`
- `/video-assets/voiceover.md`
- `/video-assets/captions.srt`
- `/video-assets/shot_list.md`
