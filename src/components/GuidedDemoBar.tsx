import React from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GuidedDemoStep } from '../types/portfolio';

export const GUIDED_DEMO_STEPS: GuidedDemoStep[] = [
  {
    stepNumber: 1,
    title: 'Open PwC Executive Dashboard & Inspect Calculated KPIs',
    module: 'dashboard',
    description:
      'Review live portfolio KPIs dynamically calculated from all 12 synthetic PwC India engagements across Technology, Finance, Operations, and Marketing.',
    evidenceCallout: '12 Engagements · $14.55M Allocated · 6 Green, 3 Amber, 3 Red',
    actionLabel: 'Identify Delayed Projects',
  },
  {
    stepNumber: 2,
    title: 'Identify Delayed & At-Risk Engagements from KPIs',
    module: 'dashboard',
    description:
      'Focus on the Partner Attention Queue where Red/Amber initiatives (led by Ananya Iyer, Rohan Deshmukh, Kavita Nair, and Aditya Chatterjee) are surfaced automatically.',
    evidenceCallout: 'Attention Queue: PRJ-102 (Ananya Iyer), PRJ-105 (Rohan Deshmukh), PRJ-106, PRJ-108',
    actionLabel: 'Open Delayed Project PRJ-102',
  },
  {
    stepNumber: 3,
    title: 'Open Delayed Engagement: PRJ-102 Core Banking CBS & Ind-AS Ledger',
    module: 'portfolio',
    description:
      'Inspect PRJ-102 in the Finance Practice (led by Executive Director Ananya Iyer, 58% progress, status: Delayed) to diagnose the root causes of its Red health status.',
    evidenceCallout: 'PRJ-102 · Finance · Lead: Ananya Iyer (PwC Mumbai) · Status: Delayed (58%)',
    actionLabel: 'Inspect Overdue Milestone',
  },
  {
    stepNumber: 4,
    title: 'Inspect Overdue Milestone & Progress History',
    module: 'milestones',
    description:
      'Examine milestone MS-102-2 ("Mainframe Dual-Write Cutover"), planned for 2026-09-15 and currently Overdue at 65% completion during peak RTGS/NEFT windows.',
    evidenceCallout: 'MS-102-2 · Owner: Ananya Iyer · Planned: 2026-09-15 · Overdue (48d late)',
    actionLabel: 'Inspect Budget Variance',
  },
  {
    stepNumber: 5,
    title: 'Inspect Engagement & Practice Budget Variance',
    module: 'budget',
    description:
      'Verify PRJ-102 expenditure: $2,590,000 actual spend against $2,400,000 allocated budget—an overrun of +$190,000 (107.9% utilization).',
    evidenceCallout: 'PRJ-102 Variance: +$190,000 Over Budget · Utilization: 107.9%',
    actionLabel: 'Open Risk Register',
  },
  {
    stepNumber: 6,
    title: 'Review High-Impact Risk in Risk Register',
    module: 'risks',
    description:
      'Inspect critical risk RSK-102-A ("Legacy COBOL batch reconciliation lock contention") owned by Ananya Iyer and scored at 20/25 (Probability 5 × Impact 4).',
    evidenceCallout: 'RSK-102-A · Owner: Ananya Iyer · Score 20/25 (Critical)',
    actionLabel: 'Execute Live Intervention',
  },
  {
    stepNumber: 7,
    title: 'Update Milestone & Risk Mitigation (Live State Mutation)',
    module: 'milestones',
    description:
      'Record a real Partner intervention: complete milestone MS-102-2 (100%) and advance RSK-102-A mitigation to 85%, writing the update to SQLite & browser storage.',
    evidenceCallout: 'Mutation Applied: MS-102-2 -> Completed (100%) · RSK-102-A Mitigation -> 85%',
    actionLabel: 'Verify Updated Dashboard KPIs',
  },
  {
    stepNumber: 8,
    title: 'Return to Dashboard & Verify Recalculated KPIs',
    module: 'dashboard',
    description:
      'Observe real-time KPI recalculation: Overdue Milestones drop from 4 to 3, Milestone Completion Rate rises, and PRJ-102 progress increases to 74%.',
    evidenceCallout: 'Live Recalculation: Overdue Milestones 4 -> 3 · PRJ-102 Progress 58% -> 74%',
    actionLabel: 'Generate AI Weekly Report',
  },
  {
    stepNumber: 9,
    title: 'Generate Evidence-Based AI Weekly Executive Report',
    module: 'ai-assistant',
    description:
      'Synthesize a PwC Partner Steering Report from the updated database using Gemini AI, citing exact engagement records for human review and CSV/PDF export.',
    evidenceCallout: 'PwC AI Brief Generated · Grounded in Live Telemetry · Ready for Review',
    actionLabel: 'Finish Guided Tour',
  },
];

interface GuidedDemoBarProps {
  isActive: boolean;
  currentStepIndex: number;
  isAutoPlaying: boolean;
  demoInterventionApplied: boolean;
  onStartDemo: () => void;
  onToggleAutoPlay: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onJumpToStep: (idx: number) => void;
  onExitDemo: () => void;
  onResetData: () => void;
}

export const GuidedDemoBar: React.FC<GuidedDemoBarProps> = ({
  isActive,
  currentStepIndex,
  isAutoPlaying,
  demoInterventionApplied,
  onStartDemo,
  onToggleAutoPlay,
  onPrevStep,
  onNextStep,
  onJumpToStep,
  onExitDemo,
  onResetData,
}) => {
  if (!isActive) {
    return (
      <div className="no-print bg-[#0F172A] text-white border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-[#FDBA74] font-semibold">
            Synthetic Demonstration Data · PwC India Advisory PMO
          </span>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span className="text-slate-300">
            12 pre-loaded client engagements across Mumbai, Bengaluru, Gurugram, Pune, Hyderabad & Kolkata
          </span>
          {demoInterventionApplied && (
            <>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-emerald-300 font-mono">
                Live edits active
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onStartDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Guided Demo (9 Steps)
          </button>
          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>
    );
  }

  const step = GUIDED_DEMO_STEPS[currentStepIndex] || GUIDED_DEMO_STEPS[0];

  return (
    <div className="no-print bg-[#0F172A] text-white border-b border-slate-800 px-6 py-4">
      <div className="max-w-[1440px] mx-auto space-y-3">
        {/* Top Row: Step Progress Indicators & Playback Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-[#FDBA74] uppercase tracking-wider">
              PwC Partner Guided Walkthrough · Step {step.stepNumber} of {GUIDED_DEMO_STEPS.length}
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {GUIDED_DEMO_STEPS.map((s, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <button
                    key={s.stepNumber}
                    type="button"
                    onClick={() => onJumpToStep(idx)}
                    title={`Step ${s.stepNumber}: ${s.title}`}
                    className={`h-6 w-6 rounded text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                      isCurrent
                        ? 'bg-[#D04A02] text-white ring-2 ring-orange-300'
                        : isCompleted
                        ? 'bg-emerald-800/70 text-emerald-200 hover:bg-emerald-700'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {s.stepNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleAutoPlay}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAutoPlaying
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-200 hover:bg-amber-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Auto-Play
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Auto-Play Tour
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{step.actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data
            </button>

            <button
              type="button"
              onClick={onExitDemo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5" />
              Explore Manually
            </button>
          </div>
        </div>

        {/* Bottom Row: Current Step Explanation & Live Telemetry Callout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-900/90 border border-slate-800 rounded p-3">
          <div className="lg:col-span-8 space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FDBA74] shrink-0" />
              <h3 className="text-sm font-semibold text-white font-display">
                {step.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {step.description}
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-center lg:items-end">
            <div className="text-[11px] text-slate-400 uppercase font-mono">
              Verified Live Record Evidence
            </div>
            <div className="text-xs font-mono text-emerald-300 font-medium mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{step.evidenceCallout}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
