import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { DashboardKPIs, PortfolioState, Project } from '../types/portfolio';
import { formatCurrency, isMilestoneOverdue } from '../utils/calculations';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  citedProjectCodes?: string[];
}

interface AIChatbotWidgetProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  state: PortfolioState;
  kpis: DashboardKPIs;
  onInspectProjectByCode: (code: string) => void;
  onQuickCompleteOverdueMilestone: () => void;
}

const SUGGESTED_PROMPTS = [
  'Which PwC engagements are Delayed or Red?',
  "Show Ananya Iyer's PRJ-102 budget & milestones",
  'List Critical unresolved risks (Score >= 16)',
  "Check Rohan Deshmukh's SAP & GST project PRJ-105",
];

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({
  isOpen,
  onToggleOpen,
  state,
  kpis,
  onInspectProjectByCode,
  onQuickCompleteOverdueMilestone,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `Namaste! I am your **PwC India ProjectPulse AI Copilot**. I have live read/write visibility across all **${state.projects.length} strategic advisory engagements** (${formatCurrency(
        state.projects.reduce((s, p) => s + p.allocatedBudget, 0)
      )} allocated).\n\nAsk me about delayed engagements, **Ananya Iyer's** Core Banking cutover (**PRJ-102**), **Rohan Deshmukh's** GST e-Invoicing engine (**PRJ-105**), budget variances, or critical risks.`,
      timestamp: 'Live Telemetry',
      citedProjectCodes: ['PRJ-102', 'PRJ-105', 'PRJ-106'],
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const buildLocalFallbackAnswer = (query: string): { reply: string; citedProjectCodes: string[] } => {
    const q = query.toLowerCase();
    if (q.includes('delay') || q.includes('red') || q.includes('overrun') || q.includes('attention')) {
      const attention = state.projects.filter((p) => kpis.projectMetricsMap[p.id]?.requiresAttention);
      const lines = attention.map((p) => {
        const m = kpis.projectMetricsMap[p.id];
        return `• ${p.code} (${p.name}) — Lead: ${p.owner} (${p.department}) | Status: ${p.status} (${m.health} Health) | Variance: ${formatCurrency(m.variance, true)} (${m.utilizationPercent}% utilized)`;
      });
      return {
        reply: `Currently ${attention.length} PwC India engagements require immediate Partner attention:\n\n${lines.join('\n')}`,
        citedProjectCodes: attention.map((p) => p.code),
      };
    }

    if (q.includes('risk') || q.includes('critical')) {
      const topRisks = state.risks.filter((r) => r.status !== 'Resolved').slice(0, 4);
      const projMap = new Map<string, Project>(state.projects.map((p) => [p.id, p]));
      const cited: string[] = [];
      const lines = topRisks.map((r) => {
        const p = projMap.get(r.projectId);
        if (p) cited.push(p.code);
        return `• ${r.code} (${p?.code || ''}, Owner: ${r.owner}) — Score ${r.riskScore}/25: ${r.description} (Mitigation: ${r.mitigationProgress}%)`;
      });
      return {
        reply: `Top unresolved portfolio risks (${kpis.criticalUnresolvedRisks} Critical):\n\n${lines.join('\n')}`,
        citedProjectCodes: Array.from(new Set(cited)),
      };
    }

    const matchedProject = state.projects.find(
      (p) =>
        q.includes(p.code.toLowerCase()) ||
        q.includes(p.owner.toLowerCase().split(' ')[0]) ||
        q.includes(p.owner.toLowerCase().split(' ')[1] || '___')
    );
    if (matchedProject) {
      const m = kpis.projectMetricsMap[matchedProject.id];
      const overdueMs = state.milestones.filter(
        (ms) => ms.projectId === matchedProject.id && isMilestoneOverdue(ms, state.referenceDate)
      );
      return {
        reply: `${matchedProject.code} · ${matchedProject.name}\n• Engagement Partner/Lead: ${matchedProject.owner} (${matchedProject.ownerRole})\n• Health & Progress: ${m.health} Health · ${matchedProject.status} (${matchedProject.progress}% complete)\n• Financials: ${formatCurrency(matchedProject.actualSpend)} actual vs ${formatCurrency(matchedProject.allocatedBudget)} allocated (${formatCurrency(m.variance, true)} variance, ${m.utilizationPercent}% utilization)\n• Overdue Milestones: ${overdueMs.length > 0 ? overdueMs.map((ms) => `${ms.code} (${ms.title})`).join(', ') : 'None'}`,
        citedProjectCodes: [matchedProject.code],
      };
    }

    return {
      reply: `PwC India Portfolio Snapshot (${state.referenceDate}): ${kpis.totalProjects} engagements (${kpis.healthDistribution.Green} Green, ${kpis.healthDistribution.Amber} Amber, ${kpis.healthDistribution.Red} Red). Total Allocated: ${formatCurrency(kpis.totalAllocatedBudget)} | Actual Spend: ${formatCurrency(kpis.totalActualSpend)} (${kpis.budgetUtilizationPercent}% utilization). Overdue Milestones: ${kpis.overdueMilestones}.`,
      citedProjectCodes: ['PRJ-102', 'PRJ-105'],
    };
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText ?? inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          state,
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.reply || buildLocalFallbackAnswer(textToSend).reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedProjectCodes: data.citedProjectCodes || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallback = buildLocalFallbackAnswer(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: fallback.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citedProjectCodes: fallback.citedProjectCodes,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button when Closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white shadow-lg border border-slate-700 transition-transform active:scale-95 cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-[#D04A02] flex items-center justify-center text-white shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold font-display leading-none">
              PwC PMO AI Copilot
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-0.5">
              Ask Live Portfolio & Risk Data
            </div>
          </div>
        </button>
      )}

      {/* Expanded Interactive Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[430px] h-[580px] max-h-[82vh] bg-white border border-slate-300 rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#D04A02] flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-display">
                  PwC ProjectPulse AI Copilot
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  Grounded in {kpis.totalProjects} Engagements · {kpis.overdueMilestones} Overdue
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      role: 'assistant',
                      text: `Chat history cleared. Ask me about any of our ${kpis.totalProjects} PwC India engagements, budget variances, or critical risks.`,
                      timestamp: 'Just now',
                      citedProjectCodes: ['PRJ-102', 'PRJ-105'],
                    },
                  ])
                }
                title="Clear Chat"
                className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggleOpen}
                aria-label="Close AI Copilot"
                className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'assistant'
                      ? 'bg-[#D04A02] text-white'
                      : 'bg-[#1E3A8A] text-white'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded p-3 text-xs space-y-2 ${
                    msg.role === 'assistant'
                      ? 'bg-white border border-slate-200 text-slate-800'
                      : 'bg-[#1E3A8A] text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text.replace(/\*\*/g, '')}
                  </div>

                  {/* Interactive Project Citations inside Assistant Reply */}
                  {msg.role === 'assistant' &&
                    msg.citedProjectCodes &&
                    msg.citedProjectCodes.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          Inspect Record:
                        </span>
                        {msg.citedProjectCodes.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => onInspectProjectByCode(code)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-[#1E3A8A] rounded cursor-pointer"
                          >
                            <span>{code}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}

                  <div
                    className={`text-[10px] font-mono ${
                      msg.role === 'assistant' ? 'text-slate-400' : 'text-blue-200'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D04A02]" />
                <span>Querying live PwC portfolio telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts & One-Click Live Action Strip */}
          <div className="px-3 py-2 bg-white border-t border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Quick Advisory Queries</span>
              {kpis.overdueMilestones > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickCompleteOverdueMilestone();
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `act-${Date.now()}`,
                        role: 'assistant',
                        text: `Executed live intervention: Marked overdue milestone MS-102-2 (Mainframe Dual-Write Cutover) as 100% Completed and advanced RSK-102-A mitigation to 85%. Dashboard KPIs have been recalculated.`,
                        timestamp: 'Live Action',
                        citedProjectCodes: ['PRJ-102'],
                      },
                    ]);
                  }}
                  className="text-[#D04A02] hover:underline font-semibold cursor-pointer"
                >
                  ⚡ Resolve MS-102-2 Overdue
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about Ananya Iyer, PRJ-102, GST risks, budget..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1E3A8A]"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className="px-3 py-2 bg-[#D04A02] hover:bg-[#b53f02] disabled:opacity-40 text-white rounded transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
