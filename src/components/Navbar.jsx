// Persistent top nav (PRD §5). Wordmark → Home, route links, streak chip,
// avatar menu (Log out / Settings). Collapses to an icon row < 720px.

import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";

const LINKS = [
  { to: "/learn", label: "Learn", icon: "M12 3 2 8l10 5 10-5-10-5Zm0 8v8" },
  { to: "/practice", label: "Practice", icon: "M6 3v18M18 3v18M6 8h12M6 16h12" },
  { to: "/converse", label: "Converse", icon: "M4 5h16v10H8l-4 4V5Z" },
  { to: "/progress", label: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
];

function Icon({ path }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function Navbar() {
  const { session, state, displayName, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  if (!session) return null;
  const initial = (displayName || session.username || "?")[0].toUpperCase();
  const streak = state?.streak?.count || 0;

  return (
    <header className="nav">
      <div className="nav__inner">
        <NavLink to="/" className="nav__brand" aria-label="HastSetu home">
          <span className="nav__mark" aria-hidden="true">हस</span>
          <span className="nav__word">HastSetu</span>
        </NavLink>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => "nav__link" + (isActive ? " is-active" : "")}>
              <Icon path={l.icon} />
              <span className="nav__link-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav__right">
          <div className="pill pill--warm nav__streak" title={`${streak}-day streak`}>
            <span aria-hidden="true">🔥</span>
            <span className="mono">{streak}</span>
            <span className="sr-only">day streak</span>
          </div>

          <div className="nav__avatar-wrap" ref={menuRef}>
            <button type="button" className="nav__avatar"
              aria-haspopup="menu" aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}>
              <span className="nav__avatar-circle" aria-hidden="true">{initial}</span>
              <span className="nav__avatar-name">{session.username}</span>
            </button>
            {menuOpen && (
              <div className="nav__menu" role="menu">
                <button type="button" role="menuitem" className="nav__menu-item"
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}>
                  Settings
                </button>
                <button type="button" role="menuitem" className="nav__menu-item"
                  onClick={() => { setMenuOpen(false); logout(); navigate("/login"); }}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
