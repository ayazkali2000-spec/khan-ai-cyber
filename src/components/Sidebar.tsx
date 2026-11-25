import {
  FileText,
  FolderLock,
  MessageSquareWarning,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SECURITY_CHECKLIST_ITEMS, UI_COPY } from '../data/presets';
import type { CaseWorkspaceState, Language, WorkspaceTab } from '../types/case';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  language: Language;
  caseState: CaseWorkspaceState;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  language,
  caseState,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const copy = UI_COPY[language];
  const isUrdu = language === 'ur';

  const completedSteps = SECURITY_CHECKLIST_ITEMS.filter(
    (item) => caseState.securityChecks[item.id]?.completed,
  ).length;

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof MessageSquareWarning;
    count?: string;
  }> = [
    {
      id: 'assistant',
      label: copy.nav.assistant,
      icon: MessageSquareWarning,
    },
    {
      id: 'security',
      label: copy.nav.security,
      icon: ShieldCheck,
      count: `${completedSteps}/${SECURITY_CHECKLIST_ITEMS.length}`,
    },
    {
      id: 'evidence',
      label: copy.nav.evidence,
      icon: FolderLock,
      count: String(caseState.evidence.length + caseState.timeline.length),
    },
    {
      id: 'complaint',
      label: copy.nav.complaint,
      icon: FileText,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
                {copy.brand}
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                {isUrdu ? 'سائبر دفاع اور شواہد' : 'Cyber Defense Workbench'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1" aria-label="Workspace modules">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                dir={isUrdu ? 'rtl' : 'ltr'}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className={`truncate ${isUrdu ? 'font-urdu text-[13px]' : ''}`}>
                    {item.label}
                  </span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`font-mono-tabular text-xs shrink-0 ${
                      isActive ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mx-3 mt-4 border-t border-slate-800 pt-4 px-2">
          <div className="text-xs font-medium text-slate-400 mb-2">
            {isUrdu ? 'فعال کیس کا خلاصہ' : 'Active Case Summary'}
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">{copy.caseBanner.caseRef}</dt>
              <dd className="font-mono-tabular text-slate-200 truncate">
                {caseState.incident.caseId}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">{copy.caseBanner.checklistProgress}</dt>
              <dd className="font-mono-tabular text-slate-200">
                {completedSteps} / {SECURITY_CHECKLIST_ITEMS.length}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">{copy.caseBanner.evidenceCount}</dt>
              <dd className="font-mono-tabular text-slate-200">
                {caseState.evidence.length}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-400">{copy.caseBanner.timelineCount}</dt>
              <dd className="font-mono-tabular text-slate-200">
                {caseState.timeline.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="text-xs text-slate-300 font-medium font-urdu" dir="auto">
          {copy.developedBy}
        </div>
        <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          {isUrdu
            ? 'صرف دفاعی تحفظ، شواہد کی حفاظت اور قانونی شکایت کے لیے'
            : 'Defensive security, evidence preservation & lawful reporting only.'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-[270px] lg:shrink-0 border-r border-slate-200 bg-slate-900">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
