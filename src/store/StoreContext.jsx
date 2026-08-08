// App-wide store: session + per-user state, persisted to localStorage.
// React Context + useReducer (PRD §9). Action helpers wrap the pure logic in
// progress.js and return a summary ({ xp, newBadges, ... }) so callers can fire
// toasts. Persistence is debounced.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  getSession,
  login as authLogin,
  loginAsDemo as authLoginDemo,
  logout as authLogout,
  loadUserState,
  saveUserState,
  displayNameFor,
} from "../auth/auth.js";
import { defaultState } from "./defaults.js";
import * as P from "./progress.js";

const StoreContext = createContext(null);

const initial = {
  session: null, // { username, loggedInAt }
  state: null, // per-user state or null when logged out
};

function reducer(prev, action) {
  switch (action.type) {
    case "hydrate":
      return { session: action.session, state: action.state };
    case "setState":
      return { ...prev, state: action.state };
    case "logout":
      return { session: null, state: null };
    default:
      return prev;
  }
}

export function StoreProvider({ children }) {
  const [store, dispatch] = useReducer(reducer, initial, () => {
    const session = getSession();
    if (!session) return initial;
    return { session, state: loadUserState(session.username) || defaultState() };
  });

  // Debounced persistence.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!store.session || !store.state) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserState(store.session.username, store.state);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [store.session, store.state]);

  const api = useMemo(() => {
    const setState = (next) => dispatch({ type: "setState", state: next });

    return {
      login(username, password) {
        const res = authLogin(username, password);
        if (res.ok) dispatch({ type: "hydrate", session: res.session, state: res.state });
        return res;
      },
      loginAsDemo() {
        const res = authLoginDemo();
        if (res.ok) dispatch({ type: "hydrate", session: res.session, state: res.state });
        return res;
      },
      logout() {
        authLogout();
        dispatch({ type: "logout" });
      },

      // --- gameplay actions (return change summaries) ---
      recordAttempt(payload) {
        const summary = P.recordAttempt(store.state, payload);
        setState(summary.state);
        return summary;
      },
      completeScenario(scenarioId, avg) {
        const summary = P.completeScenario(store.state, scenarioId, avg);
        setState(summary.state);
        return summary;
      },
      grantReviewBonus() {
        const summary = P.grantReviewBonus(store.state);
        setState(summary.state);
        return summary;
      },
      setSpeedBest(count) {
        const summary = P.setSpeedBest(store.state, count);
        setState(summary.state);
        return summary;
      },
      markForReview(signId) {
        const next = JSON.parse(JSON.stringify(store.state));
        const s = next.signs[signId] || {
          best: 0, attempts: 0, box: 1, nextDue: 0, history: [],
        };
        s.box = 1;
        s.nextDue = Date.now();
        next.signs[signId] = s;
        setState(next);
      },

      updateSettings(patch) {
        const next = { ...store.state, settings: { ...store.state.settings, ...patch } };
        setState(next);
      },
      resetAll() {
        const fresh = defaultState();
        setState(fresh);
        if (store.session) saveUserState(store.session.username, fresh);
      },
    };
  }, [store.state, store.session]);

  const value = useMemo(
    () => ({
      session: store.session,
      state: store.state,
      authed: Boolean(store.session),
      displayName: store.session ? displayNameFor(store.session.username) : "",
      ...api,
    }),
    [store.session, store.state, api],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
