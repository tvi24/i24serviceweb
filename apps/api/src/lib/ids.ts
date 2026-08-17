import { randomUUID } from 'node:crypto';

export function uuid(): string {
  return randomUUID();
}

let ticketSeqFallback = 1;
export function makeTicketId(seq: number): string {
  const year = new Date().getFullYear();
  return `INC-${year}-${String(seq).padStart(6, '0')}`;
}

export function nextFallbackSeq(): number {
  ticketSeqFallback += 1;
  return ticketSeqFallback;
}
