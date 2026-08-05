import { newId } from '@/lib/id';

/**
 * A thin BroadcastChannel wrapper for the multi-tab autosave guard (PLAN §4.4). The
 * store emits `saved`/`deleted` events; the autosave hook in each *other* tab reacts
 * (flagging a conflict, or dropping a deleted study). Degrades to a no-op where
 * BroadcastChannel is unavailable (older browsers, some test envs).
 */

export interface StudyEvent {
  type: 'saved' | 'deleted';
  id: string;
  updatedAt?: string;
  /** Per-tab id so a tab ignores the echo of its own writes. */
  senderId: string;
}

const CHANNEL_NAME = 'qth/studies';

/** Stable for the life of this tab/module instance. */
export const SENDER_ID = newId();

let channel: BroadcastChannel | null = null;
let unavailable = false;

function getChannel(): BroadcastChannel | null {
  if (channel || unavailable) return channel;
  try {
    if (typeof BroadcastChannel === 'undefined') {
      unavailable = true;
      return null;
    }
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    unavailable = true;
    channel = null;
  }
  return channel;
}

export function postStudyEvent(ev: Omit<StudyEvent, 'senderId'>): void {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage({ ...ev, senderId: SENDER_ID } satisfies StudyEvent);
  } catch {
    /* best-effort */
  }
}

/** Subscribe to events from *other* tabs. Returns an unsubscribe function. */
export function onStudyEvent(handler: (ev: StudyEvent) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (e: MessageEvent) => {
    const data = e.data as StudyEvent | undefined;
    if (!data || data.senderId === SENDER_ID) return;
    handler(data);
  };
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}
