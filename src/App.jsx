// App shell: navbar + guarded routes (PRD §5). Every route except /login
// requires a session; unauthenticated navigation redirects to login and
// returns to the intended route afterward.

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./store/StoreContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
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
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/learn" element={<RequireAuth><Learn /></RequireAuth>} />
        <Route path="/learn/:unitId/:signId" element={<RequireAuth><Lesson /></RequireAuth>} />
        <Route path="/practice" element={<RequireAuth><Practice /></RequireAuth>} />
        <Route path="/practice/:tab" element={<RequireAuth><Practice /></RequireAuth>} />
        <Route path="/converse" element={<RequireAuth><Converse /></RequireAuth>} />
        <Route path="/converse/:scenarioId" element={<RequireAuth><Conversation /></RequireAuth>} />
        <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
