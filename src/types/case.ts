export type Language = 'en' | 'ur';

export type WorkspaceTab = 'assistant' | 'security' | 'evidence' | 'complaint';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  details: string;
}

export interface EvidenceArtifact {
  id: string;
  type: 'chat_export' | 'screenshot' | 'transaction_id' | 'bank_statement' | 'profile_record';
  referenceCode: string;
  description: string;
  capturedAt: string;
  preservedOriginal: boolean;
}

export interface IncidentProfile {
  caseId: string;
  complainantName: string;
  complainantContact: string;
  scamType: string;
  suspectPhone: string;
  suspectAccount: string;
  amountLost: string;
  currency: string;
  incidentDate: string;
  summary: string;
}

export interface SecurityCheckState {
  [itemId: string]: {
    completed: boolean;
    completedAt?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  imagePreviewUrl?: string;
  imageMimeType?: string;
  imageBase64?: string;
}

export interface ScamAnalysisResult {
  riskLevel: 'high' | 'medium' | 'low';
  scamCategory: string;
  redFlags: string[];
  immediateSecuritySteps: string[];
  evidenceToPreserve: string[];
  officialActionSummary: string;
}

export interface GeneratedComplaint {
  subjectLine: string;
  recipientHeader: string;
  formalLetter: string;
  attachmentsChecklist: string[];
  submissionNotes: string;
  generatedAt: string;
  authority: string;
  language: Language;
}

export interface CaseWorkspaceState {
  incident: IncidentProfile;
  timeline: TimelineEvent[];
  evidence: EvidenceArtifact[];
  securityChecks: SecurityCheckState;
  messages: ChatMessage[];
  lastComplaint: GeneratedComplaint | null;
}
