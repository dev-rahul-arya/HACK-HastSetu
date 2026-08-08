// Session + per-user persistence helpers (PRD §4.0, §9).
// Pure localStorage layer — no React. StoreContext wraps this.

import { findUser, userByName } from "./users.js";
import { DATA_VERSION, defaultState, seedFor } from "../store/defaults.js";

const SESSION_KEY = "hastsetu.session";

export function userStateKey(username) {
  return `hastsetu.${DATA_VERSION}.${username}`;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadUserState(username) {
  try {
    const raw = localStorage.getItem(userStateKey(username));
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to default */
  }
  return null;
}

export function saveUserState(username, state) {
  try {
    localStorage.setItem(userStateKey(username), JSON.stringify(state));
  } catch {
    /* storage full / disabled — demo tolerates this */
  }
}

/**
 * Attempt a login. Returns { ok, session, state } or { ok:false, error }.
 * Seeds a new account's state on first login (demo account gets lived-in data).
 */
export function login(username, password) {
  const user = findUser(username, password);
  if (!user) {
    return {
      ok: false,
      error:
        "That username or password doesn't match — try demo / demo123.",
    };
  }
  const uname = user.username;
  let state = loadUserState(uname);
  if (!state) {
    state = seedFor(user.seed);
    saveUserState(uname, state);
  }
  const session = { username: uname, loggedInAt: Date.now() };
  setSession(session);
  return { ok: true, session, state, user };
}

/** One-click demo login (never fails). */
export function loginAsDemo() {
  return login("demo", "demo123");
}

export function logout() {
  clearSession(); // clears session only, never progress
}

export function displayNameFor(username) {
  return userByName(username)?.name || username;
}

export function ensureState(username) {
  return loadUserState(username) || defaultState();
}
