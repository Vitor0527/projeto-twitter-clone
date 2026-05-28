/** Chaves do localStorage com prefixo VG (nome do site). */

export const VG_KEYS = {
  activeAccount: 'vg-active-account',
  accountsIndex: 'vg-accounts',
  theme: 'vg-theme',
};

const LEGACY_PREFIXES = ['pulse-', 'nexus-'];

function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
}

export function tokenKey(username) {
  return `vg-token-${normalizeUsername(username)}`;
}

export function userKey(username) {
  return `vg-user-${normalizeUsername(username)}`;
}

function readAccountsIndex() {
  try {
    const raw = localStorage.getItem(VG_KEYS.accountsIndex);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccountsIndex(usernames) {
  const unique = [...new Set(usernames.map((u) => normalizeUsername(u)).filter(Boolean))];
  localStorage.setItem(VG_KEYS.accountsIndex, JSON.stringify(unique));
}

function rememberAccount(username) {
  const key = normalizeUsername(username);
  if (!key) return;
  const index = readAccountsIndex();
  if (!index.includes(key)) {
    writeAccountsIndex([...index, key]);
  }
}

export function getActiveUsername() {
  const active = localStorage.getItem(VG_KEYS.activeAccount);
  return active ? normalizeUsername(active) : null;
}

export function getActiveToken() {
  const active = getActiveUsername();
  if (!active) return null;
  return localStorage.getItem(tokenKey(active));
}

export function getCachedUser(username) {
  const raw = localStorage.getItem(userKey(username));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getActiveUser() {
  const active = getActiveUsername();
  if (!active) return null;
  return getCachedUser(active);
}

export function saveAccountSession(user, token) {
  if (!user?.username || !token) return;
  const username = normalizeUsername(user.username);
  localStorage.setItem(tokenKey(username), token);
  localStorage.setItem(userKey(username), JSON.stringify(user));
  localStorage.setItem(VG_KEYS.activeAccount, username);
  rememberAccount(username);
}

export function setActiveAccount(username) {
  const key = normalizeUsername(username);
  if (!key) return;
  localStorage.setItem(VG_KEYS.activeAccount, key);
}

export function clearActiveSession() {
  localStorage.removeItem(VG_KEYS.activeAccount);
}

export function removeAccount(username) {
  const key = normalizeUsername(username);
  if (!key) return;
  localStorage.removeItem(tokenKey(key));
  localStorage.removeItem(userKey(key));
  writeAccountsIndex(readAccountsIndex().filter((item) => item !== key));
  if (getActiveUsername() === key) {
    clearActiveSession();
  }
}

export function listSavedAccounts() {
  return readAccountsIndex()
    .map((username) => {
      const user = getCachedUser(username);
      if (!user) return null;
      return {
        username,
        user,
        hasToken: Boolean(localStorage.getItem(tokenKey(username))),
      };
    })
    .filter(Boolean);
}

export function switchActiveAccount(username) {
  const key = normalizeUsername(username);
  if (!key || !localStorage.getItem(tokenKey(key))) return false;
  localStorage.setItem(VG_KEYS.activeAccount, key);
  return true;
}

function migratePulseAuth() {
  const legacyToken = localStorage.getItem('pulse-auth-token');
  const legacyUserRaw = localStorage.getItem('pulse-auth-user');
  if (!legacyToken || !legacyUserRaw) return;

  try {
    const user = JSON.parse(legacyUserRaw);
    if (user?.username) {
      saveAccountSession(user, legacyToken);
    }
  } catch {
    // ignorar JSON invalido
  }
}

function migratePulseTheme() {
  const legacyTheme = localStorage.getItem('pulse-theme');
  if (legacyTheme && !localStorage.getItem(VG_KEYS.theme)) {
    localStorage.setItem(VG_KEYS.theme, legacyTheme);
  }
}

function removeLegacyKeys() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

let migrated = false;

export function migrateLegacyStorage() {
  if (migrated) return;
  migrated = true;
  migratePulseAuth();
  migratePulseTheme();
  removeLegacyKeys();
}
