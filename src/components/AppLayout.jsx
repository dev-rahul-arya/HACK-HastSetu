// Authenticated app shell: a left sidebar on desktop, a bottom tab bar on
// mobile (with a slim top bar for brand + account). Renders the active route
// via <Outlet/>. Public routes (Landing, Login) don't use this shell.

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import {
  HomeIcon, LearnIcon, PracticeIcon, ConverseIcon, ProgressIcon,
  SettingsIcon, LogoutIcon, FlameIcon,
} from "./icons.jsx";

const NAV = [
  { to: "/dashboard", label: "Home", Icon: HomeIcon, end: true },
  { to: "/learn", label: "Learn", Icon: LearnIcon },
  { to: "/practice", label: "Practice", Icon: PracticeIcon },
  { to: "/converse", label: "Converse", Icon: ConverseIcon },
  { to: "/progress", label: "Progress", Icon: ProgressIcon },
];

function StreakChip({ count }) {
  return (
    <div className="chip-streak" title={`${count}-day streak`}>
      <FlameIcon size={16} />
      <span className="mono">{count}</span>
      <span className="sr-only">day streak</span>
    </div>
  );
}

function AccountMenu({ up = false }) {
  const { session, displayName, logout } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const initial = (displayName || session.username || "?")[0].toUpperCase();

  return (
    <div className="account" ref={ref}>
      <button type="button" className="account__btn" aria-haspopup="menu"
        aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="account__circle" aria-hidden="true">{initial}</span>
        <span className="account__name">{session.username}</span>
      </button>
      {open && (
        <div className={"account__menu" + (up ? " account__menu--up" : "")} role="menu">
          <button type="button" role="menuitem" className="account__item"
            onClick={() => { setOpen(false); navigate("/settings"); }}>
            <SettingsIcon size={18} /> Settings
          </button>
          <button type="button" role="menuitem" className="account__item"
            onClick={() => { setOpen(false); logout(); navigate("/"); }}>
            <LogoutIcon size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { state } = useStore();
  const streak = state?.streak?.count || 0;

  return (
    <div className="app">
      {/* Desktop sidebar */}
      <aside className="side">
        <NavLink to="/dashboard" className="side__brand">
          <span className="nav__mark" aria-hidden="true">हस</span>
          <span className="side__word">HastSetu</span>
        </NavLink>

        <nav className="side__nav" aria-label="Primary">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => "side__link" + (isActive ? " is-active" : "")}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side__foot">
          <StreakChip count={streak} />
          <AccountMenu up />
        </div>
      </aside>

      <div className="app__main">
        {/* Mobile top bar */}
        <header className="topbar">
          <NavLink to="/dashboard" className="side__brand">
            <span className="nav__mark" aria-hidden="true">हस</span>
            <span className="side__word">HastSetu</span>
          </NavLink>
          <div className="topbar__right">
            <StreakChip count={streak} />
            <AccountMenu />
          </div>
        </header>

        <main id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottomnav" aria-label="Primary">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => "bottomnav__tab" + (isActive ? " is-active" : "")}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
