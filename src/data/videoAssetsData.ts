export interface VideoAssetFile {
  filename: string;
  path: string;
  title: string;
  category: 'Video A (45–60s)' | 'Video B (60–90s)' | 'Production Package';
  summary: string;
  content: string;
}

export const VIDEO_ASSET_FILES: VideoAssetFile[] = [
  {
    filename: 'problem_solution_script.md',
    path: '/video-assets/problem_solution_script.md',
    title: 'Video A — Problem & Solution Script (45–60s)',
    category: 'Video A (45–60s)',
    summary: 'Timed 4-segment script covering scattered spreadsheets, hidden overruns, ProjectPulse AI modules, and evidence-grounded AI reporting.',
    content: `# Video A — Problem and Solution Script (45–60 Seconds)

**Title:** From Scattered Spreadsheets to Evidence-Based Portfolio Intelligence  
**Target Duration:** 55 Seconds  
**Disclaimer:** All records displayed on screen are labeled *Synthetic Demonstration Data*.

## 00:00 – 00:10 | Scattered Tracking & Poor Visibility
- **Visual:** Split-screen of disconnected departmental trackers across Technology, Finance, Operations, and Marketing transitioning into ProjectPulse AI.
- **Voiceover:** "When an organization manages dozens of strategic initiatives across Technology, Finance, Operations, and Marketing, critical project data gets trapped in disconnected spreadsheets and static weekly slide decks."

## 00:10 – 00:20 | How Delays, Risks & Budget Overruns Affect Decisions
- **Visual:** Zoom into PRJ-102 (+$190,000 budget overrun), overdue milestone MS-102-2, and critical risk RSK-102-A (Score 20/25).
- **Voiceover:** "Without a single source of truth, overdue milestones, budget overruns, and compounding technical risks stay hidden until deadlines are already missed—forcing leadership to react too late."

## 00:20 – 00:45 | Introducing ProjectPulse AI (Portfolio, Milestones, Risk & Budget)
- **Visual:** Tour of Executive Dashboard KPIs ($14.55M allocated, 6 Green / 3 Amber / 3 Red), Milestone Tracking with progress history, Risk Register (Probability × Impact), and Departmental Budget Variance.
- **Voiceover:** "ProjectPulse AI centralizes your entire project portfolio into one live intelligence workspace. Every KPI, health status, and departmental rollup updates automatically from underlying records. Track planned versus actual milestone dates, score critical risks consistently on a probability-by-impact matrix, and pinpoint budget variances down to the exact dollar."

## 00:45 – 00:55 | Evidence-Based AI Executive Report
- **Visual:** Generate AI Executive Report in Gemini Assistant, inspect supporting evidence tags, approve for human review, and export to CSV/PDF.
- **Voiceover:** "And when it's time to brief leadership, the Gemini-powered AI Executive Assistant synthesizes your live database into an evidence-backed management report—citing exact project variances, overdue milestones, and risk scores for human review before export."`,
  },
  {
    filename: 'demo_walkthrough_script.md',
    path: '/video-assets/demo_walkthrough_script.md',
    title: 'Video B — Live Product Demo Walkthrough (60–90s)',
    category: 'Video B (60–90s)',
    summary: 'Step-by-step live screen recording script walking through the 9-step PMO business workflow.',
    content: `# Video B — Live Product Demo Walkthrough Script (60–90 Seconds)

**Target Duration:** 78 Seconds | **Resolution:** 1920×1080 @ 60fps

### 00:00 – 00:12 | Open Executive Dashboard & Inspect Calculated KPIs
- Hover across the 4 KPI summary cards: 12 Total Projects, $14.55M Allocated vs $13.82M Actual Spend, 6 Green / 3 Amber / 3 Red Health, and 4 Overdue Milestones.
- **VO:** "Here in ProjectPulse AI, we start on the Executive Dashboard. Every metric on screen is dynamically calculated from our twelve synthetic demonstration projects—showing three Red initiatives that require immediate management attention."

### 00:12 – 00:25 | Identify Delayed Project (PRJ-102)
- Select PRJ-102 (Core Banking Ledger Modernization) in Finance.
- **VO:** "From the attention queue, we select PRJ-102: Core Banking Ledger Modernization in the Finance department. Opening its project inspector reveals why this initiative triggered a Red health alert."

### 00:25 – 00:38 | Inspect Overdue Milestone & Budget Variance
- Inspect milestone MS-102-2 (Overdue, Planned 2026-09-15, 65% complete) and Budget Variance (+$190,000 overrun, 107.9% utilization).
- **VO:** "First, milestone MS-102-2—Mainframe Dual-Write Cutover—is overdue at sixty-five percent completion. Second, budget monitoring shows actual expenditure has reached $2.59M against a $2.40M allocation—an overrun of $190,000."

### 00:38 – 00:52 | Review High-Impact Risk in Risk Register
- Open Risk Management, filter Critical & Unresolved, and inspect RSK-102-A (Probability 5 × Impact 4 = Score 20/25).
- **VO:** "Jumping to the Risk Register, we filter for critical unresolved risks and inspect RSK-102-A. With a probability of five and impact of four, its calculated risk score is twenty out of twenty-five."

### 00:52 – 01:05 | Update Project Record & Verify Dashboard Recalculation
- Update RSK-102-A mitigation progress to 85% and mark MS-102-2 Completed (100%). Return to Executive Dashboard to show Overdue Milestones drop from 4 to 3.
- **VO:** "Let's record a real management intervention: we advance the risk mitigation to 85% and complete the overdue cutover milestone. Returning to the Executive Dashboard, our overdue milestone count and portfolio progress recalculate immediately."

### 01:05 – 01:18 | Generate Evidence-Based AI Weekly Report
- Open AI Executive Assistant, generate Weekly Executive Report, review evidence citations, approve, and export.
- **VO:** "Finally, we open the AI Executive Assistant and generate a weekly management brief. Every recommendation cites exact project IDs, budget variances, and risk scores from our updated database."`,
  },
  {
    filename: 'storyboard.md',
    path: '/video-assets/storyboard.md',
    title: 'Visual Storyboard & Scene Flow',
    category: 'Production Package',
    summary: 'Visual scene composition, UI states, lower-third callouts, and transition flowcharts for Video A and Video B.',
    content: `# ProjectPulse AI — Visual Storyboard (Video A & Video B)

> Note: No MP4 binary is pre-rendered; use the timings and screen cues below to record live 1080p60 video from the application.

## Video A Scenes (00:00 – 00:55)
- **Scene A1 (00:00–00:10):** Fragmented CSV trackers vs. ProjectPulse AI Header with Synthetic Demonstration Data notice.
- **Scene A2 (00:10–00:20):** Red variance rows on PRJ-102 (+$190k) and PRJ-105 (+$145k).
- **Scene A3 (00:20–00:32):** Full 1440px Executive Dashboard showing KPI cards, Health Breakdown, and Department Performance chart.
- **Scene A4 (00:32–00:45):** 3-cut sequence across Milestone Tracking (Overdue filter), Risk Register (Score 20/25), and Budget Monitor.
- **Scene A5 (00:45–00:55):** AI Executive Assistant generating structured report with explicit supporting evidence citations.

## Video B Scenes (00:00 – 01:18)
- **Scene B1 (00:00–00:12):** Click Start Guided Demo -> Highlight Dashboard KPIs (12 Projects, 3 Red, 4 Overdue Milestones).
- **Scene B2 (00:12–00:25):** Open PRJ-102 Inspector (Core Banking Ledger Modernization).
- **Scene B3 (00:25–00:38):** Inspect MS-102-2 Overdue status (65%) & +$190,000 budget overrun.
- **Scene B4 (00:38–00:52):** Inspect RSK-102-A in Risk Register (Prob 5 × Impact 4 = Score 20).
- **Scene B5 (00:52–01:05):** Complete MS-102-2 & advance RSK-102-A mitigation -> Return to Dashboard (Overdue drops 4 -> 3).
- **Scene B6 (01:05–01:18):** Generate AI Weekly Executive Report -> Human Review Approval -> Export CSV/PDF.`,
  },
  {
    filename: 'voiceover.md',
    path: '/video-assets/voiceover.md',
    title: 'Voiceover Narration Tracks',
    category: 'Production Package',
    summary: 'Clean studio narration transcripts with exact timecode markers for both videos.',
    content: `# Voiceover Narration Scripts — ProjectPulse AI

## Track 1: Video A — Problem & Solution (00:00 – 00:55)
[00:00–00:10] When an organization manages dozens of strategic initiatives across Technology, Finance, Operations, and Marketing, critical project data gets trapped in disconnected spreadsheets and static weekly slide decks.
[00:10–00:20] Without a single source of truth, overdue milestones, budget overruns, and compounding technical risks stay hidden until deadlines are already missed—forcing leadership to react too late.
[00:20–00:33] ProjectPulse AI centralizes your entire project portfolio into one live intelligence workspace. Every KPI, health status, and departmental rollup updates automatically from underlying records.
[00:33–00:45] Track planned versus actual milestone dates, score critical risks consistently on a probability-by-impact matrix, and pinpoint budget variances down to the exact dollar.
[00:45–00:55] And when it's time to brief leadership, the Gemini-powered AI Executive Assistant synthesizes your live database into an evidence-backed management report—citing exact project variances, overdue milestones, and risk scores for human review before export.

## Track 2: Video B — Live Product Demo (00:00 – 01:18)
[00:00–00:12] Here in ProjectPulse AI, we start on the Executive Dashboard. Every metric on screen is dynamically calculated from our twelve synthetic demonstration projects across Technology, Finance, Operations, and Marketing—showing three Red initiatives that require immediate management attention.
[00:12–00:25] From the attention queue, we select PRJ-102: Core Banking Ledger Modernization in the Finance department. Opening its project inspector reveals why this initiative triggered a Red health alert.
[00:25–00:38] First, milestone MS-102-2—Mainframe Dual-Write Cutover—is overdue at sixty-five percent completion. Second, budget monitoring shows actual expenditure has reached two point five nine million dollars against a two point four million dollar allocation—an overrun of one hundred ninety thousand dollars.
[00:38–00:52] Jumping to the Risk Register, we filter for critical unresolved risks and inspect RSK-102-A. With a probability of five and impact of four, its calculated risk score is twenty out of twenty-five, directly explaining the cutover delay.
[00:52–01:05] Let's record a real management intervention: we advance the risk mitigation to eighty-five percent and complete the overdue cutover milestone. Returning to the Executive Dashboard, our overdue milestone count, project completion rate, and portfolio health metrics recalculate immediately.
[01:05–01:18] Finally, we open the AI Executive Assistant and generate a weekly management brief. Every recommendation cites exact project IDs, budget variances, and risk scores from our updated database—giving PMO leaders a verified, audit-ready report in seconds.`,
  },
  {
    filename: 'captions.srt',
    path: '/video-assets/captions.srt',
    title: 'SubRip Captions (captions.srt)',
    category: 'Production Package',
    summary: 'Standard SRT subtitle file synchronized to Video A and Video B narration tracks.',
    content: `1
00:00:00,000 --> 00:00:05,200
When an organization manages dozens of strategic initiatives across Technology, Finance,

2
00:00:05,200 --> 00:00:10,000
Operations, and Marketing, critical project data gets trapped in disconnected spreadsheets.

3
00:00:10,000 --> 00:00:15,400
Without a single source of truth, overdue milestones, budget overruns, and technical risks

4
00:00:15,400 --> 00:00:20,000
stay hidden until deadlines are missed—forcing leadership to react too late.

5
00:00:20,000 --> 00:00:26,500
ProjectPulse AI centralizes your entire project portfolio into one live intelligence workspace.

6
00:00:26,500 --> 00:00:33,000
Every KPI, health status, and departmental rollup updates automatically from underlying records.

7
00:00:33,000 --> 00:00:39,200
Track planned versus actual milestone dates, score critical risks on a probability-by-impact matrix,

8
00:00:39,200 --> 00:00:45,000
and pinpoint departmental budget variances down to the exact dollar.

9
00:00:45,000 --> 00:00:50,400
When briefing leadership, the Gemini AI Executive Assistant synthesizes your live database

10
00:00:50,400 --> 00:00:55,000
into an evidence-backed report citing exact project variances and risk scores for human review.`,
  },
  {
    filename: 'shot_list.md',
    path: '/video-assets/shot_list.md',
    title: 'Shot List & Screen Recording Guide',
    category: 'Production Package',
    summary: 'Detailed shot numbers, durations, cursor actions, and data verification checkpoints.',
    content: `# Shot List & Screen Recording Guide — ProjectPulse AI

## Video A — Problem & Solution (55s)
- **A-01 (00:00–00:05):** Header & Synthetic Demonstration Data notice.
- **A-02 (00:05–00:10):** Project Portfolio Table across 4 departments.
- **A-03 (00:10–00:15):** Filter by Delayed status (PRJ-102, PRJ-105).
- **A-04 (00:15–00:20):** Budget Variance column (+$190,000 and +$145,000 overruns).
- **A-05 (00:20–00:28):** Executive Dashboard KPIs & Health Distribution bar.
- **A-06 (00:28–00:36):** Milestone Tracking Overdue filter & Progress History drawer.
- **A-07 (00:36–00:45):** Risk Management sorted by Quantitative Risk Score (20/25).
- **A-08 (00:45–00:55):** AI Executive Assistant evidence-grounded report & export.

## Video B — Live Product Demo (78s)
- **B-01 (00:00–00:08):** Step 1 — Click Start Guided Demo on Executive Dashboard.
- **B-02 (00:08–00:16):** Step 2 — Identify Delayed & At-Risk initiatives.
- **B-03 (00:16–00:25):** Step 3 — Open PRJ-102 Project Inspector.
- **B-04 (00:25–00:34):** Step 4 — Inspect overdue milestone MS-102-2 (65%).
- **B-05 (00:34–00:43):** Step 5 — Inspect PRJ-102 budget variance (+$190K / 107.9%).
- **B-06 (00:43–00:52):** Step 6 — Inspect high-impact risk RSK-102-A (Score 20/25).
- **B-07 (00:52–01:01):** Step 7 — Complete MS-102-2 (100%) & advance RSK-102-A mitigation (85%).
- **B-08 (01:01–01:09):** Step 8 — Return to Dashboard; verify Overdue Milestones drop 4 -> 3.
- **B-09 (01:09–01:18):** Step 9 — Generate AI Weekly Executive Report & export CSV/PDF.`,
  },
];
