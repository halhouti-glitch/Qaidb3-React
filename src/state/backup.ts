import { sanitizeState, type PersistedState } from './persistedState';

// User-initiated backup of the full persisted state (profiles, recent games,
// settings). Survives a PWA reinstall: the user exports a JSON file, then
// imports it on the fresh install. The file wraps the state in an envelope so
// future readers can branch on the schema version, but parseBackup also
// accepts a bare PersistedState for resilience.

const BACKUP_FORMAT = 'qaid-backup';
const BACKUP_SCHEMA = 1;

type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  schema: number;
  exportedAt: number;
  data: PersistedState;
};

export function serializeBackup(
  state: PersistedState,
  now = Date.now(),
): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    schema: BACKUP_SCHEMA,
    exportedAt: now,
    data: state,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parse a backup file's text into a usable PersistedState.
 *
 * Accepts either the wrapped envelope (`{ format, schema, data }`) or a bare
 * PersistedState object. Returns null when the text isn't valid JSON or isn't
 * an object — the caller surfaces that as "not a valid backup". A parseable
 * payload is always run through sanitizeState, so a partially-corrupt file
 * still yields a safe state rather than crashing the app on load.
 */
export function parseBackup(text: string): PersistedState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const obj = parsed as Record<string, unknown>;
  const raw =
    obj.format === BACKUP_FORMAT && 'data' in obj ? obj.data : obj;
  return sanitizeState(raw);
}

export function backupFilename(now = new Date()): string {
  return `qaid-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(state: PersistedState): void {
  const blob = new Blob([serializeBackup(state)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
