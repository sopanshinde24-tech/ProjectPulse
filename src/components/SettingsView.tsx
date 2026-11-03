import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  Database,
  DollarSign,
  Download,
  FolderKanban,
  Lock,
  Mail,
  MapPin,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react';
import {
  ActiveModuleId,
  DashboardKPIs,
  PortfolioState,
  UserAppRole,
} from '../types/portfolio';
import { formatCurrency } from '../utils/calculations';
import { exportProjectsToCSV, triggerCSVDownload } from '../utils/csvExport';

interface SettingsViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  currentUserName: string;
  currentUserRole: UserAppRole;
  onSwitchUserRole: (role: UserAppRole, userName: string) => void;
  onUpdateReferenceDate: (newRefDate: string) => void;
  onResetDemoData: () => void;
  onOpenQAVideoPackage: () => void;
  onNavigateModule: (mod: ActiveModuleId) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  kpis,
  currentUserName,
  currentUserRole,
  onSwitchUserRole,
  onUpdateReferenceDate,
  onResetDemoData,
  onOpenQAVideoPackage,
  onNavigateModule,
}) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'workspace' | 'rbac' | 'notifications' | 'data'
  >('profile');

  // Editable Executive Profile Credentials for Sopan Shinde
  const [partnerCode, setPartnerCode] = useState('PWC-IN-88412');
  const [practiceSpecialization, setPracticeSpecialization] = useState(
    'Zero-Trust Cloud Architecture, RBI/SEBI Cyber Resilience & Enterprise GenAI'
  );
  const [signOffLimitUsd, setSignOffLimitUsd] = useState('$25,000,000 USD');
  const [committeeRole, setCommitteeRole] = useState(
    'Chair — PwC India Portfolio Investment & Risk Steering Committee'
  );
  const [executiveBio, setExecutiveBio] = useState(
    'Senior Advisory Partner leading digital infrastructure, regulatory cyber-mesh deployments, and enterprise portfolio intelligence across BFSI, Capital Markets, and Industrial engagements in India.'
  );
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  const [refDateInput, setRefDateInput] = useState(state.referenceDate);
  const [workspaceName, setWorkspaceName] = useState('PwC India Advisory · Enterprise PMO');
  const [fiscalCalendar, setFiscalCalendar] = useState('April – March (India FY26-27)');
  const [notifyOverdueMilestones, setNotifyOverdueMilestones] = useState(true);
  const [notifyCriticalRisks, setNotifyCriticalRisks] = useState(true);
  const [notifyBudgetOverruns, setNotifyBudgetOverruns] = useState(true);

  const activeTeamMember = useMemo(() => {
    const members = state.teamMembers || [];
    return (
      members.find((tm) => tm.name.toLowerCase() === currentUserName.toLowerCase()) ||
      members[0] || {
        id: 'tm-1',
        name: 'Sopan Shinde',
        email: 'sopan.shinde@pwc-india-demo.in',
        designation: 'Partner, Cyber & Cloud Transformation',
        appRole: 'Administrator' as UserAppRole,
        department: 'Technology' as const,
        location: 'Mumbai (BKC)',
        weeklyCapacityHours: 40,
        avatarInitials: 'SS',
      }
    );
  }, [state.teamMembers, currentUserName]);

  const activeWorkload = useMemo(() => {
    return (
      kpis.teamWorkloads.find(
        (w) => w.name.toLowerCase() === activeTeamMember.name.toLowerCase()
      ) || kpis.teamWorkloads[0]
    );
  }, [kpis.teamWorkloads, activeTeamMember.name]);

  // Compute live portfolio metrics specifically for Sopan Shinde / Active Persona
  const personaPortfolioStats = useMemo(() => {
    const ownedProjects = state.projects.filter(
      (p) => p.owner.toLowerCase() === activeTeamMember.name.toLowerCase()
    );
    const assignedProjects = state.projects.filter(
      (p) =>
        p.owner.toLowerCase() === activeTeamMember.name.toLowerCase() ||
        (p.teamMemberIds || []).includes(activeTeamMember.id)
    );

    const targetList = ownedProjects.length > 0 ? ownedProjects : assignedProjects;
    const totalAllocated = targetList.reduce((s, p) => s + p.allocatedBudget, 0);
    const totalActual = targetList.reduce((s, p) => s + p.actualSpend, 0);
    const avgProgress =
      targetList.length > 0
        ? Math.round(targetList.reduce((s, p) => s + p.progress, 0) / targetList.length)
        : 0;
    const utilPct =
      totalAllocated > 0 ? Math.round((totalActual / totalAllocated) * 1000) / 10 : 0;

    const memberTasks = (state.tasks || []).filter(
      (t) =>
        t.assigneeName.toLowerCase() === activeTeamMember.name.toLowerCase() ||
        t.assigneeId === activeTeamMember.id
    );
    const completedMemberTasks = memberTasks.filter((t) => t.status === 'Completed').length;

    const memberMilestones = state.milestones.filter(
      (m) => m.owner.toLowerCase() === activeTeamMember.name.toLowerCase()
    );
    const completedMemberMilestones = memberMilestones.filter(
      (m) => m.status === 'Completed' || m.completionPercent === 100
    ).length;

    return {
      ownedCount: ownedProjects.length,
      assignedCount: assignedProjects.length,
      projectsList: assignedProjects,
      totalAllocated,
      totalActual,
      utilPct,
      avgProgress,
      totalTasks: memberTasks.length,
      completedTasks: completedMemberTasks,
      totalMilestones: memberMilestones.length,
      completedMilestones: completedMemberMilestones,
    };
  }, [state.projects, state.tasks, state.milestones, activeTeamMember]);

  const handleExportFullJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projectpulse_pwc_workspace_${state.referenceDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPortfolioCSV = () => {
    const csv = exportProjectsToCSV(state.projects, kpis.projectMetricsMap);
    triggerCSVDownload(`projectpulse_portfolio_${state.referenceDate}.csv`, csv);
  };

  const handleSaveProfileCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedNotice(true);
    setTimeout(() => setProfileSavedNotice(false), 3200);
  };

  return (
    <div className="space-y-6">
      {/* Institutional Header Bar */}
      <div className="fin-card p-6 border-t-2 border-t-[#0F172A] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#D04A02] font-semibold">
            <span>Executive Dossier, Governance & Workspace Administration</span>
            <span>•</span>
            <span>Clearance: {currentUserRole}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Executive Partner Profile & Platform Governance
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Institutional identity dossier for <strong>{activeTeamMember.name}</strong>, professional
            advisory summary, financial sign-off authority, RBAC security matrix, and SQLite
            database controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateModule('my-projects')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#D04A02]" />
            <span>View My Assigned Portfolio</span>
          </button>
          <button
            type="button"
            onClick={onOpenQAVideoPackage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automated QA Suite (11/11)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Navigation Rail (3 Columns) */}
        <div className="lg:col-span-3 fin-card p-3.5 space-y-1 text-xs">
          <div className="px-3 py-2 border-b border-slate-200/80 mb-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Governance Navigation
            </div>
          </div>
          {[
            {
              id: 'profile' as const,
              label: 'Executive Profile (Sopan Shinde)',
              icon: UserCheck,
            },
            {
              id: 'workspace' as const,
              label: 'Workspace & Reference Date',
              icon: Sliders,
            },
            {
              id: 'rbac' as const,
              label: 'Team RBAC Permission Matrix',
              icon: ShieldCheck,
            },
            {
              id: 'notifications' as const,
              label: 'Alert & Escalation Thresholds',
              icon: Bell,
            },
            {
              id: 'data' as const,
              label: 'Database & Export Controls',
              icon: Database,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-l-2 border-[#D04A02] shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100/90'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Quick Institutional Summary Card in Left Rail */}
          <div className="mt-4 pt-4 border-t border-slate-200/90 px-2 pb-1 space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Active Session Credential
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-md bg-[#0F172A] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
                  {activeTeamMember.avatarInitials}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{activeTeamMember.name}</div>
                  <div className="text-[10px] font-mono text-[#D04A02] font-semibold truncate">
                    {currentUserRole}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200/80 pt-2">
                Senior Advisory Partner overseeing RBI/SEBI cyber resilience, zero-trust cloud
                transformation &amp; enterprise portfolio governance.
              </p>
              <div className="text-[10px] font-mono text-slate-600 space-y-1 pt-1 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">CREDENTIAL:</span>
                  <span className="font-bold text-slate-800">{partnerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PRACTICE:</span>
                  <span className="font-semibold text-slate-800">{activeTeamMember.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SIGN-OFF:</span>
                  <span className="font-bold text-emerald-700">{signOffLimitUsd}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Viewport (9 Columns) */}
        <div className="lg:col-span-9 space-y-6">
          {activeSection === 'profile' && (
            <>
              {/* 1. Institutional Partner Identity Banner */}
              <div className="fin-card-dark text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-800/90 pb-5">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-[#D04A02] text-white font-mono text-xl font-extrabold flex items-center justify-center border border-orange-300/40 shadow-md shrink-0">
                      {activeTeamMember.avatarInitials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold uppercase">
                          Verified Executive Partner
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[#FDBA74] font-mono text-[10px] font-bold uppercase">
                          {currentUserRole}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ID: {partnerCode}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                        {activeTeamMember.name}
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {activeTeamMember.designation} · PwC India Advisory ({activeTeamMember.department} Practice)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateModule('data-pipeline')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-xs transition-colors cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-[#FDBA74]" />
                      <span>ETL Data Pipeline</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPortfolioCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#D04A02] hover:bg-[#b53f02] text-white border border-orange-500/30 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Partner Ledger</span>
                    </button>
                  </div>
                </div>

                {/* Partner Metadata Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300 bg-slate-900/60 border border-slate-800/90 rounded-md px-3 py-2">
                    <Mail className="w-4 h-4 text-[#FDBA74] shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Corporate Email
                      </div>
                      <div className="font-mono text-white truncate">{activeTeamMember.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-300 bg-slate-900/60 border border-slate-800/90 rounded-md px-3 py-2">
                    <MapPin className="w-4 h-4 text-[#FDBA74] shrink-0" />
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Home Office
                      </div>
                      <div className="font-semibold text-white">{activeTeamMember.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-300 bg-slate-900/60 border border-slate-800/90 rounded-md px-3 py-2">
                    <Lock className="w-4 h-4 text-[#FDBA74] shrink-0" />
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Sign-Off Authority
                      </div>
                      <div className="font-mono font-bold text-emerald-400">{signOffLimitUsd}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-300 bg-slate-900/60 border border-slate-800/90 rounded-md px-3 py-2">
                    <Award className="w-4 h-4 text-[#FDBA74] shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Governance Committee
                      </div>
                      <div className="font-semibold text-white truncate">
                        PMO Risk &amp; Capital Board
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Executive Professional Summary & Institutional Mandate Section */}
              <div className="fin-card p-6 border-l-4 border-l-[#D04A02] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/90 pb-3.5">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#D04A02] font-bold">
                      Executive Professional Summary &amp; Advisory Charter
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Partner Mandate, Regulatory Specialization &amp; Fiduciary Oversight
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-semibold">
                    <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Tier-1 Institutional Signatory</span>
                  </span>
                </div>

                {/* Narrative Summary */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {executiveBio}
                </p>

                {/* 3-Column Institutional Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-3.5 rounded-md bg-slate-50/90 border border-slate-200/90 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      01 · Advisory Tenure &amp; Scope
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      16+ Years · Enterprise Cloud &amp; Cyber
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Direct Engagement Partner on{' '}
                      <strong className="font-mono text-slate-900">
                        {formatCurrency(personaPortfolioStats.totalAllocated)}
                      </strong>{' '}
                      in active Technology mandates and firm-wide governance across{' '}
                      <strong className="font-mono text-slate-900">
                        {state.projects.length} engagements
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md bg-slate-50/90 border border-slate-200/90 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      02 · Steering Committee Charter
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {committeeRole}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Presides over weekly stage-gate capital releases, critical path recovery
                      interventions, and high-exposure risk escalations (Score &ge; 16/25).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md bg-slate-50/90 border border-slate-200/90 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      03 · Regulatory &amp; Audit Assurance
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      RBI, SEBI &amp; ISO-27001 Compliance
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Certified signatory for sovereign cloud architectures, zero-trust identity
                      meshes, and enterprise data pipeline quality audits.
                    </p>
                  </div>
                </div>

                {/* Practice Specialization Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1">
                    Core Domains:
                  </span>
                  {practiceSpecialization.split(',').map((domain, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 shadow-2xs text-[11px] font-medium text-slate-700"
                    >
                      {domain.trim()}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-md bg-orange-50/70 border border-orange-200 text-[11px] font-mono font-semibold text-[#D04A02]">
                    Capital Sign-Off: {signOffLimitUsd}
                  </span>
                </div>
              </div>

              {/* 3. 4 Real-Time Financial & Execution Telemetry Cards for Sopan Shinde */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="fin-card-interactive p-4 border-t-2 border-t-[#1E3A8A]">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono uppercase font-semibold">Managed Capital</span>
                    <span className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {formatCurrency(personaPortfolioStats.totalAllocated)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                    Actual: {formatCurrency(personaPortfolioStats.totalActual)} (
                    {personaPortfolioStats.utilPct}% util)
                  </div>
                </div>

                <div className="fin-card-interactive p-4 border-t-2 border-t-[#D04A02]">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono uppercase font-semibold">
                      Assigned Engagements
                    </span>
                    <span className="w-7 h-7 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-[#D04A02]" />
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {personaPortfolioStats.assignedCount} Projects
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                    {personaPortfolioStats.ownedCount} Lead Partner · Avg{' '}
                    {personaPortfolioStats.avgProgress}% complete
                  </div>
                </div>

                <div className="fin-card-interactive p-4 border-t-2 border-t-[#0F172A]">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono uppercase font-semibold">Weekly Capacity</span>
                    <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-800" />
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {activeWorkload?.utilizationPercent ?? 70}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                    {activeWorkload?.allocatedWeeklyHours ?? 28}h /{' '}
                    {activeTeamMember.weeklyCapacityHours}h weekly allocation
                  </div>
                </div>

                <div className="fin-card-interactive p-4 border-t-2 border-t-emerald-600">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono uppercase font-semibold">
                      Deliverable Velocity
                    </span>
                    <span className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    {personaPortfolioStats.completedMilestones}/
                    {personaPortfolioStats.totalMilestones} MS
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                    {personaPortfolioStats.completedTasks}/{personaPortfolioStats.totalTasks} tasks
                    completed
                  </div>
                </div>
              </div>

              {/* 4. Direct Managed & Assigned Engagements Ledger Table */}
              <div className="fin-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Direct Managed &amp; Assigned Advisory Engagements ({activeTeamMember.name})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live relational financial and delivery telemetry for projects led or staffed
                      by {activeTeamMember.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateModule('portfolio')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <span>Explore All {state.projects.length} Portfolio Projects</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200/90 rounded-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-mono uppercase text-slate-600">
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Engagement Name</th>
                        <th className="py-2.5 px-3">Practice</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3 text-right">Approved Budget</th>
                        <th className="py-2.5 px-3 text-right">Actual Spend</th>
                        <th className="py-2.5 px-3 text-right">Progress</th>
                        <th className="py-2.5 px-3">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {personaPortfolioStats.projectsList.map((p) => {
                        const m = kpis.projectMetricsMap[p.id];
                        const isLead =
                          p.owner.toLowerCase() === activeTeamMember.name.toLowerCase();
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {p.code}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {p.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{p.department}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  isLead
                                    ? 'bg-orange-50 text-[#D04A02] border border-orange-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isLead ? 'Engagement Partner' : 'Advisory Team'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right">
                              {formatCurrency(p.allocatedBudget)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right">
                              {formatCurrency(p.actualSpend)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right font-bold">
                              {p.progress}%
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  m?.health === 'Green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : m?.health === 'Amber'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                {m?.health || 'Green'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Editable Partner Governance Mandate & Credentials */}
              <form
                onSubmit={handleSaveProfileCredentials}
                className="fin-card p-6 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Executive Governance Mandate &amp; Sign-Off Credentials
                    </h3>
                    <p className="text-xs text-slate-500">
                      Maintain institutional profile parameters, professional summary, and capital
                      approval thresholds for <strong>{activeTeamMember.name}</strong>.
                    </p>
                  </div>
                  {profileSavedNotice && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-bold">
                      ✓ Profile Credentials Updated
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Partner Credential Code
                    </label>
                    <input
                      type="text"
                      value={partnerCode}
                      onChange={(e) => setPartnerCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono bg-slate-50/50 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Capital Sign-Off Authority Limit
                    </label>
                    <input
                      type="text"
                      value={signOffLimitUsd}
                      onChange={(e) => setSignOffLimitUsd(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono bg-slate-50/50 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Steering Committee Mandate
                    </label>
                    <input
                      type="text"
                      value={committeeRole}
                      onChange={(e) => setCommitteeRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50/50 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Advisory Practice Specialization &amp; Regulatory Domain
                  </label>
                  <input
                    type="text"
                    value={practiceSpecialization}
                    onChange={(e) => setPracticeSpecialization(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50/50 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Executive Summary Bio
                  </label>
                  <textarea
                    rows={2}
                    value={executiveBio}
                    onChange={(e) => setExecutiveBio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50/50 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Save Executive Dossier
                  </button>
                </div>
              </form>

              {/* 6. Advisory Leadership Persona & RBAC Switcher Grid */}
              <div className="fin-card p-6 space-y-4 text-xs">
                <div className="border-b border-slate-200 pb-3.5">
                  <h3 className="text-base font-bold text-slate-900">
                    PwC India Advisory Leadership Directory &amp; Instant Persona Switcher
                  </h3>
                  <p className="text-slate-600 mt-0.5">
                    Click any Partner, Director, or Consultant below to switch the active session
                    persona and test role-based permissions across the workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(state.teamMembers || []).map((tm) => {
                    const isCurrent =
                      tm.name === currentUserName && tm.appRole === currentUserRole;
                    return (
                      <div
                        key={tm.id}
                        onClick={() => onSwitchUserRole(tm.appRole, tm.name)}
                        className={`p-3.5 rounded-md border cursor-pointer flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'border-[#D04A02] bg-orange-50/40 ring-1 ring-[#D04A02] shadow-sm'
                            : 'border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/70 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs ${
                              isCurrent
                                ? 'bg-[#D04A02] text-white'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {tm.avatarInitials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{tm.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {tm.designation}
                            </div>
                            <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                              Role: <strong>{tm.appRole}</strong> · {tm.department} · {tm.location}
                            </div>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded bg-[#D04A02] text-white font-mono text-[10px] font-bold shrink-0">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            Switch →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeSection === 'workspace' && (
            <div className="fin-card p-6 space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                Workspace &amp; Simulation Reference Date
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Organization Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fiscal Reporting Calendar
                  </label>
                  <input
                    type="text"
                    value={fiscalCalendar}
                    onChange={(e) => setFiscalCalendar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="p-4 rounded-md bg-slate-50 border border-slate-200/90 space-y-2">
                <label className="block font-bold text-slate-900">
                  Portfolio Reference Date (Overdue Milestone &amp; Task Evaluation Anchor)
                </label>
                <p className="text-slate-600">
                  All milestone and task overdue calculations compare planned due dates against this
                  reference date (default: <code>2026-11-02</code>).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="date"
                    value={refDateInput}
                    onChange={(e) => setRefDateInput(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-md font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateReferenceDate(refDateInput)}
                    className="px-4 py-1.5 rounded-md bg-[#D04A02] text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Apply Reference Date
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rbac' && (
            <div className="fin-card p-6 space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                Role-Based Access Control (RBAC) Matrix
              </h2>
              <div className="overflow-x-auto border border-slate-200/90 rounded-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-600">
                      <th className="py-2.5 px-3">Capability</th>
                      <th className="py-2.5 px-3">Administrator</th>
                      <th className="py-2.5 px-3">Project Manager</th>
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Executive / Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">
                        View Executive Dashboards &amp; Reports
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">
                        Update Tasks, Milestones &amp; Issues
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-red-600 font-mono">Read-Only</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">
                        Execute 6-Stage ETL Pipeline &amp; Upserts
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-red-600 font-mono">Read-Only</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">
                        Create/Delete Projects &amp; Edit Budgets
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-amber-700 font-mono">Restricted</td>
                      <td className="py-2.5 px-3 text-red-600 font-mono">Read-Only</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">Reset Workspace Database</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Allowed</td>
                      <td className="py-2.5 px-3 text-red-600 font-mono">Denied</td>
                      <td className="py-2.5 px-3 text-red-600 font-mono">Denied</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="fin-card p-6 space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                Automated Governance Alert Rules
              </h2>
              <label className="flex items-center justify-between p-3.5 border border-slate-200/90 rounded-md hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Overdue Milestone Alerts</div>
                  <div className="text-slate-500">
                    Trigger top-bar notification when a milestone passes its planned completion
                    date.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOverdueMilestones}
                  onChange={(e) => setNotifyOverdueMilestones(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-slate-200/90 rounded-md hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">
                    Critical Risk Escalations (Score &ge; 16/25)
                  </div>
                  <div className="text-slate-500">
                    Flag unresolved risks with Probability &times; Impact score of 16 or higher.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCriticalRisks}
                  onChange={(e) => setNotifyCriticalRisks(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-slate-200/90 rounded-md hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">
                    Budget Overrun Warnings (&gt; 100% Utilization)
                  </div>
                  <div className="text-slate-500">
                    Alert PMO leadership when actual expenditure exceeds approved allocation.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBudgetOverruns}
                  onChange={(e) => setNotifyBudgetOverruns(e.target.checked)}
                  className="accent-[#D04A02] w-4 h-4"
                />
              </label>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="fin-card p-6 space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                Database Persistence, Export &amp; Demo Reset
              </h2>
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="font-bold text-slate-900">
                  Storage Engine Status:{' '}
                  <span className="font-mono text-emerald-700">
                    {state.storageMode === 'sqlite-server'
                      ? 'SQLite Relational Server (projectpulse.db)'
                      : 'Resilient Browser LocalStorage'}
                  </span>
                </div>
                <p className="text-slate-600">
                  Contains {state.projects.length} Projects, {state.milestones.length} Milestones,{' '}
                  {(state.tasks || []).length} Tasks, {state.risks.length} Risks, and{' '}
                  {(state.issues || []).length} Issues.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportFullJSON}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 shadow-2xs font-semibold text-slate-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full Workspace JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPortfolioCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 shadow-2xs font-semibold text-slate-800 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Portfolio CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Synthetic Demo Dataset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
