import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  CheckSquare,
  Download,
  FileText,
  Plus,
  Printer,
  ShieldAlert,
  Square,
  Trash2,
} from 'lucide-react';
import type {
  CaseWorkspaceState,
  EvidenceArtifact,
  IncidentProfile,
  Language,
  TimelineEvent,
} from '../types/case';
import { buildCaseDossierText, downloadTextFile } from '../utils/dossierExport';

interface EvidenceVaultViewProps {
  language: Language;
  caseState: CaseWorkspaceState;
  onUpdateIncident: (patch: Partial<IncidentProfile>) => void;
  onAddTimeline: (event: Omit<TimelineEvent, 'id'>) => void;
  onDeleteTimeline: (id: string) => void;
  onAddEvidence: (artifact: Omit<EvidenceArtifact, 'id'>) => void;
  onToggleEvidencePreserved: (id: string) => void;
  onDeleteEvidence: (id: string) => void;
  onProceedToComplaint: () => void;
}

export function EvidenceVaultView({
  language,
  caseState,
  onUpdateIncident,
  onAddTimeline,
  onDeleteTimeline,
  onAddEvidence,
  onToggleEvidencePreserved,
  onDeleteEvidence,
  onProceedToComplaint,
}: EvidenceVaultViewProps) {
  const isUrdu = language === 'ur';

  const [evTimestamp, setEvTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [evTitle, setEvTitle] = useState('');
  const [evDetails, setEvDetails] = useState('');

  const [artType, setArtType] = useState<EvidenceArtifact['type']>('transaction_id');
  const [artRef, setArtRef] = useState('');
  const [artDesc, setArtDesc] = useState('');
  const [artCapturedAt, setArtCapturedAt] = useState(() => new Date().toISOString().slice(0, 16));

  const { incident, timeline, evidence } = caseState;

  const handleAddTimelineSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    onAddTimeline({
      timestamp: evTimestamp || new Date().toISOString().slice(0, 16),
      title: evTitle.trim(),
      details: evDetails.trim(),
    });
    setEvTitle('');
    setEvDetails('');
  };

  const handleAddEvidenceSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!artDesc.trim() && !artRef.trim()) return;
    onAddEvidence({
      type: artType,
      referenceCode: artRef.trim(),
      description: artDesc.trim() || artRef.trim(),
      capturedAt: artCapturedAt || new Date().toISOString().slice(0, 16),
      preservedOriginal: true,
    });
    setArtRef('');
    setArtDesc('');
  };

  const artifactTypeLabel = (type: EvidenceArtifact['type']) => {
    const map: Record<EvidenceArtifact['type'], { en: string; ur: string }> = {
      chat_export: { en: 'WhatsApp Chat Export (.txt)', ur: 'واٹس ایپ چیٹ ایکسپورٹ (.txt)' },
      screenshot: { en: 'Uncropped Screenshot', ur: 'مکمل اسکرین شاٹ' },
      transaction_id: { en: 'Transaction ID / TID', ur: 'ٹرانزیکشن آئی ڈی (TID)' },
      bank_statement: { en: 'Bank / Wallet Statement', ur: 'بینک / والٹ اسٹیٹمنٹ' },
      profile_record: { en: 'Suspect Number / Profile', ur: 'ملزم کا نمبر / پروفائل' },
    };
    return map[type][language];
  };

  return (
    <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className={`text-sm font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'اصل شواہد محفوظ رکھنے کا لازمی اصول'
                : 'Evidence Integrity Rule: Keep Original Records Intact'}
            </h3>
            <p className={`mt-0.5 text-xs text-slate-700 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'اصل واٹس ایپ چیٹ ڈیلیٹ نہ کریں، اسکرین شاٹس کراپ یا ایڈٹ نہ کریں، اور بینک/والٹ اسٹیٹمنٹ کی اصل PDF اور ٹرانزیکشن IDs محفوظ رکھیں۔'
                : 'Never delete original chat threads, do not crop or annotate original screenshots, and preserve raw WhatsApp .txt exports, exact phone numbers, and official bank/wallet PDF statements.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${incident.caseId}-dossier.txt`,
                buildCaseDossierText(caseState),
              )
            }
            className="inline-flex h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isUrdu ? 'ڈوزیئر (.txt)' : 'Export .TXT'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${incident.caseId}-evidence.json`,
                JSON.stringify(caseState, null, 2),
                'application/json',
              )
            }
            className="inline-flex h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isUrdu ? 'JSON بیک اپ' : 'Backup JSON'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-5">
          <div>
            <h2 className={`text-lg font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? '01. واقعہ اور ملزم کی تفصیلات' : '01. Incident Profile & Suspect Identifiers'}
            </h2>
            <p className={`text-xs text-slate-500 mt-0.5 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'یہ تفصیلات خودکار طور پر سرکاری شکایت کے مسودے میں استعمال ہوں گی۔'
                : 'Facts entered here automatically populate your Official Complaint Draft and Case Dossier.'}
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-medium text-slate-600" dir="ltr">
            {incident.caseId}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'شکایت کنندہ کا پورا نام' : 'Complainant Full Name'}
            </label>
            <input
              type="text"
              value={incident.complainantName}
              onChange={(e) => onUpdateIncident({ complainantName: e.target.value })}
              placeholder={isUrdu ? 'مثلاً: محمد علی' : 'Full legal name'}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'رابطہ نمبر / ای میل' : 'Complainant Phone / Email'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={incident.complainantContact}
              onChange={(e) => onUpdateIncident({ complainantContact: e.target.value })}
              placeholder="+92 300 0000000"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'فراڈ یا واقعہ کی قسم' : 'Incident Category'}
            </label>
            <select
              value={incident.scamType}
              onChange={(e) => onUpdateIncident({ scamType: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="WhatsApp / Financial Fraud">WhatsApp / Financial Fraud</option>
              <option value="WhatsApp Account Hijack (OTP Scam)">WhatsApp Account Hijack (OTP Scam)</option>
              <option value="Mobile Wallet Fraud (JazzCash / Easypaisa)">Mobile Wallet Fraud (JazzCash / Easypaisa)</option>
              <option value="Bank Impersonation / Phishing">Bank Impersonation / Phishing</option>
              <option value="Fake Job / Investment Group Scam">Fake Job / Investment Group Scam</option>
              <option value="Impersonation / Online Extortion">Impersonation / Online Extortion</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'ملزم کا فون / واٹس ایپ نمبر' : 'Suspect Phone / WhatsApp Number'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={incident.suspectPhone}
              onChange={(e) => onUpdateIncident({ suspectPhone: e.target.value })}
              placeholder="+92 3XX XXXXXXX"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'ملزم کا بینک اکاؤنٹ / IBAN / والٹ' : 'Suspect Account / IBAN / Wallet'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={incident.suspectAccount}
              onChange={(e) => onUpdateIncident({ suspectAccount: e.target.value })}
              placeholder="PK00XXXX... or Wallet ID"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'مالی نقصان (رقم)' : 'Financial Loss'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={incident.amountLost}
                onChange={(e) => onUpdateIncident({ amountLost: e.target.value })}
                placeholder="50000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
            <div>
              <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'کرنسی' : 'Currency'}
              </label>
              <select
                value={incident.currency}
                onChange={(e) => onUpdateIncident({ currency: e.target.value })}
                dir="ltr"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className={`block text-xs font-medium text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'واقعہ کا مختصر اور واضح بیان' : 'Factual Incident Summary'}
            </label>
            <textarea
              rows={3}
              dir="auto"
              value={incident.summary}
              onChange={(e) => onUpdateIncident({ summary: e.target.value })}
              placeholder={
                isUrdu
                  ? 'مختصر بیان لکھیں: رابطہ کیسے ہوا، کیا دھوکہ دیا گیا، اور رقم یا اکاؤنٹ کیسے متاثر ہوا...'
                  : 'Write a concise, factual overview: how contact began, deception used, and exact loss or account compromise...'
              }
              className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-start">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className={`text-lg font-semibold text-slate-900 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu ? '02. شواہد کا ریکارڈ (Evidence Registry)' : '02. Preserved Evidence Registry'}
          </h2>
          <p className={`text-xs text-slate-500 mb-4 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu
              ? 'ٹرانزیکشن آئی ڈیز (TID)، چیٹ ایکسپورٹس اور اسکرین شاٹس کا ریکارڈ شامل کریں۔'
              : 'Log Transaction IDs (TIDs), original WhatsApp exports, uncropped screenshots, and bank PDFs.'}
          </p>

          <form onSubmit={handleAddEvidenceSubmit} className="space-y-3 border-b border-slate-200 pb-5 mb-5 no-print">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={artType}
                onChange={(e) => setArtType(e.target.value as EvidenceArtifact['type'])}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-none"
              >
                <option value="transaction_id">{artifactTypeLabel('transaction_id')}</option>
                <option value="chat_export">{artifactTypeLabel('chat_export')}</option>
                <option value="screenshot">{artifactTypeLabel('screenshot')}</option>
                <option value="bank_statement">{artifactTypeLabel('bank_statement')}</option>
                <option value="profile_record">{artifactTypeLabel('profile_record')}</option>
              </select>

              <input
                type="datetime-local"
                dir="ltr"
                value={artCapturedAt}
                onChange={(e) => setArtCapturedAt(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-mono-tabular text-slate-800 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <input
              type="text"
              dir="ltr"
              value={artRef}
              onChange={(e) => setArtRef(e.target.value)}
              placeholder={
                isUrdu
                  ? 'حوالہ نمبر / TID / فائل نام (مثلاً: TID-98451230)'
                  : 'Reference ID / TID / Filename (e.g., TID-98451230 or WhatsApp_Chat.txt)'
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-teal-700 focus:outline-none"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                dir="auto"
                value={artDesc}
                onChange={(e) => setArtDesc(e.target.value)}
                placeholder={
                  isUrdu
                    ? 'تفصیل (مثلاً: ایزی پیسہ رسید رقم 25,000 روپے)'
                    : 'Description (e.g., Receipt showing transfer of PKR 25,000)'
                }
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-md bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>{isUrdu ? 'شامل کریں' : 'Add Evidence'}</span>
              </button>
            </div>
          </form>

          {evidence.length === 0 ? (
            <div className={`py-6 text-center text-xs text-slate-500 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'ابھی کوئی ثبوت درج نہیں کیا گیا۔ اوپر فارم کے ذریعے TID یا چیٹ ریکارڈ شامل کریں۔'
                : 'No evidence artifacts logged yet. Add your first TID, chat export, or screenshot above.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {evidence.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-800">
                        {artifactTypeLabel(item.type)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular" dir="ltr">
                        {item.capturedAt.replace('T', ' ')}
                      </span>
                    </div>
                    {item.referenceCode && (
                      <div className="mt-1 font-mono-tabular text-xs font-semibold text-teal-800 break-all" dir="ltr">
                        {item.referenceCode}
                      </div>
                    )}
                    <p className={`mt-1 text-sm text-slate-700 ${isUrdu ? 'font-urdu' : ''}`}>
                      {item.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleEvidencePreserved(item.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-800"
                    >
                      {item.preservedOriginal ? (
                        <CheckSquare className="h-3.5 w-3.5 text-emerald-700" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span>
                        {isUrdu ? 'اصل غیر ترمیم شدہ فائل محفوظ ہے' : 'Original Unedited File Intact'}
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEvidence(item.id)}
                    className="p-2 text-slate-400 hover:text-red-700 shrink-0 no-print"
                    aria-label="Delete evidence record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className={`text-lg font-semibold text-slate-900 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu ? '03. واقعات کی ٹائم لائن (Chronology)' : '03. Chronological Event Timeline'}
          </h2>
          <p className={`text-xs text-slate-500 mb-4 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu
              ? 'وقت کی ترتیب سے تمام واقعات درج کریں تاکہ بینک اور ایف آئی اے کو واضح ترتیب پیش کی جا سکے۔'
              : 'Record events in timestamp order for clear law enforcement and bank dispute investigation.'}
          </p>

          <form onSubmit={handleAddTimelineSubmit} className="space-y-3 border-b border-slate-200 pb-5 mb-5 no-print">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                dir="ltr"
                value={evTimestamp}
                onChange={(e) => setEvTimestamp(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-mono-tabular text-slate-800 focus:border-teal-700 focus:outline-none"
              />
              <input
                type="text"
                dir="auto"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder={
                  isUrdu ? 'واقعہ کا عنوان (مثلاً: مشکوک کال موصول ہوئی)' : 'Event title (e.g., Received spoofed bank call)'
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                dir="auto"
                value={evDetails}
                onChange={(e) => setEvDetails(e.target.value)}
                placeholder={
                  isUrdu ? 'اضافی تفصیل (نمبر، رقم یا کارروائی)' : 'Supporting details (number, amount, or action taken)'
                }
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-md bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>{isUrdu ? 'واقعہ شامل کریں' : 'Add Event'}</span>
              </button>
            </div>
          </form>

          {timeline.length === 0 ? (
            <div className={`py-6 text-center text-xs text-slate-500 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'ابھی ٹائم لائن میں کوئی واقعہ درج نہیں ہے۔'
                : 'No timeline entries logged yet. Add events in chronological order above.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {timeline.map((ev, index) => (
                <div key={ev.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-tabular font-semibold text-slate-700">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <span className="font-mono-tabular" dir="ltr">
                        {ev.timestamp.replace('T', ' ')}
                      </span>
                    </div>
                    <div className={`mt-1 text-sm font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                      {ev.title}
                    </div>
                    {ev.details && (
                      <p className={`mt-1 text-xs text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                        {ev.details}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTimeline(ev.id)}
                    className="p-2 text-slate-400 hover:text-red-700 shrink-0 no-print"
                    aria-label="Delete timeline event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end no-print">
            <button
              type="button"
              onClick={onProceedToComplaint}
              className="inline-flex h-[42px] items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <FileText className="h-4 w-4" />
              <span>
                {isUrdu
                  ? 'ان شواہد سے سرکاری شکایت تیار کریں'
                  : 'Generate Official Complaint from Vault'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
