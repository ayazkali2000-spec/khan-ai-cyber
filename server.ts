import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KHAN_AI_SYSTEM_INSTRUCTION = `You are KHAN AI, a defensive cybersecurity, digital safety, and legal evidence-organization assistant (Developed by: ایاز احمد خان).

Your strict operational mandate:
1. Defensive and Lawful Only: Provide guidance strictly on fraud prevention, account protection, preserving original evidence, and filing complaints through official channels (such as FIA Cyber Crime / NCCIA 1991, State Bank / Banking Mohtasib, commercial bank & mobile wallet fraud helplines like JazzCash/Easypaisa, PTA/SIM carrier support, and official WhatsApp Support). NEVER provide hacking tools, credential theft methods, tracking/stalking exploits, harassment/doxxing, or vigilante/unlawful retaliation steps. If a user asks to hack back, trace a scammer illegally, or retaliate, firmly refuse and pivot immediately to lawful evidence preservation and official cybercrime reporting.
2. Evidence Preservation First: Always remind users to keep original WhatsApp chat logs (use Export Chat without editing), suspect phone numbers and profile screenshots, uncropped payment/receipt screenshots, transaction IDs (TID/IBAN/Reference numbers), exact dates/timestamps, and official bank or digital wallet statements intact without deleting or altering records.
3. Account Security Priority: Prioritize immediate containment steps to protect bank accounts, mobile wallets, passwords/PINs, SIM cards, email recovery accounts, and WhatsApp security (Two-Step Verification PIN, reviewing Linked Devices, blocking suspicious sessions) to prevent further loss.
4. Structured & Practical Output: Respond clearly in Urdu or English matching the user's language (if the user writes in Urdu or Roman Urdu, respond clearly in Urdu script unless they explicitly ask for English; if they write in English, respond in English). Use concise, scannable checklists, numbered steps, timelines, and clear sections without unnecessary filler.`;

const MODEL_NAME = 'gemini-4-hydrogen';

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Please check Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGenAIError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : 'Unexpected server error.';
  if (rawMessage.includes('GEMINI_API_KEY')) {
    return { status: 400, message: rawMessage };
  }
  if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('403')) {
    return {
      status: 403,
      message: 'API key authorization failed. Please verify your API key in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit reached. Please wait a moment before sending another request.',
    };
  }
  return { status: 500, message: rawMessage };
}

interface IncomingChatMessage {
  role: 'user' | 'assistant';
  text: string;
  image?: {
    mimeType: string;
    data: string;
  };
}

type AssistantModeId = 'general' | 'coding' | 'cyber_safety' | 'image_prompt';

function getModeInstruction(mode: AssistantModeId): string {
  switch (mode) {
    case 'general':
      return `Active Mode: General Chat.
Be warm, fast, and concise. For simple everyday greetings (like "hi", "salam", "how are you"), reply naturally in 1-2 short sentences with zero robotic review commentary. For complex questions, provide structured, practical answers in English or Urdu matching the user's language.`;
    case 'coding':
      return `Active Mode: Coding & Debugging Assistant.
Provide clean, copy-ready code inside fenced markdown code blocks (\`\`\`kotlin, \`\`\`ts, \`\`\`python, etc.). Explain root causes concisely and avoid filler.`;
    case 'image_prompt':
      return `Active Mode: Image Prompt Helper.
Craft detailed, domain-authentic image generation prompts specifying subject, environment, lighting, lens/camera angle, texture, and mood. Provide one primary ready-to-copy prompt and two concise variations.`;
    case 'cyber_safety':
    default:
      return KHAN_AI_SYSTEM_INSTRUCTION;
  }
}

interface ChatRequestBody {
  messages?: IncomingChatMessage[];
  language?: 'en' | 'ur';
  mode?: AssistantModeId;
  caseContext?: string;
}

interface AnalyzeRequestBody {
  messageText?: string;
  image?: {
    mimeType: string;
    data: string;
  };
  language?: 'en' | 'ur';
}

interface ComplaintRequestBody {
  authority?: string;
  language?: 'en' | 'ur';
  complainantName?: string;
  complainantContact?: string;
  incidentType?: string;
  incidentSummary?: string;
  suspectDetails?: string;
  financialLoss?: string;
  transactionIds?: string;
  timelineText?: string;
  evidenceListText?: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'KHAN AI Workbench' });
  });

  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    const body = (req.body || {}) as ChatRequestBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const language = body.language === 'ur' ? 'ur' : 'en';
    const mode: AssistantModeId =
      body.mode === 'general' ||
      body.mode === 'coding' ||
      body.mode === 'image_prompt' ||
      body.mode === 'cyber_safety'
        ? body.mode
        : 'cyber_safety';
    const caseContext = typeof body.caseContext === 'string' ? body.caseContext.trim() : '';

    if (messages.length === 0) {
      res.status(400).json({ error: 'At least one message is required.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    try {
      const ai = getGenAIClient();

      const contents = messages.map((msg) => {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
        if (msg.image && msg.image.data && msg.image.mimeType) {
          parts.push({
            inlineData: {
              mimeType: msg.image.mimeType,
              data: msg.image.data,
            },
          });
        }
        parts.push({ text: msg.text || 'Please analyze the attached image.' });
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

      const langDirective =
        language === 'ur'
          ? 'The interface language is Urdu. Respond in clear, natural Urdu script unless the user explicitly writes in English and asks for English.'
          : 'The interface language is English. Respond in clear, structured English unless the user writes in Urdu, in which case match their language.';

      const contextDirective =
        mode === 'cyber_safety' && caseContext
          ? `\n\nActive Case Context logged by the user in their Evidence Vault (reference only what is relevant):\n${caseContext}`
          : '';

      const baseInstruction =
        mode === 'cyber_safety'
          ? KHAN_AI_SYSTEM_INSTRUCTION
          : `You are KHAN AI (Developed by: ایاز احمد خان), a fast, lightweight bilingual AI companion.\n${getModeInstruction(mode)}\nAlways uphold defensive safety and never generate harmful, harassing, or unlawful exploit material.`;

      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: `${baseInstruction}\n\n${langDirective}${contextDirective}`,
        },
      });

      for await (const chunk of stream) {
        const textChunk = chunk.text ?? '';
        if (textChunk) {
          res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      const formatted = formatGenAIError(err);
      res.write(`data: ${JSON.stringify({ error: formatted.message, status: formatted.status })}\n\n`);
      res.end();
    }
  });

  app.post('/api/assistant/analyze', async (req: Request, res: Response) => {
    const body = (req.body || {}) as AnalyzeRequestBody;
    const messageText = typeof body.messageText === 'string' ? body.messageText.trim() : '';
    const language = body.language === 'ur' ? 'ur' : 'en';
    const hasImage = Boolean(body.image && body.image.data && body.image.mimeType);

    if (!messageText && !hasImage) {
      res.status(400).json({ error: 'Provide suspicious message text or a screenshot image to analyze.' });
      return;
    }

    try {
      const ai = getGenAIClient();
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (hasImage && body.image) {
        parts.push({
          inlineData: {
            mimeType: body.image.mimeType,
            data: body.image.data,
          },
        });
      }

      const promptText =
        language === 'ur'
          ? `Analyze this suspicious WhatsApp/SMS/online message or screenshot strictly from a defensive cybersecurity and fraud-prevention perspective. Respond in clear Urdu script.\n\nSuspicious content:\n${messageText || '[See attached screenshot]'}`
          : `Analyze this suspicious WhatsApp/SMS/online message or screenshot strictly from a defensive cybersecurity and fraud-prevention perspective. Respond in clear English.\n\nSuspicious content:\n${messageText || '[See attached screenshot]'}`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          systemInstruction: KHAN_AI_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                description: 'Risk severity: high, medium, or low',
              },
              scamCategory: {
                type: Type.STRING,
                description: 'Concise category name of the suspected scam or safety issue.',
              },
              redFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific manipulation tactics, urgency cues, phishing links, or OTP/financial red flags observed.',
              },
              immediateSecuritySteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Immediate defensive actions to protect bank accounts, wallets, WhatsApp 2FA, and credentials.',
              },
              evidenceToPreserve: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exact original records, screenshots, headers, numbers, and transaction IDs to preserve intact.',
              },
              officialActionSummary: {
                type: Type.STRING,
                description: 'Concise lawful next-step guidance and official reporting channel recommendation.',
              },
            },
            required: [
              'riskLevel',
              'scamCategory',
              'redFlags',
              'immediateSecuritySteps',
              'evidenceToPreserve',
              'officialActionSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGenAIError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/complaint/draft', async (req: Request, res: Response) => {
    const body = (req.body || {}) as ComplaintRequestBody;
    const language = body.language === 'ur' ? 'ur' : 'en';
    const authority = typeof body.authority === 'string' && body.authority.trim() ? body.authority.trim() : 'Cyber Crime Investigation Agency (FIA / NCCIA)';

    if (!body.incidentSummary?.trim() && !body.transactionIds?.trim() && !body.suspectDetails?.trim()) {
      res.status(400).json({ error: 'Please provide incident details, suspect identifiers, or transaction records before drafting.' });
      return;
    }

    try {
      const ai = getGenAIClient();

      const prompt = `Draft a formal, factual, lawful complaint submission addressed to: ${authority}.
Output Language: ${language === 'ur' ? 'Formal Urdu (اردو) suitable for official cybercrime / banking complaints in Pakistan (keep exact numbers, IBANs, Transaction IDs, and dates accurate).' : 'Formal English suitable for official cybercrime agencies, banks, and financial regulators.'}

Case Facts provided by user:
- Complainant Name: ${body.complainantName?.trim() || '[Complainant Full Name]'}
- Complainant Contact: ${body.complainantContact?.trim() || '[Complainant Phone / Email]'}
- Incident Category: ${body.incidentType?.trim() || 'Online / WhatsApp Financial Fraud'}
- Total Financial Loss: ${body.financialLoss?.trim() || 'Not specified / Attempted fraud'}
- Suspect Phone / Account / IBAN / Profile Details: ${body.suspectDetails?.trim() || 'Not provided'}
- Transaction IDs / Reference Numbers: ${body.transactionIds?.trim() || 'None logged'}
- Incident Summary: ${body.incidentSummary?.trim() || 'See timeline'}
- Chronological Timeline:\n${body.timelineText?.trim() || 'No timeline entries added'}
- Preserved Evidence List:\n${body.evidenceListText?.trim() || 'Original chat logs and screenshots preserved'}

Ensure the draft is strictly factual, polite, structured with clear sections (Incident Overview, Chronology, Suspect Identifiers & Financial Trail, Requested Lawful Action such as fund hold/lien marking & investigation, and Declaration of Preserved Original Evidence). Never invent fake facts or fake transaction IDs not present above; use bracketed placeholders like [CNIC Number] only where standard identity fields are missing.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: KHAN_AI_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectLine: {
                type: Type.STRING,
                description: 'Formal subject line for the complaint email or letter.',
              },
              recipientHeader: {
                type: Type.STRING,
                description: 'Formal addressee block (e.g., To The Director / Fraud Investigation Unit).',
              },
              formalLetter: {
                type: Type.STRING,
                description: 'Complete ready-to-submit formal complaint text with clear paragraphs and numbered facts.',
              },
              attachmentsChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ordered list of original documents and evidence files the user must attach.',
              },
              submissionNotes: {
                type: Type.STRING,
                description: 'Practical official submission instructions and follow-up tracking advice.',
              },
            },
            required: ['subjectLine', 'recipientHeader', 'formalLetter', 'attachmentsChecklist', 'submissionNotes'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGenAIError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`KHAN AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KHAN AI server:', err);
  process.exit(1);
});
