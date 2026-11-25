import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookmarkPlus,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  ScanSearch,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { EMERGENCY_SCENARIOS } from '../data/presets';
import type {
  CaseWorkspaceState,
  ChatMessage,
  Language,
  ScamAnalysisResult,
} from '../types/case';

type AssistantModeId = 'general' | 'coding' | 'cyber_safety' | 'image_prompt';

interface AssistantViewProps {
  language: Language;
  caseState: CaseWorkspaceState;
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onClearMessages: () => void;
  onSaveToTimeline: (title: string, details: string) => void;
  onOpenVault: () => void;
}

interface TextSegment {
  type: 'plain' | 'code';
  content: string;
  lang?: string;
}

function parseCodeBlocks(raw: string): TextSegment[] {
  const regex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  const result: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const plain = raw.slice(lastIndex, match.index).trim();
      if (plain) result.push({ type: 'plain', content: plain });
    }
    result.push({
      type: 'code',
      lang: match[1] || 'code',
      content: match[2].replace(/\s+$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    const tail = raw.slice(lastIndex).trim();
    if (tail) result.push({ type: 'plain', content: tail });
  }

  return result.length > 0 ? result : [{ type: 'plain', content: raw }];
}

function readFileAsBase64(file: File): Promise<{ mimeType: string; data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('Could not read image file.'));
        return;
      }
      resolve({
        mimeType: file.type || 'image/png',
        data: result.slice(commaIdx + 1),
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function AssistantView({
  language,
  caseState,
  onUpdateMessages,
  onClearMessages,
  onSaveToTimeline,
  onOpenVault,
}: AssistantViewProps) {
  const [mode, setMode] = useState<'chat' | 'analyzer'>('chat');
  const [assistantMode, setAssistantMode] = useState<AssistantModeId>('cyber_safety');
  const [inputText, setInputText] = useState('');
  const [chatImage, setChatImage] = useState<{
    mimeType: string;
    data: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Analyzer state
  const [suspectText, setSuspectText] = useState('');
  const [analyzerImage, setAnalyzerImage] = useState<{
    mimeType: string;
    data: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScamAnalysisResult | null>(null);
  const [savedAnalysis, setSavedAnalysis] = useState(false);

  const chatFileRef = useRef<HTMLInputElement>(null);
  const analyzerFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isUrdu = language === 'ur';

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const modeOptions: Array<{ id: AssistantModeId; labelEn: string; labelUr: string }> = [
    { id: 'cyber_safety', labelEn: 'Cyber Safety', labelUr: 'سائبر تحفظ' },
    { id: 'general', labelEn: 'General Chat', labelUr: 'عمومی گفتگو' },
    { id: 'coding', labelEn: 'Coding & Debug', labelUr: 'کوڈنگ و ڈیبگ' },
    { id: 'image_prompt', labelEn: 'Image Prompts', labelUr: 'امیج پرامپٹس' },
  ];

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setChatError(
        isUrdu
          ? 'اس براؤزر میں وائس ان پٹ دستیاب نہیں ہے۔'
          : 'Browser speech recognition is unavailable on this device.',
      );
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = isUrdu ? 'ur-PK' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || '';
      }
      setInputText(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setChatError(null);
    setIsListening(true);
    recognition.start();
  };

  const speakMessage = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[*#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    const hasUrdu = /[\u0600-\u06FF]/.test(clean);
    utterance.lang = hasUrdu ? 'ur-PK' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const buildCaseContextSummary = () => {
    const inc = caseState.incident;
    const parts: string[] = [];
    if (inc.scamType) parts.push(`Category: ${inc.scamType}`);
    if (inc.suspectPhone) parts.push(`Suspect Phone: ${inc.suspectPhone}`);
    if (inc.suspectAccount) parts.push(`Suspect Account/IBAN: ${inc.suspectAccount}`);
    if (inc.amountLost) parts.push(`Amount Lost: ${inc.currency} ${inc.amountLost}`);
    if (inc.summary) parts.push(`Summary: ${inc.summary}`);
    if (caseState.evidence.length > 0) {
      parts.push(`Preserved Evidence Count: ${caseState.evidence.length}`);
    }
    return parts.join(' | ');
  };

  const handleChatFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readFileAsBase64(file);
      setChatImage({ ...encoded, name: file.name });
      setChatError(null);
    } catch {
      setChatError(isUrdu ? 'تصویر لوڈ کرنے میں مسئلہ پیش آیا۔' : 'Unable to load selected image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAnalyzerFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readFileAsBase64(file);
      setAnalyzerImage({ ...encoded, name: file.name });
      setAnalysisError(null);
    } catch {
      setAnalysisError(isUrdu ? 'اسکرین شاٹ لوڈ نہیں ہو سکا۔' : 'Unable to load screenshot image.');
    } finally {
      e.target.value = '';
    }
  };

  const sendChatMessage = async (overrideText?: string, overrideMode?: AssistantModeId) => {
    const trimmed = (overrideText ?? inputText).trim();
    if ((!trimmed && !chatImage) || isStreaming) return;

    const effectiveMode = overrideMode ?? assistantMode;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed || (isUrdu ? 'براہ کرم اس اسکرین شاٹ کا جائزہ لیں۔' : 'Please analyze this screenshot.'),
      createdAt: new Date().toISOString(),
      imagePreviewUrl: chatImage?.previewUrl,
      imageMimeType: chatImage?.mimeType,
      imageBase64: chatImage?.data,
    };

    const assistantId = `assistant-${Date.now() + 1}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      createdAt: new Date().toISOString(),
    };

    const historyForRequest = [...caseState.messages, userMsg]
      .filter((m) => m.id !== 'welcome-msg')
      .slice(-10)
      .map((m) => ({
        role: m.role,
        text: m.text,
        image:
          m.imageBase64 && m.imageMimeType
            ? { mimeType: m.imageMimeType, data: m.imageBase64 }
            : undefined,
      }));

    onUpdateMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    if (!overrideText) setInputText('');
    setChatImage(null);
    setChatError(null);
    setIsStreaming(true);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForRequest,
          language,
          mode: effectiveMode,
          caseContext: buildCaseContextSummary(),
        }),
      });

      if (!response.ok || !response.body) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6)) as {
            chunk?: string;
            done?: boolean;
            error?: string;
          };
          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.chunk) {
            onUpdateMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + payload.chunk } : m,
              ),
            );
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach KHAN AI service.';
      setChatError(msg);
      onUpdateMessages((prev) => prev.filter((m) => m.id !== assistantId || m.text.length > 0));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendChatMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendChatMessage();
    }
  };

  const handleAnalyzeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!suspectText.trim() && !analyzerImage) || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSavedAnalysis(false);

    try {
      const response = await fetch('/api/assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: suspectText.trim(),
          image: analyzerImage
            ? { mimeType: analyzerImage.mimeType, data: analyzerImage.data }
            : undefined,
          language,
        }),
      });

      const data = (await response.json()) as ScamAnalysisResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed.');
      }
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Failed to analyze suspicious message.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const riskBadgeStyle = (level: string) => {
    const normalized = level.toLowerCase();
    if (normalized === 'high') {
      return {
        text: isUrdu ? 'زیادہ خطرہ (High Risk)' : 'High Risk',
        className: 'text-red-700 border-red-200 bg-red-50',
        Icon: ShieldAlert,
      };
    }
    if (normalized === 'medium') {
      return {
        text: isUrdu ? 'درمیانہ خطرہ (Medium Risk)' : 'Medium Risk',
        className: 'text-amber-700 border-amber-200 bg-amber-50',
        Icon: AlertTriangle,
      };
    }
    return {
      text: isUrdu ? 'کم خطرہ / تصدیق طلب (Low Risk)' : 'Low Risk / Verify',
      className: 'text-emerald-700 border-emerald-200 bg-emerald-50',
      Icon: ShieldCheck,
    };
  };

  return (
    <div className="space-y-5" dir={isUrdu ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={`text-xl font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu
              ? 'KHAN AI اسسٹنٹ اور اسکیم تجزیہ کار'
              : 'KHAN AI Assistant & Scam Analyzer'}
          </h2>
          <p className={`mt-1 text-sm text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu
              ? 'سائبر تحفظ، کوڈنگ، عمومی گفتگو اور امیج پرامپٹس کے لیے تیز اردو/انگریزی معاونت۔'
              : 'Multi-mode bilingual companion for cyber safety, coding & debugging, general chat, and image prompts.'}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
              mode === 'chat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            } ${isUrdu ? 'font-urdu' : ''}`}
          >
            {isUrdu ? 'لائیو اسسٹنٹ چیٹ' : 'Assistant Chat'}
          </button>
          <button
            type="button"
            onClick={() => setMode('analyzer')}
            className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
              mode === 'analyzer'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            } ${isUrdu ? 'font-urdu' : ''}`}
          >
            {isUrdu ? 'اسکیم میسج اسکینر' : 'Message & Screenshot Analyzer'}
          </button>
        </div>
      </div>

      {mode === 'chat' ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-start">
          <div className="xl:col-span-8 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
                {modeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssistantMode(opt.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      assistantMode === opt.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    } ${isUrdu ? 'font-urdu' : ''}`}
                  >
                    {isUrdu ? opt.labelUr : opt.labelEn}
                  </button>
                ))}
              </div>

              {caseState.messages.length > 1 && (
                <button
                  type="button"
                  onClick={onClearMessages}
                  disabled={isStreaming}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isUrdu ? 'چیٹ صاف کریں' : 'Clear Thread'}</span>
                </button>
              )}
            </div>

            <div className="max-h-[520px] min-h-[360px] overflow-y-auto divide-y divide-slate-100 px-5 py-2">
              {caseState.messages.map((msg) => {
                const segments = parseCodeBlocks(msg.text);
                return (
                  <div key={msg.id} className="py-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-800">
                        {msg.role === 'user' ? (isUrdu ? 'آپ' : 'You') : 'KHAN AI'}
                      </span>
                      <span className="font-mono-tabular">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {msg.imagePreviewUrl && (
                      <div className="mb-3 max-w-xs overflow-hidden rounded-md border border-slate-200">
                        <img
                          src={msg.imagePreviewUrl}
                          alt="Uploaded evidence screenshot"
                          referrerPolicy="no-referrer"
                          className="max-h-56 w-full object-contain bg-slate-50"
                        />
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {!msg.text && isStreaming ? (
                        <div className={`text-sm text-slate-500 ${isUrdu ? 'font-urdu' : ''}`}>
                          {isUrdu ? 'جواب تیار ہو رہا ہے...' : 'Generating response...'}
                        </div>
                      ) : (
                        segments.map((seg, idx) =>
                          seg.type === 'code' ? (
                            <div
                              key={idx}
                              dir="ltr"
                              className="overflow-hidden rounded-md border border-slate-800 bg-slate-900 text-slate-100"
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                                <span className="font-mono-tabular">{seg.lang}</span>
                                <button
                                  type="button"
                                  onClick={() => void copyText(`${msg.id}-code-${idx}`, seg.content)}
                                  className="inline-flex items-center gap-1 text-teal-300 hover:text-teal-200"
                                >
                                  {copiedId === `${msg.id}-code-${idx}` ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                  <span>
                                    {copiedId === `${msg.id}-code-${idx}` ? 'Copied' : 'Copy Code'}
                                  </span>
                                </button>
                              </div>
                              <pre className="overflow-x-auto p-3.5 text-xs font-mono-tabular leading-relaxed">
                                <code>{seg.content}</code>
                              </pre>
                            </div>
                          ) : (
                            <div
                              key={idx}
                              dir="auto"
                              className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-800 ${
                                isUrdu ? 'font-urdu' : ''
                              }`}
                            >
                              {seg.content}
                            </div>
                          ),
                        )
                      )}
                    </div>

                    {msg.role === 'assistant' && msg.id !== 'welcome-msg' && msg.text && (
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => speakMessage(msg.text)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>{isUrdu ? 'سنیں' : 'Listen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void copyText(msg.id, msg.text)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {copiedId === msg.id ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : isUrdu ? 'کاپی کریں' : 'Copy'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSaveToTimeline(
                              isUrdu ? 'KHAN AI مشاورت نوٹ' : 'KHAN AI Guidance Note',
                              msg.text.slice(0, 600),
                            );
                            setSavedId(msg.id);
                            setTimeout(() => setSavedId(null), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          {savedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-700" />
                          ) : (
                            <BookmarkPlus className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {savedId === msg.id
                              ? isUrdu
                                ? 'ٹائم لائن میں محفوظ ہو گیا'
                                : 'Saved to Timeline'
                              : isUrdu
                                ? 'ٹائم لائن میں محفوظ کریں'
                                : 'Log to Timeline'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div className="mx-5 mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{chatError}</span>
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="border-t border-slate-200 bg-slate-50 p-4">
              {chatImage && (
                <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={chatImage.previewUrl}
                      alt="Attached screenshot preview"
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <span className="truncate text-xs font-medium text-slate-700" dir="ltr">
                      {chatImage.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatImage(null)}
                    className="p-1.5 text-slate-500 hover:text-red-700"
                    aria-label="Remove attached image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  dir="auto"
                  placeholder={
                    isUrdu
                      ? 'اردو یا انگریزی میں پیغام لکھیں یا مائیک استعمال کریں...'
                      : 'Ask KHAN AI in English or Urdu, paste code, or describe an incident...'
                  }
                  className={`w-full resize-none rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    disabled={isStreaming}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    className={`inline-flex h-[42px] items-center gap-1.5 rounded-md border px-3 text-xs font-medium whitespace-nowrap shrink-0 ${
                      isListening
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isListening ? (isUrdu ? 'روکیں' : 'Stop') : isUrdu ? 'آواز' : 'Voice'}</span>
                  </button>

                  <input
                    ref={chatFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChatFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => chatFileRef.current?.click()}
                    disabled={isStreaming}
                    className="inline-flex h-[42px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{isUrdu ? 'تصویر' : 'Image'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isStreaming || (!inputText.trim() && !chatImage)}
                    className="inline-flex h-[42px] items-center gap-2 rounded-md bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{isUrdu ? 'بھیجیں' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="xl:col-span-4 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className={`text-sm font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'فوری ہنگامی صورتحال منتخب کریں' : 'Quick Emergency Cyber Triage'}
              </h3>
              <p className={`mt-1 text-xs text-slate-500 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu
                  ? 'فوری رہنمائی کے لیے متعلقہ صورتحال پر کلک کریں:'
                  : 'Click a scenario to receive an immediate containment and evidence checklist:'}
              </p>

              <div className="mt-3 space-y-2">
                {EMERGENCY_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => {
                      setAssistantMode('cyber_safety');
                      void sendChatMessage(scenario.prompt[language], 'cyber_safety');
                    }}
                    className={`w-full rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-medium text-slate-800 hover:border-teal-700 hover:bg-white transition-colors disabled:opacity-50 ${
                      isUrdu ? 'font-urdu text-right' : ''
                    }`}
                  >
                    {scenario.label[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className={`text-sm font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'اہم حفاظتی اصول' : 'Core Safety Guardrails'}
              </h3>
              <ul className={`mt-3 space-y-2.5 text-xs text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                <li>
                  {isUrdu
                    ? '1. اصل ثبوت پہلے: واٹس ایپ چیٹس، نمبرز، اسکرین شاٹس اور ٹرانزیکشن آئی ڈیز ہرگز ڈیلیٹ نہ کریں۔'
                    : '1. Preserve Originals First: Do not delete suspect chats, numbers, uncropped screenshots, or payment receipts.'}
                </li>
                <li>
                  {isUrdu
                    ? '2. صرف قانونی راستہ: بینک فراڈ ڈیسک، ایف آئی اے/این سی سی آئی اے (1991) اور آفیشل واٹس ایپ سپورٹ کے ذریعے کارروائی کریں۔'
                    : '2. Lawful Channels Only: Report through your bank fraud desk, FIA/NCCIA (1991), and official platform support.'}
                </li>
                <li>
                  {isUrdu
                    ? '3. اکاؤنٹس کا فوری تحفظ: بینک کارڈ/والٹ لاک کریں، واٹس ایپ 2-Step پن لگائیں اور Linked Devices چیک کریں۔'
                    : '3. Prioritize Containment: Freeze compromised wallets/cards, enable WhatsApp Two-Step Verification, and audit Linked Devices.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          <form
            onSubmit={handleAnalyzeSubmit}
            className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-5 space-y-4"
          >
            <div>
              <h3 className={`text-base font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu
                  ? 'مشکوک میسج یا اسکرین شاٹ درج کریں'
                  : 'Inspect Suspicious Message or Screenshot'}
              </h3>
              <p className={`mt-1 text-xs text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu
                  ? 'دھوکہ دہی کی علامات، اکاؤنٹ تحفظ کے اقدامات اور ثبوت محفوظ کرنے کی فہرست حاصل کریں۔'
                  : 'Paste a suspicious WhatsApp/SMS message or upload an uncropped screenshot for defensive fraud-pattern analysis.'}
              </p>
            </div>

            <div>
              <label
                htmlFor="suspect-message-text"
                className={`block text-xs font-medium text-slate-700 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}
              >
                {isUrdu ? 'مشکوک پیغام کا متن' : 'Suspicious Message Text'}
              </label>
              <textarea
                id="suspect-message-text"
                value={suspectText}
                onChange={(e) => setSuspectText(e.target.value)}
                rows={6}
                dir="auto"
                placeholder={
                  isUrdu
                    ? 'یہاں واٹس ایپ یا SMS میسج پیسٹ کریں (مشکوک لنک پر کلک نہ کریں)...'
                    : 'Paste the suspicious WhatsApp or SMS text here (do not click links)...'
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div>
              <input
                ref={analyzerFileRef}
                type="file"
                accept="image/*"
                onChange={handleAnalyzerFileChange}
                className="hidden"
              />
              {analyzerImage ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={analyzerImage.previewUrl}
                      alt="Screenshot to analyze"
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <span className="truncate text-xs font-medium text-slate-700" dir="ltr">
                      {analyzerImage.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalyzerImage(null)}
                    className="p-1.5 text-slate-500 hover:text-red-700"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => analyzerFileRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-700 hover:border-teal-700 hover:bg-white transition-colors"
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>
                    {isUrdu
                      ? 'چیٹ یا ادائیگی کی رسید کا اسکرین شاٹ اپ لوڈ کریں'
                      : 'Attach Chat or Payment Screenshot (Optional)'}
                  </span>
                </button>
              )}
            </div>

            {analysisError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing || (!suspectText.trim() && !analyzerImage)}
              className="inline-flex w-full h-[42px] items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              <span>
                {isAnalyzing
                  ? isUrdu
                    ? 'تجزیہ جاری ہے...'
                    : 'Analyzing...'
                  : isUrdu
                    ? 'دفاعی تجزیہ کریں'
                    : 'Run Defensive Analysis'}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-6">
            {!analysisResult && !isAnalyzing && (
              <div className="py-12 text-center">
                <ScanSearch className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
                <h4 className={`mt-3 text-sm font-semibold text-slate-800 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'تجزیہ کے نتائج یہاں ظاہر ہوں گے' : 'Structured Risk Report Ready'}
                </h4>
                <p className={`mt-1 text-xs text-slate-500 max-w-md mx-auto ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu
                    ? 'بائیں جانب مشکوک پیغام یا اسکرین شاٹ شامل کر کے دفاعی تجزیہ چلائیں۔'
                    : 'Submit a suspicious message or screenshot on the left to inspect manipulation tactics, immediate security steps, and required evidence.'}
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 py-4">
                <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div className="space-y-5">
                {(() => {
                  const badge = riskBadgeStyle(analysisResult.riskLevel);
                  const RiskIcon = badge.Icon;
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <div className="text-xs text-slate-500">
                          {isUrdu ? 'اسکیم کی قسم' : 'Detected Pattern'}
                        </div>
                        <h3 className={`mt-0.5 text-lg font-semibold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
                          {analysisResult.scamCategory}
                        </h3>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${badge.className}`}
                      >
                        <RiskIcon className="h-4 w-4 shrink-0" />
                        <span>{badge.text}</span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <h4 className={`text-sm font-semibold text-slate-900 mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'شناخت شدہ خطرے کی علامات (Red Flags)' : 'Observed Red Flags'}
                  </h4>
                  <ul className={`space-y-1.5 text-sm text-slate-700 list-disc ps-5 ${isUrdu ? 'font-urdu' : ''}`}>
                    {analysisResult.redFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold text-slate-900 mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'فوری اکاؤنٹ تحفظ کے اقدامات' : 'Immediate Account Security Steps'}
                  </h4>
                  <ol className={`space-y-1.5 text-sm text-slate-700 list-decimal ps-5 ${isUrdu ? 'font-urdu' : ''}`}>
                    {analysisResult.immediateSecuritySteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold text-slate-900 mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'محفوظ رکھنے کے لیے اصل شواہد' : 'Original Evidence to Preserve'}
                  </h4>
                  <ul className={`space-y-1.5 text-sm text-slate-700 list-disc ps-5 ${isUrdu ? 'font-urdu' : ''}`}>
                    {analysisResult.evidenceToPreserve.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className={`text-xs font-semibold text-slate-700 mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'قانونی اور آفیشل کارروائی کا خلاصہ' : 'Official Action Summary'}
                  </div>
                  <p className={`text-sm text-slate-700 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                    {analysisResult.officialActionSummary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveToTimeline(
                        `${isUrdu ? 'اسکیم تجزیہ:' : 'Scam Analysis:'} ${analysisResult.scamCategory}`,
                        `${analysisResult.officialActionSummary} | Red flags: ${analysisResult.redFlags.join('; ')}`,
                      );
                      setSavedAnalysis(true);
                    }}
                    className="inline-flex h-[40px] items-center gap-2 rounded-md bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
                  >
                    {savedAnalysis ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                    <span>
                      {savedAnalysis
                        ? isUrdu
                          ? 'کیس ٹائم لائن میں محفوظ ہو گیا'
                          : 'Saved to Timeline'
                        : isUrdu
                          ? 'نتائج کیس ٹائم لائن میں شامل کریں'
                          : 'Save Findings to Case Timeline'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenVault}
                    className="inline-flex h-[40px] items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <span>{isUrdu ? 'شواہد والٹ کھولیں' : 'Open Evidence Vault'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
