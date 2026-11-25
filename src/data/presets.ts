import type { CaseWorkspaceState, Language } from '../types/case';

export interface SecurityActionItem {
  id: string;
  phase: 'immediate' | 'whatsapp' | 'financial';
  priority: 'critical' | 'high' | 'standard';
  title: { en: string; ur: string };
  steps: { en: string; ur: string };
}

export const SECURITY_CHECKLIST_ITEMS: SecurityActionItem[] = [
  {
    id: 'freeze-bank-wallet',
    phase: 'immediate',
    priority: 'critical',
    title: {
      en: 'Call Bank / Mobile Wallet Fraud Helpline Immediately',
      ur: 'بینک یا موبائل والٹ کی فراڈ ہیلپ لائن پر فوری کال کریں',
    },
    steps: {
      en: 'Request an immediate temporary block/freeze on compromised cards, IBAN, JazzCash, or Easypaisa accounts and ask for a dispute/lien ticket number for any unauthorized transfers.',
      ur: 'اپنے بینک کارڈ، اکاؤنٹ، جاز کیش یا ایزی پیسہ والٹ کو فوری طور پر عارضی بلاک کروائیں اور غیر مجاز ٹرانزیکشن پر باضابطہ کمپلینٹ/ٹکٹ نمبر حاصل کریں۔',
    },
  },
  {
    id: 'stop-otp-sharing',
    phase: 'immediate',
    priority: 'critical',
    title: {
      en: 'Never Share Any 6-Digit OTP, PIN, or Verification Link',
      ur: 'کوئی بھی 6 ہندسوں کا OTP، پن یا تصدیقی لنک ہرگز شیئر نہ کریں',
    },
    steps: {
      en: 'Legitimate bank staff, FIA officials, and WhatsApp support never ask for SMS verification codes or remote-access apps (AnyDesk/TeamViewer). Uninstall any remote-access app if installed during the call.',
      ur: 'کوئی بھی بینک نمائندہ، ایف آئی اے یا واٹس ایپ عملہ OTP یا ریموٹ ایپ (AnyDesk/TeamViewer) انسٹال کرنے کا نہیں کہتا۔ اگر ایسی کوئی ایپ انسٹال کی ہے تو فوراً انٹرنیٹ بند کر کے ڈیلیٹ کریں۔',
    },
  },
  {
    id: 'preserve-before-blocking',
    phase: 'immediate',
    priority: 'high',
    title: {
      en: 'Export Chats & Capture Uncropped Screenshots Before Blocking',
      ur: 'بلاک کرنے سے پہلے اصل چیٹ ایکسپورٹ اور مکمل اسکرین شاٹس محفوظ کریں',
    },
    steps: {
      en: 'Do NOT delete the chat or clear history. Export the WhatsApp chat (.txt) and capture uncropped screenshots showing the suspect phone number, profile, timestamps, and payment receipts.',
      ur: 'چیٹ ہرگز ڈیلیٹ نہ کریں۔ واٹس ایپ چیٹ (.txt) ایکسپورٹ کریں اور ملزم کے نمبر، پروفائل، تاریخ/وقت اور ادائیگی کی رسیدوں کے مکمل اسکرین شاٹس محفوظ کریں۔',
    },
  },
  {
    id: 'wa-linked-devices',
    phase: 'whatsapp',
    priority: 'critical',
    title: {
      en: 'Inspect & Remove Unknown WhatsApp Linked Devices',
      ur: 'واٹس ایپ میں غیر متعلقہ Linked Devices فوراً چیک اور لاگ آؤٹ کریں',
    },
    steps: {
      en: 'Open WhatsApp > Settings > Linked Devices. Immediately log out any unfamiliar browser, desktop, or unknown session.',
      ur: 'واٹس ایپ > Settings > Linked Devices کھولیں اور کسی بھی انجان کمپیوٹر یا براؤزر سیشن کو فوراً Log out کریں۔',
    },
  },
  {
    id: 'wa-two-step',
    phase: 'whatsapp',
    priority: 'critical',
    title: {
      en: 'Enable WhatsApp Two-Step Verification (6-Digit PIN)',
      ur: 'واٹس ایپ Two-Step Verification (6 ہندسوں کا پن) فعال کریں',
    },
    steps: {
      en: 'Go to WhatsApp > Settings > Account > Two-step verification > Turn on. Set a private 6-digit PIN and add your personal recovery email address.',
      ur: 'واٹس ایپ > Settings > Account > Two-step verification میں جا کر 6 ہندسوں کا خفیہ پن لگائیں اور اپنا ذاتی ریکوری ای میل ایڈریس شامل کریں۔',
    },
  },
  {
    id: 'wa-hijack-recovery',
    phase: 'whatsapp',
    priority: 'high',
    title: {
      en: 'Re-register Hijacked Number or Contact Official WhatsApp Support',
      ur: 'ہیک شدہ واٹس ایپ نمبر دوبارہ رجسٹر کریں یا آفیشل سپورٹ سے رابطہ کریں',
    },
    steps: {
      en: 'If locked out, reinstall WhatsApp and request a fresh SMS/Call verification code to sign back in (this logs out the attacker). If a 7-day 2FA lock blocks you, email support@whatsapp.com with your number in international format (+92...).',
      ur: 'اکاؤنٹ ہیک ہونے کی صورت میں واٹس ایپ پر دوبارہ اپنا نمبر SMS/کال کوڈ کے ذریعے رجسٹر کریں تاکہ حملہ آور لاگ آؤٹ ہو جائے۔ پن لاک ہونے پر support@whatsapp.com پر اپنا نمبر (+92...) لکھ کر ای میل کریں۔',
    },
  },
  {
    id: 'sim-telecom-lock',
    phase: 'whatsapp',
    priority: 'high',
    title: {
      en: 'Verify SIM Ownership & Enable Carrier SIM PIN / Port Protection',
      ur: 'اپنے موبائل نیٹ ورک سے سم کی تصدیق اور سم لاک (SIM PIN) لگوائیں',
    },
    steps: {
      en: 'Confirm with your mobile carrier that no duplicate SIM or unauthorized call-forwarding (*#21# / ##002#) is active. Dial ##002# if suspicious call forwarding is present.',
      ur: 'اپنی موبائل کمپنی سے تصدیق کریں کہ کوئی ڈپلیکیٹ سم یا غیر مجاز کال فارورڈنگ فعال تو نہیں۔ مشکوک کال فارورڈنگ ختم کرنے کے لیے ##002# ڈائل کریں۔',
    },
  },
  {
    id: 'change-pins-email',
    phase: 'financial',
    priority: 'critical',
    title: {
      en: 'Rotate Banking Passwords, Wallet MPINs & Primary Email Password',
      ur: 'بینک ایپس، موبائل والٹ MPIN اور بنیادی ای میل کا پاس ورڈ تبدیل کریں',
    },
    steps: {
      en: 'Use a clean, trusted device to set unique passwords/MPINs for banking apps, Gmail/Apple ID, and enable app-based 2FA instead of SMS wherever available.',
      ur: 'محفوظ ڈیوائس سے اپنے بینک ایپ، جاز کیش/ایزی پیسہ MPIN اور Gmail/ای میل کے پاس ورڈ تبدیل کریں اور دو مرحلہ وار تصدیق (2FA) آن کریں۔',
    },
  },
  {
    id: 'collect-bank-statement',
    phase: 'financial',
    priority: 'standard',
    title: {
      en: 'Download Official Bank / Wallet Statement PDF with Transaction IDs',
      ur: 'ٹرانزیکشن آئی ڈیز (TID) کے ساتھ بینک یا والٹ کی آفیشل اسٹیٹمنٹ محفوظ کریں',
    },
    steps: {
      en: 'Download the signed or official PDF statement showing sender account, beneficiary IBAN/account, exact amount, date/time, and Transaction Reference ID (TID/STAN) for FIA/NCCIA and Banking Mohtasib.',
      ur: 'ایسی آفیشل PDF اسٹیٹمنٹ ڈاؤن لوڈ کریں جس میں بھیجنے اور وصول کرنے والے کا اکاؤنٹ نمبر/IBAN، رقم، وقت اور Transaction ID واضح درج ہو۔',
    },
  },
];

export const OFFICIAL_CHANNELS = [
  {
    id: 'nccia-fia',
    name: {
      en: 'FIA Cyber Crime Wing / NCCIA (Pakistan)',
      ur: 'ایف آئی اے سائبر کرائم / این سی سی آئی اے (پاکستان)',
    },
    contact: 'Helpline 1991 · complaint.fia.gov.pk',
    purpose: {
      en: 'Primary federal law enforcement portal for online financial fraud, WhatsApp hijacking, impersonation, and extortion.',
      ur: 'آن لائن مالیاتی فراڈ، واٹس ایپ ہیکنگ، جعلی شناخت اور بلیک میلنگ کی باضابطہ قانونی شکایت کے لیے مرکزی ادارہ۔',
    },
  },
  {
    id: 'bank-wallet-desk',
    name: {
      en: 'Commercial Bank / JazzCash / Easypaisa Fraud Desk',
      ur: 'متعلقہ بینک / جاز کیش / ایزی پیسہ فراڈ ڈیسک',
    },
    contact: 'Official helpline printed on back of debit card / official app',
    purpose: {
      en: 'Immediate card/account freeze, disputed transaction ticket, and beneficiary bank lien-marking request.',
      ur: 'کارڈ/اکاؤنٹ فوری بلاک کروانے، ٹرانزیکشن ڈسپیوٹ ٹکٹ اور وصول کنندہ اکاؤنٹ پر رقم روکنے (Lien) کی درخواست کے لیے۔',
    },
  },
  {
    id: 'banking-mohtasib',
    name: {
      en: 'Banking Mohtasib Pakistan / SBP Consumer Protection',
      ur: 'بینکنگ محتسب پاکستان / اسٹیٹ بینک کنزیومر پروٹیکشن',
    },
    contact: 'bankingmohtasib.gov.pk · sbp.org.pk',
    purpose: {
      en: 'Formal escalation if a commercial bank fails to resolve or investigate a written fraud complaint within statutory timelines.',
      ur: 'اگر بینک تحریری شکایت پر مقررہ وقت میں کارروائی نہ کرے تو بینکنگ محتسب کو اپیل دائر کرنے کے لیے۔',
    },
  },
  {
    id: 'whatsapp-support',
    name: {
      en: 'WhatsApp Official Account & Security Support',
      ur: 'واٹس ایپ آفیشل اکاؤنٹ اور سیکیورٹی سپورٹ',
    },
    contact: 'support@whatsapp.com · In-app Report',
    purpose: {
      en: 'Recovering hijacked accounts, reporting scammer numbers inside the app before blocking, and requesting temporary account deactivation if locked out.',
      ur: 'ہیک شدہ اکاؤنٹ کی بحالی، ملزم کا نمبر واٹس ایپ کے اندر رپورٹ کرنے اور عارضی طور پر اکاؤنٹ محفوظ بنانے کے لیے۔',
    },
  },
];

export const EMERGENCY_SCENARIOS = [
  {
    id: 'wa-otp-hijack',
    label: {
      en: 'My WhatsApp was hijacked via 6-digit code',
      ur: 'میرا واٹس ایپ 6 ہندسوں کے کوڈ کے ذریعے ہیک ہو گیا ہے',
    },
    prompt: {
      en: 'Someone tricked me into sharing a 6-digit WhatsApp verification code and my WhatsApp is now locked out / messaging my contacts for money. Give me immediate containment steps, evidence preservation guidance, and what to warn my contacts.',
      ur: 'کسی نے دھوکے سے مجھ سے واٹس ایپ کا 6 ہندسوں کا کوڈ لے لیا ہے اور اب میرا واٹس ایپ لاک ہو گیا ہے یا میرے نمبروں پر پیسے مانگ رہا ہے۔ مجھے فوری اکاؤنٹ بچانے، ثبوت محفوظ کرنے اور قانونی کارروائی کے مراحل بتائیں۔',
    },
  },
  {
    id: 'wallet-bank-scam',
    label: {
      en: 'Money transferred via JazzCash / Easypaisa / Bank scam',
      ur: 'جاز کیش، ایزی پیسہ یا بینک کے ذریعے دھوکے سے رقم ٹرانسفر ہو گئی',
    },
    prompt: {
      en: 'I transferred money or an unauthorized transfer occurred from my bank/mobile wallet after a scam call or fake WhatsApp link. Walk me through immediate account protection, what transaction evidence to lock down, and how to report to my bank and FIA/NCCIA.',
      ur: 'جعلی کال یا مشکوک واٹس ایپ لنک کے بعد میرے بینک یا موبائل والٹ سے رقم نکل گئی ہے۔ مجھے فوری اکاؤنٹ محفوظ کرنے، ٹرانزیکشن ثبوت اکٹھے کرنے اور بینک/ایف آئی اے میں شکایت درج کرانے کی مکمل رہنمائی دیں۔',
    },
  },
  {
    id: 'fake-job-investment',
    label: {
      en: 'Fake WhatsApp job, prize, or investment group',
      ur: 'واٹس ایپ پر جعلی نوکری، انعام یا سرمایہ کاری گروپ فراڈ',
    },
    prompt: {
      en: 'I received a WhatsApp offer promising daily task income, a prize, or crypto/trading returns and already shared some details or sent an initial deposit. How do I stop further risk, verify what credentials are exposed, and organize evidence?',
      ur: 'مجھے واٹس ایپ پر آن لائن ٹاسک، انعام یا منافع بخش سرمایہ کاری کی پیشکش ہوئی اور میں نے کچھ معلومات یا ابتدائی رقم بھیج دی ہے۔ مزید نقصان سے بچنے، اکاؤنٹس محفوظ کرنے اور ثبوت منظم کرنے کا طریقہ بتائیں۔',
    },
  },
  {
    id: 'impersonation-extortion',
    label: {
      en: 'Someone is impersonating me or threatening/blackmailing',
      ur: 'کوئی میری جعلی شناخت استعمال کر رہا ہے یا بلیک میل کر رہا ہے',
    },
    prompt: {
      en: 'A scammer is using my photo/name on WhatsApp to message relatives or threatening me online. Give me lawful defensive steps to preserve original evidence, protect my privacy, and file an official cybercrime report.',
      ur: 'کوئی شخص واٹس ایپ پر میری تصویر یا نام استعمال کر کے جاننے والوں کو میسج کر رہا ہے یا دھمکیاں دے رہا ہے۔ قانون کے مطابق ثبوت محفوظ کرنے، پرائیویسی بچانے اور سائبر کرائم رپورٹ درج کرنے کا طریقہ بتائیں۔',
    },
  },
];

export function createInitialCaseState(lang: Language): CaseWorkspaceState {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return {
    incident: {
      caseId: `KHAN-${datePart}-${randomSuffix}`,
      complainantName: '',
      complainantContact: '',
      scamType: 'WhatsApp / Financial Fraud',
      suspectPhone: '',
      suspectAccount: '',
      amountLost: '',
      currency: 'PKR',
      incidentDate: now.toISOString().slice(0, 16),
      summary: '',
    },
    timeline: [],
    evidence: [],
    securityChecks: {},
    messages: [
      {
        id: 'welcome-msg',
        role: 'assistant',
        createdAt: now.toISOString(),
        text:
          lang === 'ur'
            ? 'السلام علیکم! میں KHAN AI ڈیفنسو سائبر سیکیورٹی اسسٹنٹ ہوں۔\n\nاگر آپ کو واٹس ایپ ہیکنگ، مشکوک لنک، جعلی بینک کال یا آن لائن مالیاتی فراڈ کا سامنا ہے تو فوراً نیچے اپنی صورتحال لکھیں یا مشکوک میسج کا اسکرین شاٹ اپ لوڈ کریں۔\n\nاہم اصول:\n1. کوئی بھی چیٹ، نمبر یا ٹرانزیکشن ریکارڈ ہرگز ڈیلیٹ نہ کریں۔\n2. کسی کے ساتھ 6 ہندسوں کا OTP یا MPIN شیئر نہ کریں۔\n3. رقم نکلنے کی صورت میں فوراً اپنے بینک یا موبائل والٹ ہیلپ لائن پر کال کر کے اکاؤنٹ عارضی بلاک کروائیں۔'
            : 'Welcome to KHAN AI Defensive Cybersecurity & Evidence Workbench.\n\nDescribe what happened or upload a screenshot of a suspicious WhatsApp/SMS message. I will guide you through:\n1. Immediate Account Containment (bank/wallet freeze, WhatsApp 2FA, SIM & PIN protection)\n2. Original Evidence Preservation (keeping unedited chat exports, screenshots, TIDs, and timestamps intact)\n3. Lawful Reporting & Official Complaint Drafts (FIA/NCCIA, Bank Fraud Desk, Banking Mohtasib, WhatsApp Support)',
      },
    ],
    lastComplaint: null,
  };
}

export const UI_COPY = {
  en: {
    brand: 'KHAN AI',
    developedBy: 'Developed by: ایاز احمد خان',
    nav: {
      assistant: 'Triage & Scam Analyzer',
      security: 'Account Security',
      evidence: 'Evidence Vault',
      complaint: 'Complaint Drafter',
    },
    topBar: {
      newCase: 'New Case',
      exportDossier: 'Export Dossier',
    },
    caseBanner: {
      caseRef: 'Case Ref',
      checklistProgress: 'Security Steps',
      evidenceCount: 'Evidence Items',
      timelineCount: 'Timeline Events',
    },
  },
  ur: {
    brand: 'KHAN AI',
    developedBy: 'تیار کردہ: ایاز احمد خان',
    nav: {
      assistant: 'اسکیم تجزیہ و رہنمائی',
      security: 'اکاؤنٹ سیکیورٹی چیک لسٹ',
      evidence: 'شواہد والٹ اور ٹائم لائن',
      complaint: 'سرکاری شکایت ڈرافٹر',
    },
    topBar: {
      newCase: 'نیا کیس شروع کریں',
      exportDossier: 'کیس فائل ڈاؤن لوڈ',
    },
    caseBanner: {
      caseRef: 'کیس نمبر',
      checklistProgress: 'سیکیورٹی اقدامات',
      evidenceCount: 'محفوظ شواہد',
      timelineCount: 'ٹائم لائن واقعات',
    },
  },
};
