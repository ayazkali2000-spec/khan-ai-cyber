import { useEffect, useState } from 'react';
import { Download, Menu, RotateCcw } from 'lucide-react';
import { AssistantView } from './components/AssistantView';
import { ComplaintDrafterView } from './components/ComplaintDrafterView';
import { EvidenceVaultView } from './components/EvidenceVaultView';
import { SecurityChecklistView } from './components/SecurityChecklistView';
import { Sidebar } from './components/Sidebar';
import { createInitialCaseState, UI_COPY } from './data/presets';
import type {
  CaseWorkspaceState,
  ChatMessage,
  EvidenceArtifact,
  GeneratedComplaint,
  IncidentProfile,
  Language,
  TimelineEvent,
  WorkspaceTab,
} from './types/case';
import { buildCaseDossierText, downloadTextFile } from './utils/dossierExport';

const STORAGE_KEY = 'khan_ai_workbench_case_v1';
const LANG_STORAGE_KEY = 'khan_ai_workbench_lang_v1';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('assistant');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [caseState, setCaseState] = useState<CaseWorkspaceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CaseWorkspaceState;
        if (parsed && parsed.incident && Array.isArray(parsed.messages)) {
          return parsed;
        }
      }
    } catch {
      // Ignore invalid localStorage payload
    }
    return createInitialCaseState(language);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(caseState));
    } catch {
      // Ignore storage quota errors
    }
  }, [caseState]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const copy = UI_COPY[language];
  const isUrdu = language === 'ur';

  const handleToggleSecurityCheck = (itemId: string) => {
    setCaseState((prev) => {
      const currentlyDone = Boolean(prev.securityChecks[itemId]?.completed);
      return {
        ...prev,
        securityChecks: {
          ...prev.securityChecks,
          [itemId]: {
            completed: !currentlyDone,
            completedAt: !currentlyDone
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
          },
        },
      };
    });
  };

  const handleResetSecurityChecks = () => {
    setCaseState((prev) => ({
      ...prev,
      securityChecks: {},
    }));
  };

  const handleUpdateMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setCaseState((prev) => ({
      ...prev,
      messages: updater(prev.messages),
    }));
  };

  const handleClearMessages = () => {
    const fresh = createInitialCaseState(language);
    setCaseState((prev) => ({
      ...prev,
      messages: fresh.messages,
    }));
  };

  const handleSaveToTimeline = (title: string, details: string) => {
    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16),
      title,
      details,
    };
    setCaseState((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newEvent],
    }));
  };

  const handleUpdateIncident = (patch: Partial<IncidentProfile>) => {
    setCaseState((prev) => ({
      ...prev,
      incident: {
        ...prev.incident,
        ...patch,
      },
    }));
  };

  const handleAddTimeline = (event: Omit<TimelineEvent, 'id'>) => {
    setCaseState((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { ...event, id: `tl-${Date.now()}` }],
    }));
  };

  const handleDeleteTimeline = (id: string) => {
    setCaseState((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((item) => item.id !== id),
    }));
  };

  const handleAddEvidence = (artifact: Omit<EvidenceArtifact, 'id'>) => {
    setCaseState((prev) => ({
      ...prev,
      evidence: [...prev.evidence, { ...artifact, id: `ev-${Date.now()}` }],
    }));
  };

  const handleToggleEvidencePreserved = (id: string) => {
    setCaseState((prev) => ({
      ...prev,
      evidence: prev.evidence.map((item) =>
        item.id === id ? { ...item, preservedOriginal: !item.preservedOriginal } : item,
      ),
    }));
  };

  const handleDeleteEvidence = (id: string) => {
    setCaseState((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((item) => item.id !== id),
    }));
  };

  const handleSaveComplaint = (complaint: GeneratedComplaint) => {
    setCaseState((prev) => ({
      ...prev,
      lastComplaint: complaint,
    }));
  };

  const handleStartNewCase = () => {
    setCaseState(createInitialCaseState(language));
    setConfirmReset(false);
    setActiveTab('assistant');
  };

  const activeSectionTitle = copy.nav[activeTab];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        caseState={caseState}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm no-print">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="font-display font-semibold text-slate-900 whitespace-nowrap">
                  {copy.brand}
                </span>
                <span className="text-slate-300" aria-hidden="true">/</span>
                <span
                  className={`truncate font-medium text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                >
                  {activeSectionTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div
                className="flex items-center rounded-lg bg-slate-100 p-1"
                role="group"
                aria-label="Language switch"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium font-urdu transition-colors whitespace-nowrap shrink-0 ${
                    language === 'ur'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  اردو
                </button>
              </div>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="hidden sm:inline-flex h-[38px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{copy.topBar.newCase}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleStartNewCase}
                    className="h-[38px] rounded-md bg-red-700 px-3 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap shrink-0"
                  >
                    {isUrdu ? 'تصدیق: نیا کیس' : 'Confirm Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="h-[38px] rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    {isUrdu ? 'منسوخ' : 'Cancel'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${caseState.incident.caseId}-dossier.txt`,
                    buildCaseDossierText(caseState),
                  )
                }
                className="inline-flex h-[38px] items-center gap-1.5 rounded-md bg-teal-700 px-3.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{copy.topBar.exportDossier}</span>
                <span className="md:hidden">{isUrdu ? 'ڈاؤن لوڈ' : 'Export'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          {activeTab === 'assistant' && (
            <AssistantView
              language={language}
              caseState={caseState}
              onUpdateMessages={handleUpdateMessages}
              onClearMessages={handleClearMessages}
              onSaveToTimeline={handleSaveToTimeline}
              onOpenVault={() => setActiveTab('evidence')}
            />
          )}

          {activeTab === 'security' && (
            <SecurityChecklistView
              language={language}
              securityChecks={caseState.securityChecks}
              onToggleCheck={handleToggleSecurityCheck}
              onResetChecks={handleResetSecurityChecks}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceVaultView
              language={language}
              caseState={caseState}
              onUpdateIncident={handleUpdateIncident}
              onAddTimeline={handleAddTimeline}
              onDeleteTimeline={handleDeleteTimeline}
              onAddEvidence={handleAddEvidence}
              onToggleEvidencePreserved={handleToggleEvidencePreserved}
              onDeleteEvidence={handleDeleteEvidence}
              onProceedToComplaint={() => setActiveTab('complaint')}
            />
          )}

          {activeTab === 'complaint' && (
            <ComplaintDrafterView
              language={language}
              caseState={caseState}
              onSaveComplaint={handleSaveComplaint}
              onOpenVault={() => setActiveTab('evidence')}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 no-print">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-slate-700 font-urdu" dir="auto">
              KHAN AI · {copy.developedBy}
            </span>
            <span className={isUrdu ? 'font-urdu' : ''} dir={isUrdu ? 'rtl' : 'ltr'}>
              {isUrdu
                ? 'دفاعی سائبر سیکیورٹی، شواہد کی حفاظت اور سرکاری شکایت کی تیاری کا معاون نظام'
                : 'Defensive cybersecurity guidance, evidence integrity, and official complaint preparation.'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
