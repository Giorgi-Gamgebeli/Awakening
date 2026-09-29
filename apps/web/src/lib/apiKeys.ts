export type ApiKeyPurpose = "work" | "translation";

export type ApiKeyEntry = Readonly<{
  id: string;
  provider: string;
  key: string;
}>;

export type ApiKeyStore = Readonly<{
  work: ApiKeyEntry[];
  translation: ApiKeyEntry[];
}>;

const STORAGE_KEY = "awakening.apiKeys.v1";

const emptyStore: ApiKeyStore = { work: [], translation: [] };

function isEntry(value: unknown): value is ApiKeyEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.provider === "string" &&
    typeof entry.key === "string"
  );
}

export function loadApiKeys(): ApiKeyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw) as Partial<Record<ApiKeyPurpose, unknown>>;
    const work = Array.isArray(parsed.work) ? parsed.work.filter(isEntry) : [];
    const translation = Array.isArray(parsed.translation)
      ? parsed.translation.filter(isEntry)
      : [];
    return { work, translation };
  } catch {
    return emptyStore;
  }
}

export function saveApiKeys(store: ApiKeyStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — keys stay in memory for this session.
  }
}

export function createApiKey(provider: string, key: string): ApiKeyEntry {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    provider: provider.trim(),
    key,
  };
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "•".repeat(Math.max(key.length, 4));
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
