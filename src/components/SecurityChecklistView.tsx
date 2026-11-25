import { useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  Lock,
  PhoneCall,
  ShieldCheck,
  Square,
} from 'lucide-react';
import { OFFICIAL_CHANNELS, SECURITY_CHECKLIST_ITEMS } from '../data/presets';
import type { Language, SecurityCheckState } from '../types/case';

interface SecurityChecklistViewProps {
  language: Language;
  securityChecks: SecurityCheckState;
  onToggleCheck: (itemId: string) => void;
  onResetChecks: () => void;
}

export function SecurityChecklistView({
  language,
  securityChecks,
  onToggleCheck,
  onResetChecks,
}: SecurityChecklistViewProps) {
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'immediate' | 'whatsapp' | 'financial'>('all');
  const isUrdu = language === 'ur';

  const completedCount = SECURITY_CHECKLIST_ITEMS.filter(
    (item) => securityChecks[item.id]?.completed,
  ).length;
  const totalCount = SECURITY_CHECKLIST_ITEMS.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  const visibleItems =
    phaseFilter === 'all'
      ? SECURITY_CHECKLIST_ITEMS
      : SECURITY_CHECKLIST_ITEMS.filter((item) => item.phase === phaseFilter);

  const phaseLabels = {
    all: isUrdu ? 'تمام اقدامات' : 'All Steps',
    immediate: isUrdu ? 'فوری 15 منٹ' : 'First 15 Min',
    whatsapp: isUrdu ? 'واٹس ایپ اور سم' : 'WhatsApp & SIM',
    financial: isUrdu ? 'بینک اور اسٹیٹمنٹ' : 'Bank & Records',
  };

  const priorityLabel = (priority: 'critical' | 'high' | 'standard') => {
    if (priority === 'critical') {
      return isUrdu ? 'انتہائی فوری' : 'Critical Priority';
    }
    if (priority === 'high') {
      return isUrdu ? 'فوری اقدام' : 'High Priority';
    }
    return isUrdu ? 'ضروری ریکارڈ' : 'Standard Record';
  };

  return (
    <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-xl font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'اکاؤنٹ تحفظ اور فوری کنٹینمنٹ چیک لسٹ'
                : 'Account Containment & Hardening Checklist'}
            </h2>
            <p className={`mt-1 text-sm text-slate-600 max-w-2xl ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'مالی نقصان روکنے کے لیے ان دفاعی اقدامات کو ترتیب سے مکمل کریں۔ کوئی بھی ریکارڈ ڈیلیٹ کیے بغیر اکاؤنٹس محفوظ بنائیں۔'
                : 'Complete these defensive actions in order to stop further financial loss, secure WhatsApp and SIM ownership, and lock down banking access without deleting original evidence.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right" dir="ltr">
              <div className="font-mono-tabular text-2xl font-semibold text-slate-900">
                {completedCount}/{totalCount}
              </div>
              <div className="font-mono-tabular text-xs text-slate-500">
                {completionPct}% {isUrdu ? 'مکمل' : 'Completed'}
              </div>
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={onResetChecks}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 min-h-[40px]"
              >
                {isUrdu ? 'ری سیٹ' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div
            className="h-full bg-teal-700 transition-transform duration-200 origin-left"
            style={{ transform: `scaleX(${completedCount / totalCount})`, width: '100%' }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
          {(['all', 'immediate', 'whatsapp', 'financial'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPhaseFilter(key)}
              className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                phaseFilter === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              } ${isUrdu ? 'font-urdu' : ''}`}
            >
              {phaseLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-200">
        {visibleItems.map((item, idx) => {
          const entry = securityChecks[item.id];
          const isDone = Boolean(entry?.completed);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-5 transition-colors ${
                isDone ? 'bg-slate-50/70' : 'bg-white hover:bg-slate-50/40'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleCheck(item.id)}
                aria-pressed={isDone}
                aria-label={item.title[language]}
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                {isDone ? (
                  <CheckSquare className="h-5 w-5 text-teal-700" />
                ) : (
                  <Square className="h-5 w-5 text-slate-400" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono-tabular font-medium text-slate-700">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span
                    className={`font-medium flex items-center gap-1 ${
                      item.priority === 'critical'
                        ? 'text-red-700'
                        : item.priority === 'high'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                    }`}
                  >
                    {item.priority === 'critical' ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    {priorityLabel(item.priority)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{phaseLabels[item.phase]}</span>
                  {isDone && entry?.completedAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium font-mono-tabular">
                        {isUrdu ? 'مکمل' : 'Done'} {entry.completedAt}
                      </span>
                    </>
                  )}
                </div>

                <h3
                  className={`mt-1 text-base font-semibold ${
                    isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                  } ${isUrdu ? 'font-urdu' : ''}`}
                >
                  {item.title[language]}
                </h3>
                <p className={`mt-1.5 text-sm text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                  {item.steps[language]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <PhoneCall className="h-5 w-5 text-teal-700 shrink-0" aria-hidden="true" />
          <h3 className={`text-lg font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu
              ? 'مستند سرکاری اور مالیاتی شکایت مراکز'
              : 'Official Reporting & Escalation Channels'}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {OFFICIAL_CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between gap-2"
            >
              <div>
                <div className={`text-sm font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                  {channel.name[language]}
                </div>
                <p className={`mt-1 text-xs text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                  {channel.purpose[language]}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs font-mono-tabular text-teal-800" dir="ltr">
                <span className="truncate">{channel.contact}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span className={isUrdu ? 'font-urdu' : ''}>
            {isUrdu
              ? 'صرف آفیشل ایپس اور بینک کارڈ کے پیچھے درج نمبر پر رابطہ کریں۔ گوگل سرچ پر نظر آنے والے مشکوک کسٹمر کیئر نمبروں سے ہوشیار رہیں۔'
              : 'Always verify helpline numbers directly from the back of your bank card, official banking app, or verified .gov.pk portals—never trust unverified search-ad phone numbers.'}
          </span>
        </div>
      </div>
    </div>
  );
}
