# Video B — Live Product Demo Walkthrough Script (60–90 Seconds)

**Title:** ProjectPulse AI — End-to-End PMO Guided Workflow  
**Target Duration:** 78 Seconds  
**Recording Resolution:** 1920×1080 (16:9) at 60 fps  
**Data Context:** 12 Synthetic Demonstration Projects across Technology, Finance, Operations, and Marketing.

---

## Pre-Recording Setup Instructions
1. Launch ProjectPulse AI at `http://localhost:3000`.
2. Click **Reset Demo Data** in the top bar to ensure the baseline 12 synthetic projects, 28 milestones, and 16 risks are in their exact initial state.
3. Either click **Start Guided Demo** in the top bar to let the automated 9-step presenter drive the screen transitions, or follow the manual click sequence below.

---

## Timed Shot-by-Shot Demo Script

### 00:00 – 00:12 | Step 1: Open the Executive Dashboard & Inspect Calculated KPIs
- **Screen Action:** Start on the **Executive Dashboard**. Hover across the top 4 KPI cards:
  - Total Portfolio: `12 Projects` (`6 Active`, `2 Completed`, `2 Delayed`, `2 At Risk`)
  - Portfolio Budget: `$14,550,000 Allocated` vs. `$13,845,000 Actual Spend` (`95.2% Utilization`)
  - Health Distribution: `6 Green · On Track`, `3 Amber · At Risk`, `3 Red · Delayed / Overrun`
  - Overdue Milestones: `4 Overdue Milestones` across the portfolio.
- **Narration:**  
  "Here in ProjectPulse AI, we start on the Executive Dashboard. Every metric on screen is dynamically calculated from our twelve synthetic demonstration projects across Technology, Finance, Operations, and Marketing—showing three Red initiatives that require immediate management attention."

### 00:12 – 00:25 | Step 2 & 3: Identify Delayed Projects & Open Project Inspector
- **Screen Action:** Click the **Delayed / Attention Required** filter or click directly on **`PRJ-102 · Core Banking Ledger Modernization`** (Finance Department, owned by Elena Rostova, Status: `Delayed`, Health: `Red`). The detailed Project Inspector drawer opens.
- **Narration:**  
  "From the attention queue, we select PRJ-102: Core Banking Ledger Modernization in the Finance department. Opening its project inspector reveals why this initiative triggered a Red health alert."

### 00:25 – 00:38 | Step 4 & 5: Inspect Overdue Milestone & Budget Variance
- **Screen Action:**
  - In the inspector (or **Milestone Tracking** view), highlight milestone **`MS-102-2 · Mainframe Dual-Write Cutover`** (`Planned: 2026-09-15`, Status: `Overdue`, `65% Complete`). Expand its progress history log.
  - Switch to the **Budget Variance** panel for `PRJ-102`: Allocated Budget `$2,400,000`, Actual Spend `$2,590,000`, Variance `+$190,000 (+7.9% Over Budget)`, Utilization `107.9%`.
- **Narration:**  
  "First, milestone MS-102-2—Mainframe Dual-Write Cutover—is overdue at sixty-five percent completion. Second, budget monitoring shows actual expenditure has reached two point five nine million dollars against a two point four million dollar allocation—an overrun of one hundred ninety thousand dollars."

### 00:38 – 00:52 | Step 6: Open Risk Register & Review High-Impact Risk
- **Screen Action:** Navigate to **Risk Management** and filter by **Critical & Unresolved Risks**. Highlight **`RSK-102-A · Legacy COBOL Batch Reconciliation Latency`** (`Probability: 5`, `Impact: 4`, `Risk Score: 20 / Critical`, Status: `Mitigating`, Mitigation Progress: `45%`).
- **Narration:**  
  "Jumping to the Risk Register, we filter for critical unresolved risks and inspect RSK-102-A. With a probability of five and impact of four, its calculated risk score is twenty out of twenty-five, directly explaining the cutover delay."

### 00:52 – 01:05 | Step 7 & 8: Update Milestone & Mitigation Action, Then Verify Recalculated Dashboard KPIs
- **Screen Action:**
  - Update `RSK-102-A` mitigation progress from `45%` to `85%` and mark `MS-102-2` as `Completed (100%)` after deploying the parallel reconciliation patch.
  - Return to the **Executive Dashboard**. Point out that Overdue Milestones immediately drop from `4` to `3`, Milestone Completion Rate increases, and `PRJ-102` progress updates automatically.
- **Narration:**  
  "Let's record a real management intervention: we advance the risk mitigation to eighty-five percent and complete the overdue cutover milestone. Returning to the Executive Dashboard, our overdue milestone count, project completion rate, and portfolio health metrics recalculate immediately."

### 01:05 – 01:18 | Step 9: Generate Evidence-Based AI Weekly Executive Report
- **Screen Action:** Open **AI Executive Assistant**, select **Weekly Executive Report**, and click **Generate AI Summary from Live Data**. Show the generated executive summary, delayed project highlights, and evidence-linked recommendations. Toggle **Approve for Distribution** and click **Export CSV / Print PDF**.
- **Narration:**  
  "Finally, we open the AI Executive Assistant and generate a weekly management brief. Every recommendation cites exact project IDs, budget variances, and risk scores from our updated database—giving PMO leaders a verified, audit-ready report in seconds."
