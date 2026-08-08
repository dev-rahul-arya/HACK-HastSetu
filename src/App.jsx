// App routing (PRD §5, re-scoped). Public: Landing (/) and Login. Everything
// else lives behind the auth guard inside AppLayout (sidebar + bottom nav).
// Unauthenticated navigation redirects to login and returns to the intended
// route afterward.

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./store/StoreContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Learn from "./pages/Learn.jsx";
import Lesson from "./pages/Lesson.jsx";
import Practice from "./pages/Practice.jsx";
import Converse from "./pages/Converse.jsx";
import Conversation from "./pages/Conversation.jsx";
import Progress from "./pages/Progress.jsx";
import Settings from "./pages/Settings.jsx";

function RequireAuth({ children }) {
  const { authed } = useStore();
  const location = useLocation();
  if (!authed) {
    return (
      <Navigate to="/login" replace
        state={{ from: location.pathname + location.search }} />
    );
  }
  return children;
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:unitId/:signId" element={<Lesson />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:tab" element={<Practice />} />
          <Route path="/converse" element={<Converse />} />
          <Route path="/converse/:scenarioId" element={<Conversation />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
