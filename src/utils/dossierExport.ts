import { SECURITY_CHECKLIST_ITEMS } from '../data/presets';
import type { CaseWorkspaceState } from '../types/case';

export function buildCaseDossierText(state: CaseWorkspaceState): string {
  const { incident, timeline, evidence, securityChecks, lastComplaint } = state;

  const lines: string[] = [
    '====================================================================',
    'KHAN AI — LAWFUL EVIDENCE & INCIDENT DOSSIER',
    'Developed by: ایاز احمد خان',
    '====================================================================',
    `Case Reference : ${incident.caseId}`,
    `Generated At   : ${new Date().toISOString()}`,
    `Incident Date  : ${incident.incidentDate || 'Not specified'}`,
    `Category       : ${incident.scamType || 'Not specified'}`,
    '',
    '1. COMPLAINANT & INCIDENT SUMMARY',
    '--------------------------------------------------------------------',
    `Complainant    : ${incident.complainantName || '[Not entered]'}`,
    `Contact        : ${incident.complainantContact || '[Not entered]'}`,
    `Financial Loss : ${incident.amountLost ? `${incident.currency} ${incident.amountLost}` : 'None / Not specified'}`,
    `Suspect Phone  : ${incident.suspectPhone || '[Not entered]'}`,
    `Suspect Account: ${incident.suspectAccount || '[Not entered]'}`,
    `Summary        :\n${incident.summary || '[No written summary provided]'}`,
    '',
    '2. CHRONOLOGICAL TIMELINE',
    '--------------------------------------------------------------------',
  ];

  if (timeline.length === 0) {
    lines.push('No timeline events logged.');
  } else {
    timeline.forEach((ev, idx) => {
      lines.push(`${idx + 1}. [${ev.timestamp}] ${ev.title}`);
      if (ev.details) lines.push(`   ${ev.details}`);
    });
  }

  lines.push('', '3. PRESERVED ORIGINAL EVIDENCE LOG', '--------------------------------------------------------------------');
  if (evidence.length === 0) {
    lines.push('No evidence artifacts logged.');
  } else {
    evidence.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. [${item.type.toUpperCase()}] Ref: ${item.referenceCode || 'N/A'} | Captured: ${item.capturedAt} | Original Intact: ${item.preservedOriginal ? 'YES' : 'VERIFY'}`,
      );
      lines.push(`   ${item.description}`);
    });
  }

  lines.push('', '4. ACCOUNT SECURITY & CONTAINMENT ACTIONS', '--------------------------------------------------------------------');
  SECURITY_CHECKLIST_ITEMS.forEach((item) => {
    const status = securityChecks[item.id]?.completed
      ? `[DONE @ ${securityChecks[item.id]?.completedAt || 'Recorded'}]`
      : '[PENDING]';
    lines.push(`${status} ${item.title.en}`);
  });

  if (lastComplaint) {
    lines.push(
      '',
      '5. GENERATED OFFICIAL COMPLAINT DRAFT',
      '--------------------------------------------------------------------',
      `Authority : ${lastComplaint.authority}`,
      `Subject   : ${lastComplaint.subjectLine}`,
      '',
      lastComplaint.recipientHeader,
      '',
      lastComplaint.formalLetter,
    );
  }

  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
