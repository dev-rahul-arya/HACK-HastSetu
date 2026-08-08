// Login (PRD §4.0) — the only unguarded route. Dummy client-side auth with a
// one-click "Continue as demo" to keep the judge path frictionless.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import HandConstellation from "../components/HandConstellation.jsx";

export default function Login() {
  const { login, loginAsDemo } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Return to the originally requested route after login.
  const dest = location.state?.from || "/dashboard";

  function submit(e) {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate(dest, { replace: true });
  }

  function demo() {
    loginAsDemo();
    navigate(dest, { replace: true });
  }

  return (
    <main className="auth">
      <div className="auth__bg" aria-hidden="true">
        <HandConstellation activeNode={12} animate={false} className="auth__bg-hand" />
      </div>
      <div className="auth__card">
        <div className="auth__brand">
          <span className="nav__mark" aria-hidden="true">हस</span>
          <div>
            <h1 className="auth__title">HastSetu</h1>
          </div>
        </div>
        <p className="auth__tagline">
          Learn Indian Sign Language with live feedback on your hands.
        </p>

        <form className="auth__form" onSubmit={submit} noValidate>
          {error && (
            <div className="auth__error" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block">
            Log in
          </button>
        </form>

        <div className="auth__divider">or</div>

        <button type="button" className="btn btn--ghost btn--block" onClick={demo}>
          Continue as demo
        </button>

        <p className="auth__hints">
          Try <code>demo / demo123</code>, <code>aarav / hello123</code>, or{" "}
          <code>meera / signs123</code>.
        </p>
        <p className="auth__note">
          Demo build: credentials are local to this device.
        </p>
      </div>
    </main>
  );
}
