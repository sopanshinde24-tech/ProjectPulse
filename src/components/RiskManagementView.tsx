import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  DashboardKPIs,
  PortfolioState,
  RiskCategory,
  RiskItem,
  RiskStatus,
} from '../types/portfolio';
import { calculateRiskScore, getRiskSeverity } from '../utils/calculations';
import { downloadTextFile, generateRisksCSV } from '../utils/csvExport';

interface RiskManagementViewProps {
  state: PortfolioState;
  kpis: DashboardKPIs;
  guidedStepNumber: number | null;
  onAddRisk: (risk: RiskItem) => void;
  onUpdateRisk: (
    riskId: string,
    mitigationProgress: number,
    status: RiskStatus,
    probability?: number,
    impact?: number
  ) => void;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  state,
  kpis,
  guidedStepNumber,
  onAddRisk,
  onUpdateRisk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Unresolved');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRiskProjectId, setNewRiskProjectId] = useState(state.projects[0]?.id || 'prj-102');
  const [newRiskCategory, setNewRiskCategory] = useState<RiskCategory>('Technical');
  const [newRiskProb, setNewRiskProb] = useState(4);
  const [newRiskImpact, setNewRiskImpact] = useState(4);
  const [newRiskOwner, setNewRiskOwner] = useState('Ananya Iyer');
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newRiskMitigation, setNewRiskMitigation] = useState('');

  const projectMap = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p])),
    [state.projects]
  );

  const filteredRisks = useMemo(() => {
    return state.risks
      .filter((r) => {
        const score = calculateRiskScore(r.probability, r.impact);
        const severity = getRiskSeverity(score);
        const proj = projectMap.get(r.projectId);
        const q = searchQuery.trim().toLowerCase();

        if (
          q &&
          !r.code.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.owner.toLowerCase().includes(q) &&
          !r.mitigationPlan.toLowerCase().includes(q) &&
          !(proj?.code.toLowerCase().includes(q) || proj?.name.toLowerCase().includes(q))
        ) {
          return false;
        }

        if (statusFilter === 'Unresolved' && r.status === 'Resolved') return false;
        if (statusFilter === 'Open' && r.status !== 'Open') return false;
        if (statusFilter === 'Mitigating' && r.status !== 'Mitigating') return false;
        if (statusFilter === 'Resolved' && r.status !== 'Resolved') return false;

        if (severityFilter === 'CriticalAndHigh' && score < 12) return false;
        if (severityFilter === 'Critical' && severity !== 'Critical') return false;
        if (severityFilter === 'High' && severity !== 'High') return false;
        if (severityFilter === 'Medium' && severity !== 'Medium') return false;
        if (severityFilter === 'Low' && severity !== 'Low') return false;

        if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;

        return true;
      })
      .sort(
        (a, b) =>
          calculateRiskScore(b.probability, b.impact) -
          calculateRiskScore(a.probability, a.impact)
      );
  }, [
    state.risks,
    projectMap,
    searchQuery,
    statusFilter,
    severityFilter,
    categoryFilter,
  ]);

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskDesc.trim()) return;
    const proj = projectMap.get(newRiskProjectId);
    const code = `${proj ? proj.code.replace('PRJ-', 'RSK-') : 'RSK-NEW'}-${
      state.risks.length + 1
    }`;
    const score = calculateRiskScore(newRiskProb, newRiskImpact);

    const risk: RiskItem = {
      id: `rsk-${Date.now()}`,
      projectId: newRiskProjectId,
      code,
      description: newRiskDesc.trim(),
      category: newRiskCategory,
      probability: newRiskProb,
      impact: newRiskImpact,
      riskScore: score,
      owner: newRiskOwner.trim() || proj?.owner || 'PMO Risk Lead',
      mitigationPlan:
        newRiskMitigation.trim() ||
        'Establish weekly technical steering checkpoint and contingency reserve.',
      mitigationProgress: 15,
      status: 'Open',
      isSynthetic: true,
      updatedAt: new Date().toISOString(),
    };

    onAddRisk(risk);
    setNewRiskDesc('');
    setNewRiskMitigation('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-mono text-slate-500">
            04 · Quantitative Risk Register & Mitigation Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Portfolio Risk Register & Probability × Impact Matrix
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `projectpulse_risk_register_${state.referenceDate}.csv`,
                generateRisksCSV(state.risks, state.projects)
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Risks CSV
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Log New Risk
          </button>
        </div>
      </div>

      {/* Top Row: Risk KPIs & 5x5 Probability x Impact Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Risk Summary Metrics (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
            <div className="text-xs text-slate-500">Unresolved Portfolio Risks</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {kpis.unresolvedRisks}{' '}
              <span className="text-xs font-normal text-slate-500">of {kpis.totalRisks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active across {state.projects.length} initiatives
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
            <div className="text-xs text-slate-500">Critical Unresolved (Score &ge; 16)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#DC2626] mt-2">
              {kpis.criticalUnresolvedRisks}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Requires immediate steering review
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
            <div className="text-xs text-slate-500">High Unresolved (Score 12–15)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#D97706] mt-2">
              {kpis.highUnresolvedRisks}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active mitigation plans in progress
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
            <div className="text-xs text-slate-500">Average Active Risk Score</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {kpis.averageRiskScore}{' '}
              <span className="text-xs font-normal text-slate-500">/ 25</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Formula: Probability (1–5) × Impact (1–5)
            </div>
          </div>
        </div>

        {/* Right: 5x5 Probability x Impact Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Quantitative 5×5 Probability × Impact Matrix (Unresolved Risks)
              </h2>
              <p className="text-xs text-slate-500">
                Score = Probability × Impact · Critical (&ge;16), High (12–15), Medium (6–10), Low (1–5)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-mono">
            <div className="flex items-center justify-center text-[10px] text-slate-500 font-sans">
              Prob \ Impact
            </div>
            {[1, 2, 3, 4, 5].map((imp) => (
              <div key={imp} className="py-1 text-[11px] font-semibold text-slate-600 bg-slate-50 rounded">
                Impact {imp}
              </div>
            ))}

            {[5, 4, 3, 2, 1].map((prob) => (
              <React.Fragment key={prob}>
                <div className="py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 rounded flex items-center justify-center">
                  Prob {prob}
                </div>
                {[1, 2, 3, 4, 5].map((imp) => {
                  const cellScore = prob * imp;
                  const matchingRisks = state.risks.filter(
                    (r) =>
                      r.status !== 'Resolved' &&
                      r.probability === prob &&
                      r.impact === imp
                  );
                  const cellBg =
                    cellScore >= 16
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : cellScore >= 12
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : cellScore >= 6
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-emerald-50/50 border-emerald-200/70 text-[#16A34A]';

                  return (
                    <div
                      key={`${prob}-${imp}`}
                      title={
                        matchingRisks.length > 0
                          ? `Score ${cellScore}: ${matchingRisks.map((r) => r.code).join(', ')}`
                          : `Score ${cellScore}: 0 unresolved risks`
                      }
                      className={`py-1.5 px-1 border rounded flex flex-col items-center justify-center ${cellBg}`}
                    >
                      <span className="text-[10px] opacity-75">{cellScore}</span>
                      <span className="text-xs font-bold">
                        {matchingRisks.length > 0 ? `${matchingRisks.length} risk` : '—'}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risk code, description, owner..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <select
            aria-label="Filter by Severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="All">All Severity Tiers</option>
            <option value="CriticalAndHigh">Critical & High Only (Score &ge; 12)</option>
            <option value="Critical">Critical Only (Score &ge; 16)</option>
            <option value="High">High Only (Score 12–15)</option>
            <option value="Medium">Medium Only (Score 6–10)</option>
            <option value="Low">Low Only (Score 1–5)</option>
          </select>

          <select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
          >
            <option value="All">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Schedule">Schedule</option>
            <option value="Budget">Budget</option>
            <option value="Compliance">Compliance</option>
            <option value="Vendor">Vendor</option>
            <option value="Resource">Resource</option>
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded">
          {(['Unresolved', 'All', 'Open', 'Mitigating', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'Unresolved' ? `Unresolved (${kpis.unresolvedRisks})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-3 px-4">Risk & Project</th>
                <th className="py-3 px-3">Risk Description & Mitigation Plan</th>
                <th className="py-3 px-3 text-right">Prob × Impact</th>
                <th className="py-3 px-3 text-right">Score & Tier</th>
                <th className="py-3 px-3">Mitigation Progress</th>
                <th className="py-3 px-4 text-right">Status Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredRisks.map((risk) => {
                const proj = projectMap.get(risk.projectId);
                const score = calculateRiskScore(risk.probability, risk.impact);
                const severity = getRiskSeverity(score);
                const isDemoFocus =
                  guidedStepNumber === 6 && risk.code === 'RSK-102-A';

                const severityColor =
                  severity === 'Critical'
                    ? 'text-[#DC2626]'
                    : severity === 'High'
                    ? 'text-[#D97706]'
                    : severity === 'Medium'
                    ? 'text-slate-800'
                    : 'text-[#16A34A]';

                return (
                  <tr
                    key={risk.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isDemoFocus ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-600' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{risk.code}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {proj?.code} · {risk.category}
                      </div>
                      <div className="text-slate-600 mt-0.5">Owner: {risk.owner}</div>
                    </td>

                    <td className="py-3.5 px-3 max-w-md">
                      <div className="font-semibold text-slate-900">{risk.description}</div>
                      <div className="text-slate-600 mt-1">
                        <span className="font-semibold text-slate-700">Mitigation: </span>
                        {risk.mitigationPlan}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      P:{risk.probability} × I:{risk.impact}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className={`text-sm font-bold ${severityColor}`}>
                        {score} / 25
                      </div>
                      <div className={`text-[11px] font-semibold ${severityColor}`}>
                        {severity}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 min-w-[170px]">
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="text-slate-600">Mitigation</span>
                        <span className="font-bold text-slate-900">
                          {risk.mitigationProgress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        aria-label={`Mitigation progress for ${risk.code}`}
                        value={risk.mitigationProgress}
                        onChange={(e) => {
                          const nextVal = Number(e.target.value);
                          const nextStatus: RiskStatus =
                            nextVal === 100
                              ? 'Resolved'
                              : nextVal > 0
                              ? 'Mitigating'
                              : 'Open';
                          onUpdateRisk(risk.id, nextVal, nextStatus);
                        }}
                        className="w-full accent-[#1E3A8A] cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <select
                        aria-label={`Status for ${risk.code}`}
                        value={risk.status}
                        onChange={(e) => {
                          const nextSt = e.target.value as RiskStatus;
                          const nextProg =
                            nextSt === 'Resolved' ? 100 : risk.mitigationProgress;
                          onUpdateRisk(risk.id, nextProg, nextSt);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="Open">Open</option>
                        <option value="Mitigating">Mitigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Risk Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Log New Portfolio Risk
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={newRiskProjectId}
                    onChange={(e) => setNewRiskProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Risk Category
                  </label>
                  <select
                    value={newRiskCategory}
                    onChange={(e) => setNewRiskCategory(e.target.value as RiskCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Budget">Budget</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Resource">Resource</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Probability (1–5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newRiskProb}
                    onChange={(e) => setNewRiskProb(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Impact (1–5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newRiskImpact}
                    onChange={(e) => setNewRiskImpact(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Calculated Score</div>
                  <div className="text-base font-bold text-slate-900">
                    {calculateRiskScore(newRiskProb, newRiskImpact)} / 25 (
                    {getRiskSeverity(calculateRiskScore(newRiskProb, newRiskImpact))})
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Owner
                </label>
                <input
                  type="text"
                  value={newRiskOwner}
                  onChange={(e) => setNewRiskOwner(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Description
                </label>
                <textarea
                  rows={2}
                  value={newRiskDesc}
                  onChange={(e) => setNewRiskDesc(e.target.value)}
                  placeholder="Describe the risk event, root cause, and impact..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mitigation Action Plan
                </label>
                <textarea
                  rows={2}
                  value={newRiskMitigation}
                  onChange={(e) => setNewRiskMitigation(e.target.value)}
                  placeholder="Concrete steps to reduce probability or impact..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  Save to Risk Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
