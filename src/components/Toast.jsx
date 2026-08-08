// Toast queue — bottom-center, auto-dismiss 3s (PRD §10). Used for XP nudges
// and badge unlocks. aria-live so screen readers announce them.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { BADGES } from "../store/progress.js";

const ToastContext = createContext(null);

let idc = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message, opts = {}) => {
      const id = ++idc;
      setToasts((t) => [...t, { id, message, ...opts }]);
      timers.current[id] = setTimeout(() => dismiss(id), opts.duration || 3000);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toast: (msg, opts) => push(msg, opts),
      badge: (msg) => push(msg, { variant: "badge", icon: "🏅" }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast${t.variant === "badge" ? " toast--badge" : ""}`}
            role="status"
          >
            {t.icon && <span aria-hidden="true">{t.icon}</span>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Shared helper: given a change summary, fire XP + badge toasts.
export function useAwardToasts() {
  const { toast, badge } = useToast();
  return (summary) => {
    if (!summary) return;
    if (summary.xp) toast(`+${summary.xp} XP`, { icon: "✦" });
    (summary.newBadges || []).forEach((id) => {
      badge(`Badge unlocked — ${BADGES[id]?.label || id}`);
    });
  };
}
