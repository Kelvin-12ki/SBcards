import type { Card } from '@/types/card';
import { vibrateLight } from './haptics';

function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateVCard(card: Card): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  // Full Name
  if (card.fullName) {
    lines.push(`FN:${escapeVCardText(card.fullName)}`);
    // Structured name: N:Last;First;Middle;Prefix;Suffix
    const parts = card.fullName.trim().split(/\s+/);
    const first = parts.length > 1 ? parts[0] : '';
    const last = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '';
    lines.push(`N:${escapeVCardText(last)};${escapeVCardText(first)};;;`);
  }

  // Company & Title
  if (card.company) lines.push(`ORG:${escapeVCardText(card.company)}`);
  if (card.role) lines.push(`TITLE:${escapeVCardText(card.role)}`);

  // Contact info
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${card.email}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${card.phone}`);

  // Website
  if (card.website) {
    const url = card.website.startsWith('http') ? card.website : `https://${card.website}`;
    lines.push(`URL:${url}`);
  }

  // Photo (as URL reference)
  if (card.avatarUrl && !card.avatarUrl.startsWith('data:')) {
    lines.push(`PHOTO;VALUE=URI:${card.avatarUrl}`);
  }

  // Notes (skills + interests + headline)
  const noteParts: string[] = [];
  if (card.headline) noteParts.push(card.headline);
  if (card.skills && card.skills.length > 0) {
    noteParts.push(`Skills: ${card.skills.map((s) => s.name).join(', ')}`);
  }
  if (card.interests && card.interests.length > 0) {
    noteParts.push(`Interests: ${card.interests.map((i) => i.name).join(', ')}`);
  }
  if (noteParts.length > 0) {
    // Join with a real newline so escapeVCardText emits proper vCard \n line breaks
    lines.push(`NOTE:${escapeVCardText(noteParts.join('\n'))}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(card: Card, filename?: string): void {
  const vcf = generateVCard(card);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const name = (filename || card.fullName || 'contact')
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  vibrateLight();
}
