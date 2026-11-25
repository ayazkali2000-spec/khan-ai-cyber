import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Printer,
} from 'lucide-react';
import type {
  CaseWorkspaceState,
  GeneratedComplaint,
  Language,
} from '../types/case';
import { downloadTextFile } from '../utils/dossierExport';

interface ComplaintDrafterViewProps {
  language: Language;
  caseState: CaseWorkspaceState;
  onSaveComplaint: (complaint: GeneratedComplaint) => void;
  onOpenVault: () => void;
}

const AUTHORITY_OPTIONS = [
  {
    value: 'FIA Cyber Crime Wing / NCCIA (Pakistan)',
    label: {
      en: 'FIA Cyber Crime Wing / NCCIA (Pakistan)',
      ur: 'ایف آئی اے سائبر کرائم / این سی سی آئی اے (پاکستان)',
    },
  },
  {
    value: 'Commercial Bank / Mobile Wallet Fraud Investigation Desk',
    label: {
      en: 'Bank / JazzCash / Easypaisa Fraud Desk',
      ur: 'بینک / جاز کیش / ایزی پیسہ فراڈ ڈیسک',
    },
  },
  {
    value: 'Banking Mohtasib Pakistan / Financial Regulator',
    label: {
      en: 'Banking Mohtasib / Financial Regulator',
      ur: 'بینکنگ محتسب / اسٹیٹ بینک ریگولیٹر',
    },
  },
  {
    value: 'WhatsApp Official Account & Security Support',
    label: {
      en: 'WhatsApp Official Security Support',
      ur: 'واٹس ایپ آفیشل سیکیورٹی سپورٹ',
    },
  },
];

export function ComplaintDrafterView({
  language,
  caseState,
  onSaveComplaint,
  onOpenVault,
}: ComplaintDrafterViewProps) {
  const isUrdu = language === 'ur';
  const [authority, setAuthority] = useState(AUTHORITY_OPTIONS[0].value);
  const [draftLanguage, setDraftLanguage] = useState<Language>(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { incident, timeline, evidence, lastComplaint } = caseState;

  const transactionIds = evidence
    .filter((e) => e.type === 'transaction_id' || e.type === 'bank_statement')
    .map((e) => `${e.referenceCode || e.description} (${e.capturedAt})`)
    .join('; ');

  const timelineText = timeline
    .map((t, idx) => `${idx + 1}. [${t.timestamp}] ${t.title}${t.details ? ` - ${t.details}` : ''}`)
    .join('\n');

  const evidenceListText = evidence
    .map((e, idx) => `${idx + 1}. [${e.type}] ${e.referenceCode || 'No Ref'} - ${e.description} (${e.capturedAt})`)
    .join('\n');

  const hasMinimumFacts = Boolean(
    incident.summary.trim() ||
      incident.suspectPhone.trim() ||
      incident.suspectAccount.trim() ||
      transactionIds.trim() ||
      timeline.length > 0,
  );

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasMinimumFacts || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/complaint/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority,
          language: draftLanguage,
          complainantName: incident.complainantName,
          complainantContact: incident.complainantContact,
          incidentType: incident.scamType,
          incidentSummary: incident.summary,
          suspectDetails: [incident.suspectPhone, incident.suspectAccount]
            .filter(Boolean)
            .join(' | '),
          financialLoss: incident.amountLost
            ? `${incident.currency} ${incident.amountLost}`
            : '',
          transactionIds,
          timelineText,
          evidenceListText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to draft official complaint.');
      }

      onSaveComplaint({
        subjectLine: data.subjectLine,
        recipientHeader: data.recipientHeader,
        formalLetter: data.formalLetter,
        attachmentsChecklist: Array.isArray(data.attachmentsChecklist)
          ? data.attachmentsChecklist
          : [],
        submissionNotes: data.submissionNotes,
        generatedAt: new Date().toISOString(),
        authority,
        language: draftLanguage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate complaint draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fullComplaintDocument = lastComplaint
    ? `${lastComplaint.recipientHeader}\n\nSubject: ${lastComplaint.subjectLine}\n\n${lastComplaint.formalLetter}\n\n---\nAttachments:\n${lastComplaint.attachmentsChecklist.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    : '';

  const handleCopy = async () => {
    if (!fullComplaintDocument) return;
    await navigator.clipboard.writeText(fullComplaintDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-6 space-y-5 no-print"
        >
          <div>
            <h2 className={`text-lg font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'سرکاری شکایت کا مسودہ تیار کریں' : 'Official Complaint Drafter'}
            </h2>
            <p className={`mt-1 text-xs text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu
                ? 'آپ کے شواہد والٹ میں موجود حقائق، ٹرانزیکشن آئی ڈیز اور ٹائم لائن کی بنیاد پر باضابطہ قانونی درخواست تیار کی جاتی ہے۔'
                : 'Generates a factual, structured complaint letter using the suspect identifiers, transaction IDs, and chronology stored in your Evidence Vault.'}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isUrdu ? 'کیس نمبر' : 'Case Ref'}</span>
              <span className="font-mono-tabular font-semibold text-slate-800" dir="ltr">
                {incident.caseId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isUrdu ? 'ملزم کا نمبر / اکاؤنٹ' : 'Suspect Identifiers'}</span>
              <span className="font-mono-tabular text-slate-800 truncate max-w-[180px]" dir="ltr">
                {incident.suspectPhone || incident.suspectAccount || (isUrdu ? 'درج نہیں' : 'Not entered')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isUrdu ? 'محفوظ شواہد / ٹائم لائن' : 'Evidence / Timeline'}</span>
              <span className="font-mono-tabular text-slate-800">
                {evidence.length} / {timeline.length}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onOpenVault}
                className="text-xs font-medium text-teal-800 hover:underline"
              >
                {isUrdu ? 'شواہد والٹ میں تفصیلات اپ ڈیٹ کریں' : 'Edit facts in Evidence Vault'}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium text-slate-700 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'متعلقہ ادارہ منتخب کریں' : 'Target Official Authority'}
            </label>
            <select
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            >
              {AUTHORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[language]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={`block text-xs font-medium text-slate-700 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'شکایت کی زبان' : 'Complaint Letter Language'}
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setDraftLanguage('en')}
                className={`rounded-md py-2 text-xs font-medium transition-colors ${
                  draftLanguage === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Formal English
              </button>
              <button
                type="button"
                onClick={() => setDraftLanguage('ur')}
                className={`rounded-md py-2 text-xs font-medium font-urdu transition-colors ${
                  draftLanguage === 'ur'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                رسمی اردو
              </button>
            </div>
          </div>

          {!hasMinimumFacts && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className={isUrdu ? 'font-urdu' : ''}>
                {isUrdu
                  ? 'شکایت تیار کرنے سے پہلے شواہد والٹ میں کم از کم واقعہ کا خلاصہ، ملزم کا نمبر یا ٹرانزیکشن ID درج کریں۔'
                  : 'Enter at least an incident summary, suspect phone/account, or transaction ID in the Evidence Vault before drafting.'}
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!hasMinimumFacts || isGenerating}
            className="inline-flex w-full h-[42px] items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>
              {isGenerating
                ? isUrdu
                  ? 'مسودہ تیار ہو رہا ہے...'
                  : 'Drafting Complaint...'
                : isUrdu
                  ? 'سرکاری شکایت تیار کریں'
                  : 'Draft Official Complaint'}
            </span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-6">
          {!lastComplaint && !isGenerating && (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
              <h3 className={`mt-3 text-sm font-semibold text-slate-800 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'شکایت کا مسودہ یہاں ظاہر ہوگا' : 'Formal Complaint Preview'}
              </h3>
              <p className={`mt-1 text-xs text-slate-500 max-w-md mx-auto ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu
                  ? 'متعلقہ ادارہ اور زبان منتخب کر کے مسودہ تیار کریں۔ جمع کرانے سے پہلے اپنے شناختی کارڈ اور تاریخ کی تصدیق ضرور کریں۔'
                  : 'Select your target authority and language on the left to generate a clean, factual complaint ready for submission.'}
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4 py-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-64 w-full animate-pulse rounded bg-slate-100" />
            </div>
          )}

          {lastComplaint && !isGenerating && (
            <div
              className="space-y-5"
              dir={lastComplaint.language === 'ur' ? 'rtl' : 'ltr'}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 no-print">
                <div className="text-xs text-slate-500">
                  <span>{lastComplaint.authority}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span className="font-mono-tabular" dir="ltr">
                    {new Date(lastComplaint.generatedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : isUrdu ? 'کاپی کریں' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        `${incident.caseId}-complaint.txt`,
                        fullComplaintDocument,
                      )
                    }
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isUrdu ? 'ڈاؤن لوڈ .txt' : 'Download .txt'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
                  </button>
                </div>
              </div>

              <div className={`space-y-4 ${lastComplaint.language === 'ur' ? 'font-urdu' : ''}`}>
                <div className="whitespace-pre-wrap text-sm font-medium text-slate-800">
                  {lastComplaint.recipientHeader}
                </div>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900">
                  {lastComplaint.subjectLine}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {lastComplaint.formalLetter}
                </div>

                {lastComplaint.attachmentsChecklist.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                      {lastComplaint.language === 'ur'
                        ? 'منسلک کیے جانے والے لازمی ثبوت'
                        : 'Required Evidence Attachments'}
                    </h4>
                    <ul className="list-disc ps-5 space-y-1 text-sm text-slate-700">
                      {lastComplaint.attachmentsChecklist.map((att, i) => (
                        <li key={i}>{att}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lastComplaint.submissionNotes && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed">
                    <strong className="block text-slate-900 mb-1">
                      {lastComplaint.language === 'ur'
                        ? 'جمع کرانے اور فالو اپ کی ہدایات'
                        : 'Submission & Tracking Notes'}
                    </strong>
                    {lastComplaint.submissionNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
